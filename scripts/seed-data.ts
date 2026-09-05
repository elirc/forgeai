import { transaction, type Database } from '../packages/database/src/index.js';
import { hashPassword } from '../apps/api/src/modules/identity/service.js';
import { createProduct } from '../apps/api/src/modules/catalog/service.js';

export const DEMO_PASSWORD = 'Forge-demo-2026!';
export const DEMO = {
  northstar: '10000000-0000-4000-8000-000000000001',
  harbor: '10000000-0000-4000-8000-000000000002',
  admin: '20000000-0000-4000-8000-000000000001',
  viewer: '20000000-0000-4000-8000-000000000002',
  other: '20000000-0000-4000-8000-000000000003',
  operator: '20000000-0000-4000-8000-000000000004',
};
export async function seed(pool: Database) {
  const password = await hashPassword(DEMO_PASSWORD);
  await transaction(pool, async (client) => {
    await client.query(
      "INSERT INTO tenants (id,name,slug) VALUES ($1,'Northstar Supply','northstar'),($2,'Harbor Goods','harbor') ON CONFLICT DO NOTHING",
      [DEMO.northstar, DEMO.harbor],
    );
    for (const [id, email, name] of [
      [DEMO.admin, 'alex@northstar.example', 'Alex Morgan'],
      [DEMO.viewer, 'viewer@northstar.example', 'Sam Taylor'],
      [DEMO.other, 'owner@harbor.example', 'Jordan Lee'],
      [DEMO.operator, 'operator@northstar.example', 'Casey Chen'],
    ]) {
      await client.query(
        'INSERT INTO users (id,email,name,password_hash) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [id, email, name, password],
      );
    }
    await client.query(
      "INSERT INTO memberships (tenant_id,user_id,role) VALUES ($1,$2,'admin'),($1,$3,'viewer'),($4,$5,'admin'),($1,$6,'operator') ON CONFLICT DO NOTHING",
      [DEMO.northstar, DEMO.admin, DEMO.viewer, DEMO.harbor, DEMO.other, DEMO.operator],
    );
    await client.query(
      "INSERT INTO warehouses (tenant_id,name) VALUES ($1,'Portland Warehouse'),($2,'Seattle Warehouse') ON CONFLICT DO NOTHING",
      [DEMO.northstar, DEMO.harbor],
    );
  });
  const products = [
    {
      name: 'Trailhead Daypack',
      sku: 'NS-PACK-01',
      category: 'Packs & bags',
      priceCents: 8900,
      stock: 48,
    },
    {
      name: 'Alpine Insulated Bottle',
      sku: 'NS-BTL-02',
      category: 'Drinkware',
      priceCents: 3400,
      stock: 86,
    },
    {
      name: 'Field Notes Kit',
      sku: 'NS-NOTE-03',
      category: 'Everyday carry',
      priceCents: 1800,
      stock: 8,
    },
    {
      name: 'Ridge Utility Jacket',
      sku: 'NS-JKT-04',
      category: 'Apparel',
      priceCents: 14500,
      stock: 24,
    },
    {
      name: 'Summit Camp Mug',
      sku: 'NS-MUG-05',
      category: 'Drinkware',
      priceCents: 2400,
      stock: 6,
    },
    {
      name: 'Waypoint Canvas Tote',
      sku: 'NS-TOTE-06',
      category: 'Packs & bags',
      priceCents: 4200,
      stock: 37,
    },
  ];
  for (const product of products) {
    const exists = await pool.query('SELECT 1 FROM products WHERE tenant_id=$1 AND sku=$2', [
      DEMO.northstar,
      product.sku,
    ]);
    if (!exists.rowCount)
      await createProduct(
        pool,
        { tenantId: DEMO.northstar, userId: DEMO.admin, role: 'admin' },
        product,
        'demo-seed',
      );
  }
  const otherExists = await pool.query('SELECT 1 FROM products WHERE tenant_id=$1', [DEMO.harbor]);
  if (!otherExists.rowCount)
    await createProduct(
      pool,
      { tenantId: DEMO.harbor, userId: DEMO.other, role: 'admin' },
      {
        name: 'Harbor Dock Rope',
        sku: 'HG-ROPE-01',
        category: 'Marine',
        priceCents: 4500,
        stock: 12,
      },
      'demo-seed',
    );
}
