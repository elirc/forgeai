import { createPool } from '../packages/database/src/index.js';
import { getConfig } from '../apps/api/src/config.js';
import { seed } from './seed-data.js';
const config = getConfig();
if (config.NODE_ENV === 'production') throw new Error('Demo seeding is forbidden in production');
const pool = createPool(config.DATABASE_URL);
try {
  await seed(pool);
  console.info('Demo data ready. See README for local accounts.');
} finally {
  await pool.end();
}
