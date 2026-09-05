'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Layers3,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Activity,
  Workflow,
  ArrowUpRight,
  Plus,
  Search,
  RefreshCw,
  LogOut,
  BookOpen,
  ChevronDown,
  Check,
  AlertTriangle,
  ShoppingCart,
  SlidersHorizontal,
} from 'lucide-react';
import { sessionSchema, type Session } from '../../../packages/contracts/src/index';
import { api, ApiError } from '../lib/api';
import { useWorkspaceData, type Tab } from '../lib/workspace-data';
import { Login } from './login';
import { Dashboard } from './dashboard';
import { ActivityList, OrdersTable, ProductsTable } from './tables';
import { Operations } from './operations';
import { CheckoutDialog, ProductDialog } from './dialogs';
const navigation = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'orders', name: 'Orders', icon: ShoppingBag },
  { id: 'products', name: 'Products', icon: Package },
  { id: 'inventory', name: 'Inventory', icon: Boxes },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'activity', name: 'Activity', icon: Activity },
  { id: 'operations', name: 'Operations', icon: Workflow },
] as const;
export function Workspace() {
  const [session, setSession] = useState<Session | null>();
  const [error, setError] = useState('');
  const onSignOut = useCallback(() => setSession(null), []);
  useEffect(() => {
    const controller = new AbortController();
    api('/auth/session', { signal: controller.signal })
      .then((body) => setSession(sessionSchema.parse(body)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) setSession(null);
        else setError('Cannot reach Forge. Check that the API and database are running.');
      });
    return () => controller.abort();
  }, []);
  if (error)
    return (
      <main className="center-state">
        <AlertTriangle />
        <h1>Workspace unavailable</h1>
        <p>{error}</p>
        <button className="button" onClick={() => location.reload()}>
          Try again
        </button>
      </main>
    );
  if (session === undefined)
    return (
      <main className="center-state" aria-busy="true">
        <Layers3 size={38} />
        <p>Opening your workspace…</p>
      </main>
    );
  if (!session) return <Login onLogin={setSession} />;
  return <AuthenticatedWorkspace key={session.user.id} session={session} onSignOut={onSignOut} />;
}
function AuthenticatedWorkspace({
  session,
  onSignOut,
}: {
  session: Session;
  onSignOut: () => void;
}) {
  const [tenantId, setTenantId] = useState(session.memberships[0]?.tenantId ?? '');
  const membership = session.memberships.find((membership) => membership.tenantId === tenantId);
  if (!membership)
    return (
      <main className="center-state">
        <h1>No workspace access</h1>
        <p>Ask an administrator to add your membership.</p>
        <button
          className="button"
          onClick={() => {
            void api('/auth/logout', { method: 'POST', body: '{}' }).then(onSignOut);
          }}
        >
          Sign out
        </button>
      </main>
    );
  return (
    <TenantWorkspace
      key={tenantId}
      session={session}
      membership={membership}
      setTenantId={setTenantId}
      onSignOut={onSignOut}
    />
  );
}
function TenantWorkspace({
  session,
  membership,
  setTenantId,
  onSignOut,
}: {
  session: Session;
  membership: Session['memberships'][number];
  setTenantId: (id: string) => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [showProduct, setShowProduct] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const root = '/tenants/' + membership.tenantId;
  const canWrite = membership.role !== 'viewer';
  const { data, error, setError, load } = useWorkspaceData(
    root,
    tab,
    search,
    offset,
    membership.role === 'admin',
    onSignOut,
  );
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      setNotice(message);
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The action failed.');
    } finally {
      setBusy(false);
    }
  }
  function signOut() {
    setBusy(true);
    void api('/auth/logout', { method: 'POST', body: '{}' })
      .then(onSignOut)
      .catch(() => setError('Sign out failed. Please retry.'))
      .finally(() => setBusy(false));
  }
  function navigate(next: Tab) {
    setTab(next);
    setSearch('');
    setOffset(0);
  }
  function onShip(id: string) {
    void action(
      () => api(root + '/orders/' + id + '/ship', { method: 'POST', body: '{}' }),
      'Order shipped. Inventory updated.',
    );
  }
  const selected = navigation.find((item) => item.id === tab)!;
  const cartCount = Object.values(cart).reduce((sum, value) => sum + value, 0);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Layers3 size={23} />
          </span>
          forge<span className="brand-dot">.</span>
        </a>
        <label className="workspace-picker">
          <span className="workspace-avatar">{membership.name[0]}</span>
          <span className="workspace-label">
            WORKSPACE
            <select
              aria-label="Workspace"
              value={membership.tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            >
              {session.memberships.map((item) => (
                <option key={item.tenantId} value={item.tenantId}>
                  {item.name}
                </option>
              ))}
            </select>
          </span>
          <ChevronDown size={14} />
        </label>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation
            .filter((item) => item.id !== 'operations' || membership.role === 'admin')
            .map((item) => (
              <button
                key={item.id}
                className={'nav-item ' + (tab === item.id ? 'active' : '')}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <item.icon size={19} />
                {item.name}
                {item.id === 'orders' && !!data?.summary.awaitingPayment && (
                  <span className="nav-count">{data.summary.awaitingPayment}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/academy" className="academy-card">
            <BookOpen size={20} />
            <strong>Built to learn from.</strong>
            <span>
              Forge Engineering Academy <ArrowUpRight size={14} />
            </span>
          </a>
          <div className="user-row">
            <span className="avatar">
              {session.user.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </span>
            <span>
              <strong>{session.user.name}</strong>
              <small>{membership.role}</small>
            </span>
            <button className="icon-button" aria-label="Sign out" disabled={busy} onClick={signOut}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="muted">{membership.name}</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{selected.name}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment">
              <span />
              LOCAL WORKSPACE
            </span>
            <button
              className="icon-button"
              aria-label="Refresh workspace"
              onClick={() => void load()}
            >
              <RefreshCw size={16} />
            </button>
            <button
              className="icon-button mobile-only"
              aria-label="Sign out"
              disabled={busy}
              onClick={signOut}
            >
              <LogOut size={17} />
            </button>
            <span className="avatar light">{session.user.name[0]}</span>
          </div>
        </header>
        <main id="main" className="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {tab === 'overview'
                  ? 'THE BIG PICTURE'
                  : 'WORKSPACE / ' + selected.name.toUpperCase()}
              </p>
              <h1>{tab === 'overview' ? 'Your operations, in focus.' : selected.name}</h1>
              <p className="muted">
                {tab === 'overview'
                  ? 'A little clarity for everything you have in motion.'
                  : descriptions[tab]}
              </p>
            </div>
            {canWrite && (
              <button
                className="button primary"
                onClick={() =>
                  tab === 'products' || tab === 'inventory'
                    ? setShowProduct(true)
                    : setShowCheckout(true)
                }
              >
                <Plus size={17} />
                {tab === 'products' || tab === 'inventory' ? 'Add product' : 'Create order'}
              </button>
            )}
          </div>
          {error && (
            <div className="error banner" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="success banner" role="status">
              <Check size={16} />
              {notice}
            </div>
          )}
          {!data ? (
            <div className="panel empty" aria-busy="true">
              Loading workspace data…
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <Dashboard
                  data={data}
                  navigate={navigate}
                  busy={busy}
                  canWrite={canWrite}
                  onShip={onShip}
                />
              )}
              {(tab === 'products' || tab === 'inventory' || tab === 'orders') && (
                <section className="panel">
                  <div className="table-toolbar">
                    <label className="search-field">
                      <Search size={17} />
                      <input
                        aria-label={'Search ' + selected.name.toLowerCase()}
                        placeholder={'Search ' + selected.name.toLowerCase() + '…'}
                        value={search}
                        onChange={(event) => {
                          setSearch(event.target.value);
                          setOffset(0);
                        }}
                      />
                    </label>
                    <span className="muted">
                      <SlidersHorizontal size={15} />{' '}
                      {tab === 'orders' ? 'Newest first' : 'All categories'}
                    </span>
                    {canWrite && cartCount > 0 && (
                      <button className="button primary" onClick={() => setShowCheckout(true)}>
                        <ShoppingCart size={16} /> Review order ({cartCount})
                      </button>
                    )}
                  </div>
                  {tab === 'orders' ? (
                    <OrdersTable
                      orders={data.orders}
                      busy={busy}
                      canWrite={canWrite}
                      onShip={onShip}
                    />
                  ) : (
                    <ProductsTable
                      products={data.products}
                      inventory={tab === 'inventory'}
                      canWrite={canWrite}
                      cart={cart}
                      add={(id) => setCart((cart) => ({ ...cart, [id]: (cart[id] ?? 0) + 1 }))}
                    />
                  )}
                  <div className="pagination">
                    <span>
                      {tab === 'orders' ? data.orders.length : data.products.length} results · Page{' '}
                      {offset / 25 + 1}
                    </span>
                    <button
                      className="button small"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - 25))}
                    >
                      Previous
                    </button>
                    <button
                      className="button small"
                      disabled={!(tab === 'orders' ? data.ordersMore : data.productsMore)}
                      onClick={() => setOffset(offset + 25)}
                    >
                      Next
                    </button>
                  </div>
                </section>
              )}
              {tab === 'notifications' && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Workspace notifications</h2>
                    <span className="muted">Latest 30 payment outcomes</span>
                  </div>
                  <div className="activity-list">
                    {data.notifications.map((notification) => (
                      <article className="activity-item" key={notification.id}>
                        <span className="activity-icon">
                          <Bell size={16} />
                        </span>
                        <div>
                          <strong>{notification.title}</strong>
                          <p>{notification.body}</p>
                        </div>
                        <time dateTime={notification.createdAt}>
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </article>
                    ))}
                    {!data.notifications.length && (
                      <div className="empty">Payment updates will appear here.</div>
                    )}
                  </div>
                </section>
              )}
              {tab === 'activity' && (
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Latest 30 audit events</h2>
                    <span className="muted">Recorded with each domain change</span>
                  </div>
                  <ActivityList items={data.activity} detailed />
                </section>
              )}
              {tab === 'operations' && (
                <Operations data={data} root={root} busy={busy} action={action} />
              )}
              <footer className="page-footer">
                <span>
                  <span className="status-dot" />
                  {error ? 'Connection needs attention' : 'Connected to your workspace'}
                </span>
                <span>Forge · Built with intention.</span>
              </footer>
            </>
          )}
        </main>
      </div>
      {showProduct && (
        <ProductDialog
          root={root}
          onClose={() => setShowProduct(false)}
          onSaved={() => {
            setShowProduct(false);
            setNotice('Product added to your catalog.');
            void load();
          }}
        />
      )}
      {showCheckout && (
        <CheckoutDialog
          root={root}
          cart={cart}
          setCart={setCart}
          onClose={() => setShowCheckout(false)}
          onSaved={() => {
            setShowCheckout(false);
            setCart({});
            navigate('orders');
            setNotice('Order created. Payment processing is underway.');
            void load();
          }}
        />
      )}
    </div>
  );
}
const descriptions: Record<Exclude<Tab, 'overview'>, string> = {
  orders: 'Every order, from checkout to the customer.',
  products: 'The building blocks of your business.',
  inventory: 'A clear view of what is available and what is committed.',
  notifications: 'Payment outcomes, shared with your workspace.',
  activity: 'Follow the decisions and changes across your workspace.',
  operations: 'Inspect background work, recover failures, and learn how it behaves.',
};
