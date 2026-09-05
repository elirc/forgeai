import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { transaction, type Database } from '../../../../packages/database/src/index.js';
import { applyPaymentResult } from '../modules/payments/service.js';
import type { PaymentProvider } from '../modules/payments/provider.js';

export type Job = {
  id: string;
  tenant_id: string;
  type: string;
  schema_version: number;
  aggregate_id: string;
  correlation_id: string;
  payload: unknown;
  attempts: number;
  lease_token: string;
};
export const MAX_ATTEMPTS = 5;
export function retryDelayMs(attempt: number, random = Math.random): number {
  return Math.round(
    Math.min(60_000, 1000 * 2 ** Math.max(0, attempt - 1)) * (0.5 + random() * 0.5),
  );
}
export async function claimJob(pool: Database): Promise<Job | undefined> {
  return transaction(pool, async (client) => {
    await client.query(
      `UPDATE jobs SET state='dead', last_error='RETRY_BUDGET_EXHAUSTED', lease_until=NULL, lease_token=NULL
       WHERE attempts >= $1 AND ((state='running' AND lease_until < now()) OR state='pending')`,
      [MAX_ATTEMPTS],
    );
    const result = await client.query<Job>(
      `UPDATE jobs SET state='running', attempts=attempts+1, lease_token=$1, lease_until=now()+interval '30 seconds'
       WHERE id = (
         SELECT id FROM jobs WHERE attempts < $2 AND ((state='pending' AND available_at <= now()) OR (state='running' AND lease_until < now()))
         ORDER BY available_at, created_at FOR UPDATE SKIP LOCKED LIMIT 1
       ) RETURNING *`,
      [randomUUID(), MAX_ATTEMPTS],
    );
    return result.rows[0];
  });
}
export async function processOneJob(pool: Database, provider: PaymentProvider): Promise<boolean> {
  const job = await claimJob(pool);
  if (!job) return false;
  try {
    const payload = z.object({ orderId: z.uuid() }).strict().parse(job.payload);
    if (
      job.type !== 'payment.requested' ||
      job.schema_version !== 1 ||
      payload.orderId !== job.aggregate_id
    )
      throw new Error('INVALID_EVENT_CONTRACT');
    const intent = await pool.query<{ amount_cents: number }>(
      'SELECT amount_cents FROM payment_intents WHERE tenant_id=$1 AND order_id=$2',
      [job.tenant_id, job.aggregate_id],
    );
    if (!intent.rows[0]) throw new Error('PAYMENT_INTENT_MISSING');
    const result = await provider.capture({
      tenantId: job.tenant_id,
      orderId: job.aggregate_id,
      amountCents: intent.rows[0].amount_cents,
      attempt: job.attempts,
    });
    await applyPaymentResult(pool, job, result);
  } catch (error) {
    const knownErrors = new Set([
      'PROVIDER_UNAVAILABLE',
      'PROVIDER_TIMEOUT_AFTER_CAPTURE',
      'PAYMENT_RESULT_MISMATCH',
      'PAYMENT_INTENT_MISSING',
      'INVALID_EVENT_CONTRACT',
      'PROVIDER_IDEMPOTENCY_CONFLICT',
    ]);
    const code =
      error instanceof Error && knownErrors.has(error.message)
        ? error.message
        : 'JOB_EXECUTION_FAILED';
    await pool.query(
      `UPDATE jobs SET state=$3, last_error=$4, lease_token=NULL, lease_until=NULL,
         available_at=now()+($5 * interval '1 millisecond')
       WHERE id=$1 AND lease_token=$2 AND state='running'`,
      [
        job.id,
        job.lease_token,
        job.attempts >= MAX_ATTEMPTS ? 'dead' : 'pending',
        code,
        retryDelayMs(job.attempts),
      ],
    );
  }
  return true;
}
