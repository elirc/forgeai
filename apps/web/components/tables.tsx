'use client';
import { ArrowDownLeft, Package, Plus, ShoppingBag, Truck } from 'lucide-react';
import { z } from 'zod';
import { formatMoney, type Order, type Product } from '../../../packages/contracts/src/index';
import { activitySchema } from '../lib/workspace-data';
const statusNames: Record<Order['status'], string> = {
  awaiting_payment: 'Payment pending',
  confirmed: 'Ready to ship',
  payment_failed: 'Payment declined',
  shipped: 'Shipped',
};

export function OrdersTable({
  orders,
  canWrite,
  busy,
  onShip,
}: {
  orders: Order[];
  canWrite: boolean;
  busy: boolean;
  onShip: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Order / Customer</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Next step</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <strong className="order-id">#FG-{String(order.number).padStart(4, '0')}</strong>
                <small className="block">{order.customerName}</small>
              </td>
              <td>
                <span
                  className={
                    'badge ' +
                    (order.status === 'payment_failed'
                      ? 'warning'
                      : order.status === 'awaiting_payment'
                        ? 'neutral'
                        : 'positive')
                  }
                >
                  <span />
                  {statusNames[order.status]}
                </span>
              </td>
              <td className="money">{formatMoney(order.totalCents)}</td>
              <td>
                {order.status === 'confirmed' && canWrite ? (
                  <button className="button small" disabled={busy} onClick={() => onShip(order.id)}>
                    <Truck size={14} />
                    Ship order
                  </button>
                ) : (
                  <span className="muted">
                    {order.status === 'shipped'
                      ? 'Complete'
                      : order.status === 'payment_failed'
                        ? 'Review payment'
                        : 'Processing'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && (
        <div className="empty">
          <ShoppingBag size={28} />
          <h3>Your next order starts here.</h3>
          <p>Create an order to follow checkout, payment, and fulfillment.</p>
        </div>
      )}
    </div>
  );
}
export function ProductsTable({
  products,
  inventory,
  canWrite,
  cart,
  add,
}: {
  products: Product[];
  inventory: boolean;
  canWrite: boolean;
  cart: Record<string, number>;
  add: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Unit price</th>
            <th>Available</th>
            <th>Reserved</th>
            <th>{inventory ? 'Stock status' : 'Order'}</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="product-cell">
                  <span className="product-art">
                    <Package size={24} />
                  </span>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
                  </span>
                </div>
              </td>
              <td>{product.category}</td>
              <td>{formatMoney(product.priceCents)}</td>
              <td>{product.available}</td>
              <td>{product.reserved}</td>
              <td>
                {!inventory && canWrite ? (
                  <button
                    disabled={
                      product.available === 0 ||
                      (cart[product.id] ?? 0) >= Math.min(100, product.available)
                    }
                    className="button small"
                    onClick={() => add(product.id)}
                  >
                    <Plus size={14} />
                    {cart[product.id] ? 'Added (' + cart[product.id] + ')' : 'Add'}
                  </button>
                ) : (
                  <span className={'badge ' + (product.available <= 10 ? 'warning' : 'positive')}>
                    {product.available === 0
                      ? 'Out of stock'
                      : product.available <= 10
                        ? 'Running low'
                        : 'In stock'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!products.length && <div className="empty">No matching products. Try another search.</div>}
    </div>
  );
}
export function ActivityList({
  items,
  detailed = false,
}: {
  items: z.infer<typeof activitySchema>[];
  detailed?: boolean;
}) {
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div className="activity-item" key={item.id}>
          <span className="activity-icon">
            <ArrowDownLeft size={16} />
          </span>
          <div>
            <strong>{item.action.split('.').join(' · ')}</strong>
            <p>
              {detailed
                ? 'Correlation: ' + item.correlationId
                : 'Recorded in your workspace audit trail'}
            </p>
          </div>
          <time dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
      ))}
      {!items.length && <div className="empty">New activity will appear here.</div>}
    </div>
  );
}
