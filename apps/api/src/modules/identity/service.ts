import { createHash, randomBytes } from 'node:crypto';
import { hash, verify, Algorithm } from '@node-rs/argon2';
import type { Database } from '../../../../../packages/database/src/index.js';
import type { Role, Session } from '../../../../../packages/contracts/src/index.js';
import { DomainError } from '../../platform/errors.js';

export type Principal = { userId: string; tenantId: string; role: Role };
const passwordOptions = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};
export const hashPassword = (password: string) => hash(password, passwordOptions);
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const dummyHash = hashPassword(randomBytes(32).toString('hex'));

export async function login(pool: Database, email: string, password: string) {
  const result = await pool.query<{ id: string; password_hash: string }>(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email],
  );
  const user = result.rows[0];
  const valid = await verify(user?.password_hash ?? (await dummyHash), password);
  if (!user || !valid)
    throw new DomainError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,now() + interval '8 hours')",
    [tokenHash(token), user.id],
  );
  return token;
}
export async function getSession(pool: Database, token?: string): Promise<Session> {
  if (!token || token.length > 128)
    throw new DomainError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to continue.');
  const result = await pool.query<Session['user']>(
    'SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now()',
    [tokenHash(token)],
  );
  const user = result.rows[0];
  if (!user)
    throw new DomainError(
      401,
      'AUTHENTICATION_REQUIRED',
      'Your session has expired. Sign in again.',
    );
  const memberships = await pool.query<Session['memberships'][number]>(
    'SELECT t.id AS "tenantId", t.name, t.slug, m.role FROM memberships m JOIN tenants t ON t.id = m.tenant_id WHERE m.user_id = $1 ORDER BY t.name',
    [user.id],
  );
  return { user, memberships: memberships.rows };
}
export async function authorize(
  pool: Database,
  token: string | undefined,
  tenantId: string,
  write = false,
): Promise<Principal> {
  const session = await getSession(pool, token);
  const membership = session.memberships.find((membership) => membership.tenantId === tenantId);
  if (!membership) throw new DomainError(404, 'NOT_FOUND', 'Workspace not found.');
  const principal = { userId: session.user.id, tenantId, role: membership.role };
  if (write) requireWrite(principal);
  return principal;
}
export function requireWrite(principal: Principal) {
  if (principal.role === 'viewer')
    throw new DomainError(403, 'FORBIDDEN', 'Your role cannot make changes.');
}
export function requireAdmin(principal: Principal) {
  if (principal.role !== 'admin')
    throw new DomainError(403, 'FORBIDDEN', 'Administrator access is required.');
}
export async function logout(pool: Database, token?: string) {
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
}
