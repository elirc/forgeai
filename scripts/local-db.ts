import { startDatabase } from './database-instance.js';
const { pg } = await startDatabase('postgres', 54329);
console.info('Local PostgreSQL ready at 127.0.0.1:54329. Stop with Ctrl+C.');
const keepAlive = setInterval(() => {}, 60_000);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    if (stopping) return;
    stopping = true;
    clearInterval(keepAlive);
    void pg.stop();
  });
