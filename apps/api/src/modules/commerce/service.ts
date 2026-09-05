import { createHash } from 'node:crypto';
import { z } from 'zod';
import { checkoutSchema, type Order } from '../../../../../packages/contracts/src/index.js';
import { transaction, type Database } from '../../../../../packages/database/src/index.js';
import { requireWrite, type Principal } from '../identity/service.js';
import { reserve } from '../inventory/service.js';
import { audit } from '../../platform/audit.js';
import { DomainError } from '../../platform/errors.js';

export const orderColumns = `id, number, customer_name AS "customerName", customer_email AS "customerEmail",
  status, total_cents AS "totalCents", currency, created_at::text AS "createdAt"`;
export async function getOrder(pool: Database, tenantId: string, id: string) {
  const result = await pool.query<Order>(
    `SELECT ${orderColumns} FROM orders WHERE tenant_id=$1 AND id=$2`,
    [tenantId, id],
  );
  if (!result.rows[0]) throw new DomainError(404, 'NOT_FOUND', 'Order not found.');
  return result.rows[0];
}
export async function listOrders(
  pool: Database,
  tenantId: string,
  page: { limit: number; offset: number; search: string },
) {
  const result = await pool.query<Order>(
    `SELECT ${orderColumns} FROM orders WHERE tenant_id=$1 AND (customer_name ILIKE $2 OR number::text ILIKE $2)
    ORDER BY created_at DESC, id LIMIT $3 OFFSET $4`,
    [tenantId, '%' + page.search.replace(/[\\%_]/g, '\\$&') + '%', page.limit + 1, page.offset],
  );
  return { items: result.rows.slice(0, page.limit), hasMore: result.rows.length > page.limit };
}
export async function checkout(
  pool: Database,
  principal: Principal,
  rawInput: z.infer<typeof checkoutSchema>,
  key: string,
  correlationId: string,
) {
  requireWrite(principal);
  const input = {
    ...rawInput,
    lines: [...rawInput.lines].sort((a, b) => a.productId.localeCompare(b.productId)),
  };
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const result = await transaction(pool, async (client) => {
    // Serialize identical keys before checking for a committed result.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      principal.tenantId + ':' + principal.userId + ':' + key,
    ]);
    const existing = await client.query<{ id: string; request_hash: string }>(
      'SELECT id, request_hash FROM orders WHERE tenant_id=$1 AND actor_id=$2 AND idempotency_key=$3',
      [principal.tenantId, principal.userId, key],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== fingerprint)
        throw new DomainError(
          409,
          'IDEMPOTENCY_CONFLICT',
          'This idempotency key was used for a different checkout.',
        );
      return { id: existing.rows[0].id, replayed: true };
    }
    const products = await client.query<{
      id: string;
      name: string;
      sku: string;
      price_cents: number;
    }>(
      'SELECT id, name, sku, price_cents FROM products WHERE tenant_id=$1 AND id=ANY($2::uuid[]) ORDER BY id FOR SHARE',
      [principal.tenantId, input.lines.map((line) => line.productId)],
    );
    if (products.rowCount !== input.lines.length)
      throw new DomainError(404, 'NOT_FOUND', 'One or more products were not found.');
    const quantities = new Map(input.lines.map((line) => [line.productId, line.quantity]));
    const total = products.rows.reduce(
      (sum, product) => sum + product.price_cents * quantities.get(product.id)!,
      0,
    );
    const created = await client.query<{ id: string }>(
      `INSERT INTO orders (tenant_id, actor_id, customer_name, customer_email, status, total_cents, idempotency_key, request_hash)
       VALUES ($1,$2,$3,$4,'awaiting_payment',$5,$6,$7) RETURNING id`,
      [
        principal.tenantId,
        principal.userId,
        input.customerName,
        input.customerEmail,
        total,
        key,
        fingerprint,
      ],
    );
    const orderId = created.rows[0]!.id;
    for (const product of products.rows) {
      const quantity = quantities.get(product.id)!;
      await client.query(
        'INSERT INTO order_lines (tenant_id, order_id, product_id, product_name, sku, quantity, unit_price_cents) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          principal.tenantId,
          orderId,
          product.id,
          product.name,
          product.sku,
          quantity,
          product.price_cents,
        ],
      );
      await reserve(client, {
        tenantId: principal.tenantId,
        orderId,
        productId: product.id,
        quantity,
      });
    }
    await client.query(
      'INSERT INTO payment_intents (tenant_id, order_id, amount_cents) VALUES ($1,$2,$3)',
      [principal.tenantId, orderId, total],
    );
    // This row is both a domain outbox entry and the initial durable command queue.
    await client.query(
      "INSERT INTO jobs (tenant_id, type, aggregate_id, correlation_id, payload) VALUES ($1,'payment.requested',$2,$3,$4)",
      [principal.tenantId, orderId, correlationId, JSON.stringify({ orderId })],
    );
    await audit(client, {
      tenantId: principal.tenantId,
      actorId: principal.userId,
      action: 'order.created',
      resourceId: orderId,
      correlationId,
      details: { totalCents: total },
    });
    return { id: orderId, replayed: false };
  });
  return { order: await getOrder(pool, principal.tenantId, result.id), replayed: result.replayed };
}
