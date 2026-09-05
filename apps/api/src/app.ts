import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Database } from '../../../packages/database/src/index.js';
import { transaction } from '../../../packages/database/src/index.js';
import {
  loginSchema,
  productInputSchema,
  productEditSchema,
  checkoutSchema,
  pageSchema,
  idSchema,
  tenantParamsSchema,
  idempotencyKeySchema,
  productSchema,
  orderSchema,
  sessionSchema,
  summarySchema,
  chaosSchema,
} from '../../../packages/contracts/src/index.js';
import type { Config } from './config.js';
import { DomainError } from './platform/errors.js';
import { audit } from './platform/audit.js';
import { authorize, getSession, login, logout, requireAdmin } from './modules/identity/service.js';
import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './modules/catalog/service.js';
import { checkout, getOrder, listOrders } from './modules/commerce/service.js';
import { shipOrder } from './modules/fulfillment/service.js';

const cookieName = 'forge_session';
export async function buildApp(pool: Database, config: Config) {
  const app = Fastify({
    logger:
      config.LOG_LEVEL === 'silent'
        ? false
        : {
            level: config.LOG_LEVEL,
            redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers.set-cookie'],
          },
    genReqId: () => randomUUID(),
    requestIdHeader: false,
    bodyLimit: 32_768,
    trustProxy: false,
  });
  await app.register(cookie);
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id);
    reply.header('cache-control', 'no-store');
    reply.header('x-content-type-options', 'nosniff');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (
        request.headers.origin !== config.WEB_ORIGIN ||
        request.headers['x-forge-request'] !== '1'
      ) {
        throw new DomainError(403, 'INVALID_ORIGIN', 'A same-origin request is required.');
      }
    }
  });
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      return reply
        .status(error.status)
        .send({ error: { code: error.code, message: error.message, requestId: request.id } });
    }
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Check the submitted fields.',
          requestId: request.id,
          fields: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      });
    }
    if (error instanceof Error && 'code' in error && error.code === '23505') {
      return reply.status(409).send({
        error: {
          code: 'ALREADY_EXISTS',
          message: 'A record with these unique fields already exists.',
          requestId: request.id,
        },
      });
    }
    const status =
      error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : 500;
    if (status >= 500) request.log.error({ err: error }, 'Request failed');
    return reply.status(status).send({
      error: {
        code: status === 429 ? 'RATE_LIMITED' : status < 500 ? 'INVALID_REQUEST' : 'INTERNAL_ERROR',
        message:
          status === 429
            ? 'Too many requests. Try again shortly.'
            : status < 500
              ? 'The request could not be accepted.'
              : 'An unexpected error occurred.',
        requestId: request.id,
      },
    });
  });
  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({
      error: { code: 'NOT_FOUND', message: 'Endpoint not found.', requestId: request.id },
    }),
  );
  app.get('/api/health', async () => ({ status: 'ok', service: 'forge-api' }));
  app.get('/api/ready', async () => {
    await pool.query('SELECT 1 FROM schema_migrations LIMIT 1');
    return { status: 'ready' };
  });
  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 8, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const input = loginSchema.parse(request.body);
      const token = await login(pool, input.email, input.password);
      reply.setCookie(cookieName, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60,
      });
      return sessionSchema.parse(await getSession(pool, token));
    },
  );
  app.get('/api/auth/session', async (request) =>
    sessionSchema.parse(await getSession(pool, request.cookies[cookieName])),
  );
  app.post('/api/auth/logout', async (request, reply) => {
    await logout(pool, request.cookies[cookieName]);
    reply.clearCookie(cookieName, { path: '/' });
    return { ok: true };
  });
  const prefix = '/api/tenants/:tenantId';
  app.get(prefix + '/products', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    const result = await listProducts(pool, tenantId, pageSchema.parse(request.query));
    return { ...result, items: z.array(productSchema).parse(result.items) };
  });
  app.get(prefix + '/products/:id', async (request) => {
    const { tenantId, id } = tenantParamsSchema.extend(idSchema.shape).parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    return productSchema.parse(await getProduct(pool, tenantId, id));
  });
  app.post(prefix + '/products', async (request, reply) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId, true);
    const product = await createProduct(
      pool,
      principal,
      productInputSchema.parse(request.body),
      request.id,
    );
    return reply.status(201).send(productSchema.parse(product));
  });
  app.patch(prefix + '/products/:id', async (request) => {
    const { tenantId, id } = tenantParamsSchema.extend(idSchema.shape).parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId, true);
    return productSchema.parse(
      await updateProduct(pool, principal, id, productEditSchema.parse(request.body), request.id),
    );
  });
  app.get(prefix + '/orders', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    const result = await listOrders(pool, tenantId, pageSchema.parse(request.query));
    return { ...result, items: z.array(orderSchema).parse(result.items) };
  });
  app.get(prefix + '/orders/:id', async (request) => {
    const { tenantId, id } = tenantParamsSchema.extend(idSchema.shape).parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    return orderSchema.parse(await getOrder(pool, tenantId, id));
  });
  app.post(prefix + '/checkout', async (request, reply) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId, true);
    const key = idempotencyKeySchema.parse(request.headers['idempotency-key']);
    const result = await checkout(
      pool,
      principal,
      checkoutSchema.parse(request.body),
      key,
      request.id,
    );
    reply.header('idempotency-replayed', String(result.replayed));
    return reply.status(result.replayed ? 200 : 201).send(orderSchema.parse(result.order));
  });
  app.post(prefix + '/orders/:id/ship', async (request) => {
    const { tenantId, id } = tenantParamsSchema.extend(idSchema.shape).parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId, true);
    return orderSchema.parse(await shipOrder(pool, principal, id, request.id));
  });
  app.get(prefix + '/summary', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    const result = await pool.query(
      `SELECT
        (SELECT count(*)::int FROM orders WHERE tenant_id=$1) AS orders,
        (SELECT COALESCE(sum(total_cents),0)::float8 FROM orders WHERE tenant_id=$1 AND status IN ('confirmed','shipped')) AS "revenueCents",
        (SELECT count(*)::int FROM orders WHERE tenant_id=$1 AND status='awaiting_payment') AS "awaitingPayment",
        (SELECT count(*)::int FROM shipments WHERE tenant_id=$1 AND state='ready') AS "readyToShip",
        (SELECT count(*)::int FROM inventory WHERE tenant_id=$1 AND on_hand-reserved <= 10) AS "lowStock",
        (SELECT count(*)::int FROM jobs WHERE tenant_id=$1 AND state IN ('pending','running')) AS "jobsPending",
        (SELECT count(*)::int FROM jobs WHERE tenant_id=$1 AND state='dead') AS "jobsFailed"`,
      [tenantId],
    );
    return summarySchema.parse(result.rows[0]);
  });
  app.get(prefix + '/notifications', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    const result = await pool.query(
      'SELECT id, title, body, created_at::text AS "createdAt" FROM notifications WHERE tenant_id=$1 ORDER BY created_at DESC, id LIMIT 30',
      [tenantId],
    );
    return { items: result.rows };
  });
  app.get(prefix + '/activity', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    await authorize(pool, request.cookies[cookieName], tenantId);
    const result = await pool.query(
      'SELECT id, action, resource_id AS "resourceId", correlation_id AS "correlationId", created_at::text AS "createdAt" FROM audit_log WHERE tenant_id=$1 ORDER BY created_at DESC, id LIMIT 30',
      [tenantId],
    );
    return { items: result.rows };
  });
  app.get(prefix + '/jobs', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    requireAdmin(await authorize(pool, request.cookies[cookieName], tenantId));
    const result = await pool.query(
      'SELECT id, type, state, attempts, last_error AS "lastError", correlation_id AS "correlationId", created_at::text AS "createdAt" FROM jobs WHERE tenant_id=$1 ORDER BY created_at DESC, id LIMIT 50',
      [tenantId],
    );
    return { items: result.rows };
  });
  app.post(prefix + '/jobs/:id/replay', async (request) => {
    const { tenantId, id } = tenantParamsSchema.extend(idSchema.shape).parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId);
    requireAdmin(principal);
    await transaction(pool, async (client) => {
      const result = await client.query(
        "UPDATE jobs SET state='pending', attempts=0, available_at=now(), lease_token=NULL, lease_until=NULL WHERE tenant_id=$1 AND id=$2 AND state='dead' RETURNING id",
        [tenantId, id],
      );
      if (!result.rowCount)
        throw new DomainError(409, 'NOT_REPLAYABLE', 'Only a dead-letter job can be replayed.');
      await audit(client, {
        tenantId,
        actorId: principal.userId,
        action: 'job.replayed',
        resourceId: id,
        correlationId: request.id,
      });
    });
    return { ok: true };
  });
  app.get(prefix + '/chaos', async (request) => {
    const { tenantId } = tenantParamsSchema.parse(request.params);
    requireAdmin(await authorize(pool, request.cookies[cookieName], tenantId));
    const result = await pool.query<{ mode: string; expiresAt: string }>(
      'SELECT mode, expires_at::text AS "expiresAt" FROM chaos_rules WHERE tenant_id=$1 AND expires_at > now()',
      [tenantId],
    );
    return {
      enabled: config.CHAOS_ENABLED,
      mode: config.CHAOS_ENABLED ? (result.rows[0]?.mode ?? 'none') : 'none',
      expiresAt: result.rows[0]?.expiresAt ?? null,
    };
  });
  app.post(prefix + '/chaos', async (request) => {
    if (!config.CHAOS_ENABLED || config.NODE_ENV === 'production')
      throw new DomainError(404, 'NOT_FOUND', 'Failure injection is disabled.');
    const { tenantId } = tenantParamsSchema.parse(request.params);
    const principal = await authorize(pool, request.cookies[cookieName], tenantId);
    requireAdmin(principal);
    const { mode } = chaosSchema.parse(request.body);
    await transaction(pool, async (client) => {
      await client.query(
        "INSERT INTO chaos_rules (tenant_id, mode, expires_at) VALUES ($1,$2,now()+interval '5 minutes') ON CONFLICT (tenant_id) DO UPDATE SET mode=EXCLUDED.mode, expires_at=EXCLUDED.expires_at",
        [tenantId, mode],
      );
      await audit(client, {
        tenantId,
        actorId: principal.userId,
        action: 'chaos.configured',
        correlationId: request.id,
        details: { mode },
      });
    });
    return { ok: true, mode };
  });
  return app;
}
