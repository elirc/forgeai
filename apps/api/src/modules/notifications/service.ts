import type { Transaction } from '../../../../../packages/database/src/index.js';

export async function notifyPaymentOutcome(
  client: Transaction,
  tenantId: string,
  orderId: string,
  succeeded: boolean,
) {
  await client.query(
    'INSERT INTO notifications (tenant_id, order_id, title, body) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id, order_id) DO NOTHING',
    [
      tenantId,
      orderId,
      succeeded ? 'Order confirmed' : 'Payment declined',
      succeeded
        ? 'Payment is confirmed. Your order is ready for fulfillment.'
        : 'The order was not charged. Reserved inventory has been released.',
    ],
  );
}
