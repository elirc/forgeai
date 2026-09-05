'use client';
import {
  Activity,
  ArrowRight,
  Boxes,
  CreditCard,
  ShoppingBag,
  Truck,
  Workflow,
  AlertTriangle,
  CircleDot,
} from 'lucide-react';
import { formatMoney } from '../../../packages/contracts/src/index';
import type { Tab, WorkspaceData } from '../lib/workspace-data';
import { ActivityList, OrdersTable } from './tables';

export function Dashboard({
  data,
  navigate,
  busy,
  canWrite,
  onShip,
}: {
  data: WorkspaceData;
  navigate: (tab: Tab) => void;
  busy: boolean;
  canWrite: boolean;
  onShip: (id: string) => void;
}) {
  return (
    <>
      <div className="metric-grid">
        <Metric
          label="Confirmed revenue"
          value={formatMoney(data.summary.revenueCents)}
          detail="Confirmed & shipped orders"
          icon={<CreditCard size={19} />}
        />
        <Metric
          label="Total orders"
          value={String(data.summary.orders)}
          detail={data.summary.awaitingPayment + ' awaiting payment'}
          icon={<ShoppingBag size={19} />}
        />
        <Metric
          label="Ready to ship"
          value={String(data.summary.readyToShip)}
          detail="Payment confirmed, stock reserved"
          icon={<Truck size={19} />}
        />
        <Metric
          label="Low-stock items"
          value={String(data.summary.lowStock)}
          detail="10 or fewer available units"
          icon={<Boxes size={19} />}
          warn={data.summary.lowStock > 0}
        />
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>The latest movements in your business.</p>
            </div>
            <button className="text-button" onClick={() => navigate('orders')}>
              View all <ArrowRight size={15} />
            </button>
          </div>
          <OrdersTable
            orders={data.orders.slice(0, 6)}
            busy={busy}
            canWrite={canWrite}
            onShip={onShip}
          />
        </section>
        <section className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h2>Stock watch</h2>
              <p>Keep the next order moving.</p>
            </div>
            <span className="icon-tile peach">
              <Boxes size={18} />
            </span>
          </div>
          {[...data.products]
            .sort((a, b) => a.available - b.available)
            .slice(0, 5)
            .map((product) => (
              <div className="stock-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <span className={product.available <= 10 ? 'orange-text' : 'muted'}>
                    {product.available} left
                  </span>
                </div>
                <div className="stock-track">
                  <span
                    style={{
                      width:
                        Math.max(
                          2,
                          product.onHand ? (product.available / product.onHand) * 100 : 0,
                        ) + '%',
                    }}
                    className={product.available <= 10 ? 'low' : ''}
                  />
                </div>
                <small>
                  {product.reserved} reserved · {product.sku}
                </small>
              </div>
            ))}
          <button className="text-button stock-link" onClick={() => navigate('inventory')}>
            Manage inventory <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <div className="overview-grid bottom-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Activity feed</h2>
              <p>A shared record of what happened.</p>
            </div>
            <Activity size={19} />
          </div>
          <ActivityList items={data.activity.slice(0, 4)} />
        </section>
        <section className="workflow-card">
          <span className="workflow-symbol">
            <Workflow size={28} />
          </span>
          <p className="eyebrow">WORKING BEHIND THE SCENES</p>
          <h2>
            From checkout
            <br />
            to ready for shipping.
          </h2>
          <p>
            Payments, reservations, and notifications stay connected through durable background
            work.
          </p>
          <div className="workflow-state">
            <span className="status-dot" />
            {data.summary.jobsPending} pending jobs<span>·</span>
            {data.summary.jobsFailed} need review
          </div>
          <small>Payment and shipping providers are simulated.</small>
        </section>
      </div>
    </>
  );
}
function Metric({
  label,
  value,
  detail,
  icon,
  warn,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <section className="metric">
      <div className="metric-top">
        <span>{label}</span>
        <span className={'icon-tile ' + (warn ? 'peach' : '')}>{icon}</span>
      </div>
      <strong className="metric-value">{value}</strong>
      <p>
        <span className={warn ? 'orange-text' : 'green-text'}>
          {warn ? <AlertTriangle size={13} /> : <CircleDot size={12} />}
        </span>
        {detail}
      </p>
    </section>
  );
}
