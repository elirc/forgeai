import type { Transaction } from '../../../../../packages/database/src/index.js';
import { DomainError } from '../../platform/errors.js';

export async function reserve(
  client: Transaction,
  input: {
    tenantId: string;
    orderId: string;
    productId: string;
    quantity: number;
  },
) {
  const result = await client.query<{ warehouse_id: string }>(
    `UPDATE inventory SET reserved = reserved + $3
     WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id = (
       SELECT warehouse_id FROM inventory WHERE tenant_id=$1 AND product_id=$2 ORDER BY warehouse_id LIMIT 1
     ) AND on_hand - reserved >= $3 RETURNING warehouse_id`,
    [input.tenantId, input.productId, input.quantity],
  );
  if (!result.rows[0])
    throw new DomainError(
      409,
      'INSUFFICIENT_STOCK',
      'One or more items no longer have enough stock.',
    );
  await client.query(
    'INSERT INTO reservations (tenant_id, order_id, product_id, warehouse_id, quantity) VALUES ($1,$2,$3,$4,$5)',
    [input.tenantId, input.orderId, input.productId, result.rows[0].warehouse_id, input.quantity],
  );
}
// Caller holds the order row lock, so two outcomes cannot settle the same reservation.
export async function settleReservations(
  client: Transaction,
  tenantId: string,
  orderId: string,
  outcome: 'released' | 'consumed',
) {
  const reservations = await client.query<{
    product_id: string;
    warehouse_id: string;
    quantity: number;
  }>(
    "UPDATE reservations SET state=$3 WHERE tenant_id=$1 AND order_id=$2 AND state='held' RETURNING product_id, warehouse_id, quantity",
    [tenantId, orderId, outcome],
  );
  for (const reservation of reservations.rows.sort((a, b) =>
    a.product_id.localeCompare(b.product_id),
  )) {
    await client.query(
      'UPDATE inventory SET reserved=reserved-$4, on_hand=on_hand-$5 WHERE tenant_id=$1 AND product_id=$2 AND warehouse_id=$3',
      [
        tenantId,
        reservation.product_id,
        reservation.warehouse_id,
        reservation.quantity,
        outcome === 'consumed' ? reservation.quantity : 0,
      ],
    );
    if (outcome === 'consumed')
      await client.query(
        "INSERT INTO stock_movements (tenant_id, product_id, warehouse_id, order_id, quantity, reason) VALUES ($1,$2,$3,$4,$5,'shipment')",
        [
          tenantId,
          reservation.product_id,
          reservation.warehouse_id,
          orderId,
          -reservation.quantity,
        ],
      );
  }
}
