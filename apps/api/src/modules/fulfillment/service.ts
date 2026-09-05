import { transaction, type Database } from '../../../../../packages/database/src/index.js';
import { requireWrite, type Principal } from '../identity/service.js';
import { settleReservations } from '../inventory/service.js';
import { DomainError } from '../../platform/errors.js';
import { audit } from '../../platform/audit.js';
import { getOrder } from '../commerce/service.js';

export async function shipOrder(
  pool: Database,
  principal: Principal,
  orderId: string,
  correlationId: string,
) {
  requireWrite(principal);
  await transaction(pool, async (client) => {
    const result = await client.query<{ status: string }>(
      'SELECT status FROM orders WHERE tenant_id=$1 AND id=$2 FOR UPDATE',
      [principal.tenantId, orderId],
    );
    const order = result.rows[0];
    if (!order) throw new DomainError(404, 'NOT_FOUND', 'Order not found.');
    if (order.status === 'shipped') return;
    if (order.status !== 'confirmed')
      throw new DomainError(409, 'INVALID_TRANSITION', 'Only a confirmed order can ship.');
    await settleReservations(client, principal.tenantId, orderId, 'consumed');
    await client.query(
      "UPDATE shipments SET state='shipped', tracking_reference=$3 WHERE tenant_id=$1 AND order_id=$2",
      [principal.tenantId, orderId, 'SIM-' + orderId.slice(0, 8).toUpperCase()],
    );
    await client.query("UPDATE orders SET status='shipped' WHERE tenant_id=$1 AND id=$2", [
      principal.tenantId,
      orderId,
    ]);
    await audit(client, {
      tenantId: principal.tenantId,
      actorId: principal.userId,
      action: 'order.shipped',
      resourceId: orderId,
      correlationId,
    });
  });
  return getOrder(pool, principal.tenantId, orderId);
}
