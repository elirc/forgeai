import EmbeddedPostgres from 'embedded-postgres';
import { mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
export async function startDatabase(name: string, port: number, persistent = true) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error('Unsafe database directory name');
  const directory = resolve('.local', name);
  await mkdir(directory, { recursive: true });
  const pg = new EmbeddedPostgres({
    databaseDir: directory,
    user: 'forge',
    password: 'forge_local_only',
    port,
    persistent,
    authMethod: 'scram-sha-256',
    postgresFlags: ['-h', '127.0.0.1'],
    onLog: () => undefined,
    onError: (message) => console.error(String(message)),
  });
  let initialized = true;
  try {
    await access(resolve(directory, 'PG_VERSION'));
  } catch {
    initialized = false;
  }
  if (!initialized) await pg.initialise();
  await pg.start();
  const client = pg.getPgClient('postgres', '127.0.0.1');
  await client.connect();
  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname='forge'");
    if (!exists.rowCount) await client.query('CREATE DATABASE forge');
  } finally {
    await client.end();
  }
  return { pg, url: 'postgresql://forge:forge_local_only@127.0.0.1:' + port + '/forge' };
}
