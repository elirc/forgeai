import { setTimeout as delay } from 'node:timers/promises';
import { createPool } from '../../../packages/database/src/index.js';
import { getConfig } from '../../api/src/config.js';
import { processOneJob } from '../../api/src/platform/jobs.js';
import { SimulatedPaymentProvider } from '../../api/src/modules/payments/provider.js';

const config = getConfig();
const pool = createPool(config.DATABASE_URL);
const provider = new SimulatedPaymentProvider(pool, config.CHAOS_ENABLED);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    stopping = true;
  });
console.info(
  JSON.stringify({
    level: 'info',
    service: 'forge-worker',
    event: 'started',
    provider: 'simulated',
  }),
);
try {
  while (!stopping) {
    try {
      if (!(await processOneJob(pool, provider))) await delay(500);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: 'error',
          service: 'forge-worker',
          event: 'poll_failed',
          message: error instanceof Error ? error.message : 'Unknown failure',
        }),
      );
      await delay(2000);
    }
  }
} finally {
  await pool.end();
}
