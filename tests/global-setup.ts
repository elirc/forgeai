import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import type { TestProject } from 'vitest/node';
import { startDatabase } from '../scripts/database-instance.js';
import { createPool, migrate } from '../packages/database/src/index.js';
declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No database port available');
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return address.port;
}
export default async function setup(project: TestProject) {
  // Always allocate a fresh real cluster. Never truncate the developer's database.
  const instance = await startDatabase('test-' + randomUUID(), await freePort(), false);
  const pool = createPool(instance.url);
  try {
    await migrate(pool);
  } catch (error) {
    await pool.end();
    await instance.pg.stop();
    throw error;
  }
  await pool.end();
  project.provide('databaseUrl', instance.url);
  return async () => {
    await instance.pg.stop();
  };
}
