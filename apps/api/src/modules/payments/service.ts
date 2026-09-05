import { transaction, type Database } from '../../../../../packages/database/src/index.js';
import { settleReservations } from '../inventory/service.js';
import { notifyPaymentOutcome } from '../notifications/service.js';
import { audit } from '../../platform/audit.js';
import type { PaymentResult } from './provider.js';

export async function applyPaymentResult(
  pool: Database,
  job: {
    id: string;
    tenant_id: string;
    aggregate_id: string;
    lease_token: string;
    correlation_id: string;
  },
  result: PaymentResult,
): Promise<boolean> {
  return transaction(pool, async (client) => {
    const lease = await client.query(
      "SELECT id FROM jobs WHERE id=$1 AND lease_token=$2 AND state='running' AND lease_until > now() FOR UPDATE",
      [job.id, job.lease_token],
    );
    if (!lease.rowCount) return false;
    const orders = await client.query<{ status: string; total_cents: number }>(
      'SELECT status, total_cents FROM orders WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
      [job.tenant_id, job.aggregate_id],
    );
    const order = orders.rows[0];
    if (!order || order.total_cents !== result.amount_cents)
      throw new Error('PAYMENT_RESULT_MISMATCH');
    if (order.status === 'awaiting_payment') {
      await client.query(
        'UPDATE payment_intents SET state=$3, provider_reference=$4 WHERE tenant_id=$1 AND order_id=$2',
        [job.tenant_id, job.aggregate_id, result.state, result.reference],
      );
      const succeeded = result.state === 'succeeded';
      await client.query('UPDATE orders SET status=$3 WHERE tenant_id=$1 AND id=$2', [
        job.tenant_id,
        job.aggregate_id,
        succeeded ? 'confirmed' : 'payment_failed',
      ]);
      if (succeeded) {
        await client.query(
          'INSERT INTO shipments (tenant_id, order_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [job.tenant_id, job.aggregate_id],
        );
      } else {
        await settleReservations(client, job.tenant_id, job.aggregate_id, 'released');
      }
      await notifyPaymentOutcome(client, job.tenant_id, job.aggregate_id, succeeded);
      await audit(client, {
        tenantId: job.tenant_id,
        action: succeeded ? 'payment.succeeded' : 'payment.declined',
        resourceId: job.aggregate_id,
        correlationId: job.correlation_id,
      });
    }
    await client.query(
      "UPDATE jobs SET state='completed', completed_at=now(), lease_until=NULL, lease_token=NULL, last_error=NULL WHERE id=$1",
      [job.id],
    );
    return true;
  });
}
