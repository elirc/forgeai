import { z } from 'zod';
try {
  process.loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('postgresql://forge:forge_local_only@127.0.0.1:54329/forge'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),
  CHAOS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});
export function getConfig() {
  const config = schema.parse(process.env);
  if (config.NODE_ENV === 'production') {
    if (config.CHAOS_ENABLED) throw new Error('Chaos is forbidden in production');
    if (!config.WEB_ORIGIN.startsWith('https://'))
      throw new Error('Production requires HTTPS WEB_ORIGIN');
    if (!process.env.DATABASE_URL || config.DATABASE_URL.includes('forge_local_only'))
      throw new Error('Production requires non-demo database credentials');
  }
  return config;
}
export type Config = ReturnType<typeof getConfig>;
