import { createPool, migrate } from '../packages/database/src/index.js';
import { getConfig } from '../apps/api/src/config.js';
const pool = createPool(getConfig().DATABASE_URL);
try {
  await migrate(pool);
  console.info('Database migrations applied.');
} finally {
  await pool.end();
}
