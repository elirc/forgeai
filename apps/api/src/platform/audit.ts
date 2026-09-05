import type { Transaction } from '../../../../packages/database/src/index.js';
export async function audit(
  client: Transaction,
  entry: {
    tenantId: string;
    actorId?: string;
    action: string;
    resourceId?: string;
    correlationId: string;
    details?: Record<string, unknown>;
  },
) {
  await client.query(
    'INSERT INTO audit_log (tenant_id, actor_id, action, resource_id, correlation_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
    [
      entry.tenantId,
      entry.actorId ?? null,
      entry.action,
      entry.resourceId ?? null,
      entry.correlationId,
      JSON.stringify(entry.details ?? {}),
    ],
  );
}
