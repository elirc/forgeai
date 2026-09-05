'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CreditCard, Minus, Plus, X } from 'lucide-react';
import { z } from 'zod';
import { formatMoney, productSchema, type Product } from '../../../packages/contracts/src/index';
import { api } from '../lib/api';
function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ProductDialog({
  root,
  onClose,
  onSaved,
}: {
  root: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const [dollars, cents = ''] = String(form.get('price')).split('.');
    const input = {
      name: form.get('name'),
      sku: form.get('sku'),
      category: form.get('category'),
      priceCents: Number(dollars) * 100 + Number(cents.padEnd(2, '0')),
      stock: Number(form.get('stock')),
    };
    try {
      await api(root + '/products', { method: 'POST', body: JSON.stringify(input) });
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not create product.');
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      title="Add a product"
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form onSubmit={submit} className="dialog-form">
        <p className="muted">Create a catalog item and its opening warehouse stock.</p>
        <label>
          Product name
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="e.g. Ridgeline Travel Pouch"
          />
        </label>
        <div className="form-row">
          <label>
            SKU
            <input name="sku" required pattern="[A-Z0-9-]{2,40}" placeholder="NS-POUCH-07" />
          </label>
          <label>
            Category
            <input name="category" required maxLength={60} placeholder="Everyday carry" />
          </label>
        </div>
        <div className="form-row">
          <label>
            Unit price (USD)
            <input
              name="price"
              required
              inputMode="decimal"
              pattern="[0-9]+(\.[0-9]{1,2})?"
              placeholder="29.00"
            />
          </label>
          <label>
            Opening stock
            <input name="stock" type="number" required min={0} max={1000000} defaultValue={0} />
          </label>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" disabled={pending} onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={pending}>
            {pending ? 'Saving…' : 'Add product'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function CheckoutDialog({
  root,
  cart,
  setCart,
  onClose,
  onSaved,
}: {
  root: string;
  cart: Record<string, number>;
  setCart: (cart: Record<string, number>) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const initialCart = useRef(cart);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const page = z
        .object({ items: z.array(productSchema) })
        .parse(await api(root + '/products?limit=100', { signal: controller.signal }));
      const missing = Object.entries(initialCart.current).filter(
        ([id, quantity]) => quantity > 0 && !page.items.some((product) => product.id === id),
      );
      const extras = await Promise.all(
        missing.map(async ([id]) =>
          productSchema.parse(await api(root + '/products/' + id, { signal: controller.signal })),
        ),
      );
      if (!controller.signal.aborted) {
        setProducts([...page.items, ...extras]);
        setLoaded(true);
      }
    }
    void load().catch(() => {
      if (!controller.signal.aborted)
        setError('Could not load current product availability. Close and try again.');
    });
    return () => controller.abort();
  }, [root]);
  const total = products.reduce(
    (sum, product) => sum + product.priceCents * (cart[product.id] ?? 0),
    0,
  );
  function change(id: string, delta: number) {
    setCart({ ...cart, [id]: Math.max(0, (cart[id] ?? 0) + delta) });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const payload = JSON.stringify({
      customerName: form.get('customerName'),
      customerEmail: form.get('customerEmail'),
      lines: Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([productId, quantity]) => ({ productId, quantity })),
    });
    const storageKey = root + '/checkout-attempt';
    let saved: { payload: string; key: string } | undefined;
    try {
      saved = z
        .object({ payload: z.string(), key: z.string() })
        .parse(JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'));
    } catch {
      /* No previous attempt. */
    }
    const attempt = saved?.payload === payload ? saved : { payload, key: crypto.randomUUID() };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(attempt));
      await api(root + '/checkout', {
        method: 'POST',
        body: payload,
        headers: { 'Idempotency-Key': attempt.key },
      });
      sessionStorage.removeItem(storageKey);
      onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not submit the order. Retry uses the same request key.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      title="Create an order"
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form className="dialog-form" onSubmit={submit}>
        <div className="demo-inline">
          <CreditCard size={17} />
          Simulated payment · no real charge
        </div>
        <div className="form-row">
          <label>
            Customer name
            <input
              name="customerName"
              required
              minLength={2}
              maxLength={100}
              placeholder="Jamie Rivera"
            />
          </label>
          <label>
            Customer email
            <input name="customerEmail" type="email" required placeholder="jamie@example.com" />
          </label>
        </div>
        <p className="small-label">SELECT PRODUCTS · UP TO 20 DIFFERENT ITEMS</p>
        <div className="cart-products">
          {!loaded && <p aria-busy="true">Loading products…</p>}
          {products.map((product) => (
            <div className="cart-line" key={product.id}>
              <div>
                <strong>{product.name}</strong>
                <small>
                  {formatMoney(product.priceCents)} · {product.available} available
                </small>
              </div>
              <div className="quantity">
                <button
                  type="button"
                  aria-label={'Remove ' + product.name}
                  disabled={pending || !cart[product.id]}
                  onClick={() => change(product.id, -1)}
                >
                  <Minus size={14} />
                </button>
                <span>{cart[product.id] ?? 0}</span>
                <button
                  type="button"
                  aria-label={'Add ' + product.name}
                  disabled={pending || (cart[product.id] ?? 0) >= Math.min(100, product.available)}
                  onClick={() => change(product.id, 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="order-total">
          <span>Order total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <p className="muted small">
          USD · Tax and shipping charges are excluded in this local commerce slice. Availability is
          checked again at checkout.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="button primary" disabled={!loaded || pending || total <= 0}>
            {pending ? 'Creating order…' : 'Create order'}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
