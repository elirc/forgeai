import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { startDatabase } from './database-instance.js';
import { createPool, migrate } from '../packages/database/src/index.js';
import { seed } from './seed-data.js';
import { buildApp } from '../apps/api/src/app.js';
import { processOneJob } from '../apps/api/src/platform/jobs.js';
import { SimulatedPaymentProvider } from '../apps/api/src/modules/payments/provider.js';

// Next exposes a CommonJS callable; keep this interop at the fixture boundary.
const next = createRequire(import.meta.url)('next') as typeof import('next').default;
process.env.API_PORT = '4001';
process.env.FORGE_E2E = '1';
process.env.NEXT_TELEMETRY_DISABLED = '1';
const shutdownToken = process.env.FORGE_E2E_SHUTDOWN_TOKEN;
if (!shutdownToken) throw new Error('Run this fixture through Playwright');
const database = await startDatabase('e2e-' + randomUUID(), 54339, false);
const pool = createPool(database.url);
await migrate(pool);
await seed(pool);
const api = await buildApp(pool, {
  NODE_ENV: 'test',
  DATABASE_URL: database.url,
  API_PORT: 4001,
  WEB_ORIGIN: 'http://127.0.0.1:3001',
  LOG_LEVEL: 'silent',
  CHAOS_ENABLED: true,
});
await api.listen({ host: '127.0.0.1', port: 4001 });
const web = next({ dev: true, dir: 'apps/web', hostname: '127.0.0.1', port: 3001 });
await web.prepare();
const handler = web.getRequestHandler();
let stopping = false;
const provider = new SimulatedPaymentProvider(pool, true);
const worker = (async () => {
  while (!stopping) {
    await processOneJob(pool, provider);
    await delay(100);
  }
})();
let cleanup: Promise<void> | undefined;
function stopServices() {
  cleanup ??= (async () => {
    stopping = true;
    await worker;
    await api.close();
    await pool.end();
    await database.pg.stop();
    await web.close();
  })();
  return cleanup;
}
const server = createServer((request, response) => {
  if (request.url === '/__fixture/shutdown' && request.method === 'POST') {
    if (request.headers.authorization !== 'Bearer ' + shutdownToken) {
      response.writeHead(403).end();
      return;
    }
    void stopServices()
      .then(() => {
        response.end('stopped', () => {
          server.closeAllConnections();
          server.close();
        });
      })
      .catch((error: unknown) => {
        console.error('Fixture shutdown failed', error);
        response.writeHead(500).end('shutdown failed');
      });
    return;
  }
  void handler(request, response);
});
await new Promise<void>((resolve, reject) => {
  server.once('error', reject);
  server.listen(3001, '127.0.0.1', resolve);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void stopServices().finally(() => {
      server.closeAllConnections();
      server.close();
    });
  });
console.info('Isolated E2E fixture ready at http://127.0.0.1:3001');
