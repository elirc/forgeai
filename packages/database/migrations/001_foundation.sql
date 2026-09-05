CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL,
  password_hash text NOT NULL
);
CREATE TABLE memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
  PRIMARY KEY (tenant_id, user_id)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
CREATE TABLE warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, name)
);
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  sku text NOT NULL,
  category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents BETWEEN 1 AND 1000000),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, sku)
);
CREATE INDEX products_tenant_page_idx ON products(tenant_id, created_at DESC, id);
CREATE TABLE inventory (
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  on_hand integer NOT NULL CHECK (on_hand >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
  PRIMARY KEY (tenant_id, product_id, warehouse_id),
  FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id),
  FOREIGN KEY (tenant_id, warehouse_id) REFERENCES warehouses(tenant_id, id)
);
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer GENERATED ALWAYS AS IDENTITY UNIQUE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  status text NOT NULL CHECK (status IN ('awaiting_payment', 'confirmed', 'payment_failed', 'shipped')),
  total_cents integer NOT NULL CHECK (total_cents > 0),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, actor_id, idempotency_key)
);
CREATE INDEX orders_tenant_page_idx ON orders(tenant_id, created_at DESC, id);
CREATE TABLE order_lines (
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents > 0),
  PRIMARY KEY (tenant_id, order_id, product_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id),
  FOREIGN KEY (tenant_id, product_id) REFERENCES products(tenant_id, id)
);
CREATE TABLE reservations (
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  state text NOT NULL DEFAULT 'held' CHECK (state IN ('held', 'released', 'consumed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, order_id, product_id),
  FOREIGN KEY (tenant_id, order_id, product_id) REFERENCES order_lines(tenant_id, order_id, product_id),
  FOREIGN KEY (tenant_id, product_id, warehouse_id) REFERENCES inventory(tenant_id, product_id, warehouse_id)
);
CREATE TABLE payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'succeeded', 'declined')),
  provider_reference text,
  UNIQUE (tenant_id, order_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id)
);
-- Simulates an external provider's separate, durable idempotency store.
CREATE TABLE simulated_provider_payments (
  idempotency_key uuid PRIMARY KEY,
  reference uuid NOT NULL DEFAULT gen_random_uuid(),
  amount_cents integer NOT NULL,
  state text NOT NULL CHECK (state IN ('succeeded', 'declined'))
);
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  type text NOT NULL CHECK (type = 'payment.requested'),
  schema_version integer NOT NULL DEFAULT 1,
  aggregate_id uuid NOT NULL,
  correlation_id text NOT NULL,
  payload jsonb NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'running', 'completed', 'dead')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token uuid,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (tenant_id, type, aggregate_id),
  FOREIGN KEY (tenant_id, aggregate_id) REFERENCES orders(tenant_id, id)
);
CREATE INDEX jobs_claim_idx ON jobs(available_at, created_at) WHERE state IN ('pending', 'running');
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  order_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, order_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id)
);
CREATE TABLE shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'ready' CHECK (state IN ('ready', 'shipped')),
  tracking_reference text,
  UNIQUE (tenant_id, order_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id)
);
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  order_id uuid,
  quantity integer NOT NULL CHECK (quantity <> 0),
  reason text NOT NULL CHECK (reason IN ('opening', 'shipment')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, product_id, warehouse_id) REFERENCES inventory(tenant_id, product_id, warehouse_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES orders(tenant_id, id)
);
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_id uuid,
  correlation_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_tenant_time_idx ON audit_log(tenant_id, created_at DESC);
CREATE TABLE chaos_rules (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id),
  mode text NOT NULL CHECK (mode IN ('none', 'payment_decline', 'payment_timeout', 'payment_unavailable')),
  expires_at timestamptz NOT NULL
);
