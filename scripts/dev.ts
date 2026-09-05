import { spawn, type ChildProcess } from 'node:child_process';
import { createPool, migrate } from '../packages/database/src/index.js';
import { getConfig } from '../apps/api/src/config.js';
import { startDatabase } from './database-instance.js';
import { seed } from './seed-data.js';

if (process.env.NODE_ENV === 'production')
  throw new Error('Use production entry points, not the demo runner');
const config = getConfig();
const localUrl = 'postgresql://forge:forge_local_only@127.0.0.1:54329/forge';
let database: Awaited<ReturnType<typeof startDatabase>> | undefined;
let pool = createPool(config.DATABASE_URL);
try {
  await pool.query('SELECT 1');
} catch (error) {
  await pool.end();
  if (config.DATABASE_URL !== localUrl) throw error;
  database = await startDatabase('postgres', 54329);
  pool = createPool(database.url);
}
await migrate(pool);
await seed(pool);
await pool.end();
const children: ChildProcess[] = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  await Promise.all(
    children.map((child) =>
      child.exitCode !== null
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            child.once('exit', () => resolve());
          }),
    ),
  );
  if (database) await database.pg.stop();
  process.exitCode = code;
}
function run(args: string[]) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, DATABASE_URL: config.DATABASE_URL, NEXT_TELEMETRY_DISABLED: '1' },
  });
  children.push(child);
  child.once('exit', (code) => {
    if (!stopping) void stop(code ?? 1);
  });
  child.once('error', (error) => {
    console.error(error);
    void stop(1);
  });
}
run(['--import', 'tsx', 'apps/api/src/server.ts']);
run(['--import', 'tsx', 'apps/worker/src/main.ts']);
run(['node_modules/next/dist/bin/next', 'dev', 'apps/web', '--hostname', '127.0.0.1']);
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => {
    void stop();
  });
console.info('Forge is starting at http://localhost:3000');
