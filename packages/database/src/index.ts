import pg, { type PoolClient } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export function createPool(connectionString: string) {
  const pool = new pg.Pool({
    connectionString,
    max: 12,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 10_000,
  });
  pool.on('error', (error) => {
    console.error('Unexpected idle PostgreSQL connection error', error.message);
  });
  return pool;
}
export type Database = ReturnType<typeof createPool>;
export type Transaction = PoolClient;
export async function transaction<T>(
  pool: Database,
  work: (client: Transaction) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      discard = true;
    }
    throw error;
  } finally {
    client.release(discard);
  }
}
export async function migrate(pool: Database): Promise<void> {
  await transaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(78345011)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const directory = resolve('packages/database/migrations');
    for (const name of (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort()) {
      const sql = await readFile(resolve(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{ checksum: string }>(
        'SELECT checksum FROM schema_migrations WHERE name = $1',
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum)
          throw new Error('Applied migration changed: ' + name);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [
        name,
        checksum,
      ]);
    }
  });
}
