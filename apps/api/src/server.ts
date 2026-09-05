import { createPool } from '../../../packages/database/src/index.js';
import { buildApp } from './app.js';
import { getConfig } from './config.js';
const config = getConfig();
const pool = createPool(config.DATABASE_URL);
const app = await buildApp(pool, config);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => pool.end());
  });
}
try {
  await app.listen({ port: config.API_PORT, host: '127.0.0.1' });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exitCode = 1;
}
