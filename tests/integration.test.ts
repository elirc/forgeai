import { createProduct as createProductDirect } from '../apps/api/src/modules/catalog/service.js';
import { checkout as checkoutDirect } from '../apps/api/src/modules/commerce/service.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createPool, migrate, transaction, type Database } from '../packages/database/src/index.js';
import { buildApp } from '../apps/api/src/app.js';
import { seed, DEMO, DEMO_PASSWORD } from '../scripts/seed-data.js';
import { processOneJob, claimJob, retryDelayMs } from '../apps/api/src/platform/jobs.js';
import { SimulatedPaymentProvider } from '../apps/api/src/modules/payments/provider.js';
import { applyPaymentResult } from '../apps/api/src/modules/payments/service.js';
import { productSchema, orderSchema, sessionSchema } from '../packages/contracts/src/index.js';

let pool: Database;
let app: Awaited<ReturnType<typeof buildApp>>;
let cookie: string;
const origin = 'http://localhost:3000';
const base = '/api/tenants/' + DEMO.northstar;
const headers = () => ({ cookie, origin, 'x-forge-request': '1' });
async function signIn(email = 'alex@northstar.example') {
  const result = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { origin, 'x-forge-request': '1' },
    payload: { email, password: DEMO_PASSWORD },
  });
  expect(result.statusCode).toBe(200);
  return result.cookies[0]!.name + '=' + result.cookies[0]!.value;
}
async function addProduct(stock = 1) {
  const result = await app.inject({
    method: 'POST',
    url: base + '/products',
    headers: headers(),
    payload: {
      name: 'Test Product',
      sku: 'TEST-' + randomUUID().slice(0, 8).toUpperCase(),
      category: 'Testing',
      priceCents: 1999,
      stock,
    },
  });
  expect(result.statusCode).toBe(201);
  return productSchema.parse(result.json());
}
async function purchase(productId: string, key = randomUUID(), quantity = 1) {
  return app.inject({
    method: 'POST',
    url: base + '/checkout',
    headers: { ...headers(), 'idempotency-key': key },
    payload: {
      customerName: 'Test Customer',
      customerEmail: 'customer@example.test',
      lines: [{ productId, quantity }],
    },
  });
}
async function makeDue() {
  await pool.query("UPDATE jobs SET available_at=now()-interval '1 second' WHERE state='pending'");
}
async function setChaos(mode: string) {
  await pool.query(
    "INSERT INTO chaos_rules (tenant_id,mode,expires_at) VALUES ($1,$2,now()+interval '5 minutes') ON CONFLICT (tenant_id) DO UPDATE SET mode=EXCLUDED.mode, expires_at=EXCLUDED.expires_at",
    [DEMO.northstar, mode],
  );
}
beforeAll(() => {
  pool = createPool(inject('databaseUrl'));
});
beforeEach(async () => {
  await pool.query('TRUNCATE tenants, users, simulated_provider_payments RESTART IDENTITY CASCADE');
  await seed(pool);
  app = await buildApp(pool, {
    NODE_ENV: 'test',
    DATABASE_URL: inject('databaseUrl'),
    API_PORT: 4000,
    WEB_ORIGIN: origin,
    LOG_LEVEL: 'silent',
    CHAOS_ENABLED: true,
  });
  cookie = await signIn();
});
afterEach(async () => {
  await app.close();
});
afterAll(async () => {
  await pool.end();
});

describe('identity and boundaries', () => {
  it('enforces mutation policy at domain entry points', async () => {
    const principal = { tenantId: DEMO.northstar, userId: DEMO.viewer, role: 'viewer' as const };
    await expect(
      createProductDirect(
        pool,
        principal,
        {
          name: 'Forbidden Product',
          sku: 'FORBIDDEN',
          category: 'Testing',
          priceCents: 100,
          stock: 1,
        },
        'test',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      checkoutDirect(
        pool,
        principal,
        {
          customerName: 'Denied User',
          customerEmail: 'denied@example.test',
          lines: [{ productId: randomUUID(), quantity: 1 }],
        },
        randomUUID(),
        'test',
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await pool.query('SELECT * FROM orders')).rowCount).toBe(0);
    expect((await pool.query("SELECT * FROM products WHERE sku='FORBIDDEN'")).rowCount).toBe(0);
  });
  it('issues an HttpOnly session and rechecks persisted membership', async () => {
    const session = await app.inject({ url: '/api/auth/session', headers: headers() });
    expect(sessionSchema.parse(session.json()).memberships).toHaveLength(1);
    await pool.query('DELETE FROM memberships WHERE tenant_id=$1 AND user_id=$2', [
      DEMO.northstar,
      DEMO.admin,
    ]);
    expect((await app.inject({ url: base + '/products', headers: headers() })).statusCode).toBe(
      404,
    );
  });
  it('rejects anonymous, cross-tenant list, guessed resource and write requests', async () => {
    expect((await app.inject({ url: base + '/products' })).statusCode).toBe(401);
    const other = await pool.query<{ id: string }>('SELECT id FROM products WHERE tenant_id=$1', [
      DEMO.harbor,
    ]);
    expect(
      (await app.inject({ url: '/api/tenants/' + DEMO.harbor + '/products', headers: headers() }))
        .statusCode,
    ).toBe(404);
    expect(
      (await app.inject({ url: base + '/products/' + other.rows[0]!.id, headers: headers() }))
        .statusCode,
    ).toBe(404);
    expect((await purchase(other.rows[0]!.id)).statusCode).toBe(404);
    expect((await pool.query('SELECT * FROM orders')).rowCount).toBe(0);
  });
  it('blocks viewer mutations and operator admin controls', async () => {
    const product = await addProduct();
    cookie = await signIn('viewer@northstar.example');
    expect((await purchase(product.id)).statusCode).toBe(403);
    expect((await app.inject({ url: base + '/products', headers: headers() })).statusCode).toBe(
      200,
    );
    cookie = await signIn('operator@northstar.example');
    expect((await app.inject({ url: base + '/jobs', headers: headers() })).statusCode).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: base + '/chaos',
          headers: headers(),
          payload: { mode: 'payment_decline' },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('rejects foreign origins, invalid passwords, expired and revoked sessions', async () => {
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { origin: 'https://attacker.example', 'x-forge-request': '1' },
          payload: { email: 'alex@northstar.example', password: DEMO_PASSWORD },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { origin, 'x-forge-request': '1' },
          payload: { email: 'alex@northstar.example', password: 'wrong' },
        })
      ).statusCode,
    ).toBe(401);
    await pool.query("UPDATE sessions SET expires_at=now()-interval '1 second'");
    expect((await app.inject({ url: base + '/products', headers: headers() })).statusCode).toBe(
      401,
    );
    cookie = await signIn();
    await app.inject({ method: 'POST', url: '/api/auth/logout', headers: headers(), payload: {} });
    expect((await app.inject({ url: base + '/products', headers: headers() })).statusCode).toBe(
      401,
    );
  });
  it('rate limits failed login attempts', async () => {
    let status = 0;
    for (let attempt = 0; attempt < 9; attempt++) {
      status = (
        await app.inject({
          method: 'POST',
          url: '/api/auth/login',
          headers: { origin, 'x-forge-request': '1' },
          payload: { email: 'missing@example.test', password: 'wrong' },
        })
      ).statusCode;
    }
    expect(status).toBe(429);
  });
});

describe('catalog and database integrity', () => {
  it('validates requests, paginates and treats search as data', async () => {
    const page = await app.inject({ url: base + '/products?limit=2', headers: headers() });
    expect(page.json().items).toHaveLength(2);
    expect(page.json().hasMore).toBe(true);
    expect(
      (await app.inject({ url: base + '/products?limit=1000', headers: headers() })).statusCode,
    ).toBe(400);
    const injection = await app.inject({
      url: base + '/products?search=' + encodeURIComponent("' OR 1=1 --"),
      headers: headers(),
    });
    expect(injection.statusCode).toBe(200);
    expect(injection.json().items).toHaveLength(0);
    const wildcard = await app.inject({ url: base + '/products?search=%25', headers: headers() });
    expect(wildcard.json().items).toHaveLength(0);
  });
  it('rejects stale versions without overwriting a newer product', async () => {
    const product = await addProduct();
    const payload = {
      name: 'Updated Product',
      sku: product.sku,
      category: product.category,
      priceCents: 2500,
      version: product.version,
    };
    const first = await app.inject({
      method: 'PATCH',
      url: base + '/products/' + product.id,
      headers: headers(),
      payload,
    });
    expect(first.statusCode).toBe(200);
    const stale = await app.inject({
      method: 'PATCH',
      url: base + '/products/' + product.id,
      headers: headers(),
      payload: { ...payload, priceCents: 1 },
    });
    expect(stale.statusCode).toBe(409);
    expect(stale.json().error.code).toBe('STALE_VERSION');
    expect(productSchema.parse(first.json()).priceCents).toBe(2500);
  });
  it('enforces tenant-safe foreign keys and stock constraints in PostgreSQL', async () => {
    const product = await addProduct();
    const warehouse = await pool.query<{ id: string }>(
      'SELECT id FROM warehouses WHERE tenant_id=$1',
      [DEMO.harbor],
    );
    await expect(
      pool.query(
        'INSERT INTO inventory (tenant_id,product_id,warehouse_id,on_hand) VALUES ($1,$2,$3,1)',
        [DEMO.northstar, product.id, warehouse.rows[0]!.id],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      pool.query('UPDATE inventory SET reserved=on_hand+1 WHERE product_id=$1', [product.id]),
    ).rejects.toMatchObject({ code: '23514' });
  });
  it('applies migrations idempotently and rolls back failures', async () => {
    await migrate(pool);
    await migrate(pool);
    expect((await pool.query('SELECT * FROM schema_migrations')).rowCount).toBe(1);
    await expect(
      transaction(pool, async (client) => {
        await client.query("INSERT INTO tenants (name,slug) VALUES ('Rollback','rollback')");
        throw new Error('deliberate rollback');
      }),
    ).rejects.toThrow('deliberate rollback');
    expect((await pool.query("SELECT * FROM tenants WHERE slug='rollback'")).rowCount).toBe(0);
  });
});

describe('checkout invariants', () => {
  it('canonicalizes UUID casing before lookup and idempotency comparisons', async () => {
    const product = await addProduct(3);
    const key = randomUUID();
    const first = await purchase(product.id.toUpperCase(), key);
    expect(first.statusCode).toBe(201);
    const retry = await purchase(product.id.toLowerCase(), key);
    expect(retry.statusCode).toBe(200);
    expect(retry.json().id).toBe(first.json().id);
  });
  it('creates order, snapshot, reservation and outbox atomically', async () => {
    const product = await addProduct(3);
    const response = await purchase(product.id, randomUUID(), 2);
    expect(response.statusCode).toBe(201);
    const order = orderSchema.parse(response.json());
    expect(order.totalCents).toBe(3998);
    expect(order.status).toBe('awaiting_payment');
    await pool.query('UPDATE products SET price_cents=1 WHERE id=$1', [product.id]);
    expect(
      (await pool.query('SELECT unit_price_cents FROM order_lines WHERE order_id=$1', [order.id]))
        .rows[0].unit_price_cents,
    ).toBe(1999);
    expect(
      (await pool.query('SELECT reserved FROM inventory WHERE product_id=$1', [product.id])).rows[0]
        .reserved,
    ).toBe(2);
    expect(
      (await pool.query('SELECT * FROM jobs WHERE aggregate_id=$1', [order.id])).rowCount,
    ).toBe(1);
  });
  it('allows exactly one competing purchase of the last item', async () => {
    const product = await addProduct(1);
    const results = await Promise.all([purchase(product.id), purchase(product.id)]);
    expect(results.map((result) => result.statusCode).sort()).toEqual([201, 409]);
    expect((await pool.query('SELECT * FROM orders')).rowCount).toBe(1);
    expect((await pool.query('SELECT * FROM jobs')).rowCount).toBe(1);
    expect(
      (await pool.query('SELECT reserved FROM inventory WHERE product_id=$1', [product.id])).rows[0]
        .reserved,
    ).toBe(1);
  });
  it('coalesces concurrent retries and rejects key reuse for different payloads', async () => {
    const product = await addProduct(5);
    const key = randomUUID();
    const results = await Promise.all([purchase(product.id, key), purchase(product.id, key)]);
    expect(results.map((result) => result.statusCode).sort()).toEqual([200, 201]);
    expect(results[0]!.json().id).toBe(results[1]!.json().id);
    expect((await purchase(product.id, key, 2)).statusCode).toBe(409);
    expect((await pool.query('SELECT * FROM orders')).rowCount).toBe(1);
  });
  it('rolls back earlier reservations when a later item is unavailable', async () => {
    const a = await addProduct(3);
    const b = await addProduct(0);
    const response = await app.inject({
      method: 'POST',
      url: base + '/checkout',
      headers: { ...headers(), 'idempotency-key': randomUUID() },
      payload: {
        customerName: 'Test Customer',
        customerEmail: 'customer@example.test',
        lines: [
          { productId: a.id, quantity: 1 },
          { productId: b.id, quantity: 1 },
        ],
      },
    });
    expect(response.statusCode).toBe(409);
    expect((await pool.query('SELECT * FROM orders')).rowCount).toBe(0);
    expect((await pool.query('SELECT * FROM jobs')).rowCount).toBe(0);
    expect(
      (await pool.query('SELECT reserved FROM inventory WHERE product_id=$1', [a.id])).rows[0]
        .reserved,
    ).toBe(0);
  });
});

describe('worker, failures and fulfillment', () => {
  it('confirms once and consumes stock only once on shipment', async () => {
    const product = await addProduct(4);
    const order = orderSchema.parse((await purchase(product.id)).json());
    const provider = new SimulatedPaymentProvider(pool, true);
    expect(await processOneJob(pool, provider)).toBe(true);
    expect(await processOneJob(pool, provider)).toBe(false);
    expect((await pool.query('SELECT * FROM notifications')).rowCount).toBe(1);
    const [a, b] = await Promise.all(
      [1, 2].map(() =>
        app.inject({
          method: 'POST',
          url: base + '/orders/' + order.id + '/ship',
          headers: headers(),
          payload: {},
        }),
      ),
    );
    expect(a!.statusCode).toBe(200);
    expect(b!.statusCode).toBe(200);
    expect(
      (
        await pool.query('SELECT on_hand, reserved FROM inventory WHERE product_id=$1', [
          product.id,
        ])
      ).rows[0],
    ).toMatchObject({ on_hand: 3, reserved: 0 });
    expect(
      (
        await pool.query("SELECT * FROM stock_movements WHERE order_id=$1 AND reason='shipment'", [
          order.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it('declines and releases inventory without creating fulfillment', async () => {
    const product = await addProduct(2);
    await purchase(product.id);
    await setChaos('payment_decline');
    await processOneJob(pool, new SimulatedPaymentProvider(pool, true));
    expect((await pool.query('SELECT status FROM orders')).rows[0].status).toBe('payment_failed');
    expect(
      (await pool.query('SELECT reserved FROM inventory WHERE product_id=$1', [product.id])).rows[0]
        .reserved,
    ).toBe(0);
    expect((await pool.query('SELECT * FROM shipments')).rowCount).toBe(0);
  });
  it('recovers timeout-after-capture without a second charge', async () => {
    const product = await addProduct(2);
    await purchase(product.id);
    await setChaos('payment_timeout');
    const provider = new SimulatedPaymentProvider(pool, true);
    await processOneJob(pool, provider);
    expect((await pool.query('SELECT status FROM orders')).rows[0].status).toBe('awaiting_payment');
    expect((await pool.query('SELECT * FROM simulated_provider_payments')).rowCount).toBe(1);
    await makeDue();
    await processOneJob(pool, provider);
    expect((await pool.query('SELECT status FROM orders')).rows[0].status).toBe('confirmed');
    expect((await pool.query('SELECT * FROM simulated_provider_payments')).rowCount).toBe(1);
    expect((await pool.query('SELECT attempts FROM jobs')).rows[0].attempts).toBe(2);
  });
  it('recovers an expired worker lease and fences the old worker', async () => {
    const product = await addProduct();
    await purchase(product.id);
    const first = (await claimJob(pool))!;
    const provider = new SimulatedPaymentProvider(pool, true);
    const outcome = await provider.capture({
      tenantId: first.tenant_id,
      orderId: first.aggregate_id,
      amountCents: 1999,
      attempt: 1,
    });
    await pool.query("UPDATE jobs SET lease_until=now()-interval '1 second' WHERE id=$1", [
      first.id,
    ]);
    const second = (await claimJob(pool))!;
    expect(second.lease_token).not.toBe(first.lease_token);
    expect(await applyPaymentResult(pool, first, outcome)).toBe(false);
    expect(await applyPaymentResult(pool, second, outcome)).toBe(true);
    expect((await pool.query('SELECT * FROM notifications')).rowCount).toBe(1);
  });
  it('dead-letters bounded failures and supports audited recovery', async () => {
    const product = await addProduct();
    await purchase(product.id);
    await setChaos('payment_unavailable');
    const provider = new SimulatedPaymentProvider(pool, true);
    for (let attempt = 0; attempt < 5; attempt++) {
      await makeDue();
      await processOneJob(pool, provider);
    }
    const job = (await pool.query<{ id: string; state: string }>('SELECT id, state FROM jobs'))
      .rows[0]!;
    expect(job.state).toBe('dead');
    expect(await processOneJob(pool, provider)).toBe(false);
    await setChaos('none');
    expect(
      (
        await app.inject({
          method: 'POST',
          url: base + '/jobs/' + job.id + '/replay',
          headers: headers(),
          payload: {},
        })
      ).statusCode,
    ).toBe(200);
    await processOneJob(pool, provider);
    expect((await pool.query('SELECT status FROM orders')).rows[0].status).toBe('confirmed');
    expect((await pool.query("SELECT * FROM audit_log WHERE action='job.replayed'")).rowCount).toBe(
      1,
    );
  });
  it('forbids shipping pending orders and expires failure rules', async () => {
    const product = await addProduct();
    const order = orderSchema.parse((await purchase(product.id)).json());
    expect(
      (
        await app.inject({
          method: 'POST',
          url: base + '/orders/' + order.id + '/ship',
          headers: headers(),
          payload: {},
        })
      ).statusCode,
    ).toBe(409);
    await setChaos('payment_decline');
    await pool.query("UPDATE chaos_rules SET expires_at=now()-interval '1 second'");
    await processOneJob(pool, new SimulatedPaymentProvider(pool, true));
    expect((await pool.query('SELECT status FROM orders')).rows[0].status).toBe('confirmed');
  });
  it('bounds exponential backoff and jitter', () => {
    expect(retryDelayMs(1, () => 0)).toBe(500);
    expect(retryDelayMs(3, () => 1)).toBe(4000);
    expect(retryDelayMs(100, () => 1)).toBe(60000);
  });
});
