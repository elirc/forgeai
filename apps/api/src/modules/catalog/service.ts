import { z } from 'zod';
import {
  productInputSchema,
  productEditSchema,
  type Product,
} from '../../../../../packages/contracts/src/index.js';
import { transaction, type Database } from '../../../../../packages/database/src/index.js';
import { requireWrite, type Principal } from '../identity/service.js';
import { DomainError } from '../../platform/errors.js';
import { audit } from '../../platform/audit.js';

const productColumns = `p.id, p.name, p.sku, p.category, p.price_cents AS "priceCents", p.currency, p.version,
  COALESCE(i.on_hand, 0)::int AS "onHand", COALESCE(i.reserved, 0)::int AS reserved,
  COALESCE(i.on_hand - i.reserved, 0)::int AS available`;
const inventoryJoin = `LEFT JOIN LATERAL (
  SELECT sum(on_hand) AS on_hand, sum(reserved) AS reserved FROM inventory WHERE tenant_id = p.tenant_id AND product_id = p.id
) i ON true`;
export async function listProducts(
  pool: Database,
  tenantId: string,
  page: { limit: number; offset: number; search: string },
) {
  const result = await pool.query<Product>(
    `SELECT ${productColumns} FROM products p ${inventoryJoin}
    WHERE p.tenant_id = $1 AND (p.name ILIKE $2 OR p.sku ILIKE $2)
    ORDER BY p.created_at DESC, p.id LIMIT $3 OFFSET $4`,
    [tenantId, '%' + page.search.replace(/[\\%_]/g, '\\$&') + '%', page.limit + 1, page.offset],
  );
  return { items: result.rows.slice(0, page.limit), hasMore: result.rows.length > page.limit };
}
export async function getProduct(pool: Database, tenantId: string, id: string) {
  const result = await pool.query<Product>(
    `SELECT ${productColumns} FROM products p ${inventoryJoin} WHERE p.tenant_id = $1 AND p.id = $2`,
    [tenantId, id],
  );
  if (!result.rows[0]) throw new DomainError(404, 'NOT_FOUND', 'Product not found.');
  return result.rows[0];
}
export async function createProduct(
  pool: Database,
  principal: Principal,
  input: z.infer<typeof productInputSchema>,
  correlationId: string,
) {
  requireWrite(principal);
  const id = await transaction(pool, async (client) => {
    const warehouse = await client.query<{ id: string }>(
      'SELECT id FROM warehouses WHERE tenant_id = $1 ORDER BY id LIMIT 1',
      [principal.tenantId],
    );
    if (!warehouse.rows[0])
      throw new DomainError(409, 'WAREHOUSE_REQUIRED', 'Create a warehouse before adding stock.');
    const product = await client.query<{ id: string }>(
      'INSERT INTO products (tenant_id, name, sku, category, price_cents) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [principal.tenantId, input.name, input.sku, input.category, input.priceCents],
    );
    const id = product.rows[0]!.id;
    await client.query(
      'INSERT INTO inventory (tenant_id, product_id, warehouse_id, on_hand) VALUES ($1,$2,$3,$4)',
      [principal.tenantId, id, warehouse.rows[0].id, input.stock],
    );
    if (input.stock > 0)
      await client.query(
        "INSERT INTO stock_movements (tenant_id, product_id, warehouse_id, quantity, reason) VALUES ($1,$2,$3,$4,'opening')",
        [principal.tenantId, id, warehouse.rows[0].id, input.stock],
      );
    await audit(client, {
      tenantId: principal.tenantId,
      actorId: principal.userId,
      action: 'product.created',
      resourceId: id,
      correlationId,
    });
    return id;
  });
  return getProduct(pool, principal.tenantId, id);
}
export async function updateProduct(
  pool: Database,
  principal: Principal,
  id: string,
  input: z.infer<typeof productEditSchema>,
  correlationId: string,
) {
  requireWrite(principal);
  await transaction(pool, async (client) => {
    const result = await client.query(
      'UPDATE products SET name=$1, sku=$2, category=$3, price_cents=$4, version=version+1 WHERE tenant_id=$5 AND id=$6 AND version=$7 RETURNING id',
      [
        input.name,
        input.sku,
        input.category,
        input.priceCents,
        principal.tenantId,
        id,
        input.version,
      ],
    );
    if (!result.rowCount) {
      const exists = await client.query('SELECT id FROM products WHERE tenant_id=$1 AND id=$2', [
        principal.tenantId,
        id,
      ]);
      if (!exists.rowCount) throw new DomainError(404, 'NOT_FOUND', 'Product not found.');
      throw new DomainError(
        409,
        'STALE_VERSION',
        'This product changed. Refresh before saving again.',
      );
    }
    await audit(client, {
      tenantId: principal.tenantId,
      actorId: principal.userId,
      action: 'product.updated',
      resourceId: id,
      correlationId,
      details: { version: input.version + 1 },
    });
  });
  return getProduct(pool, principal.tenantId, id);
}
