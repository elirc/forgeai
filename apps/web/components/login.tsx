'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Layers3, ShieldCheck, Box, GitBranch } from 'lucide-react';
import { sessionSchema, type Session } from '../../../packages/contracts/src/index';
import { api } from '../lib/api';
export function Login({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('alex@northstar.example');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      onLogin(
        sessionSchema.parse(
          await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        ),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="login">
      <section className="login-story">
        <a className="brand" href="/">
          <span className="brand-mark">
            <Layers3 size={24} />
          </span>
          forge<span className="brand-dot">.</span>
        </a>
        <div>
          <p className="eyebrow">BUILT TO WORK TOGETHER</p>
          <h1>
            Great operations.
            <br />
            One shared workspace.
          </h1>
          <p className="story-copy">
            From the first order to the last mile. Bring your products, people, and everyday
            decisions together.
          </p>
          <div className="story-features">
            <span>
              <Box size={18} /> Connected commerce
            </span>
            <span>
              <GitBranch size={18} /> Reliable workflows
            </span>
            <span>
              <ShieldCheck size={18} /> Clear accountability
            </span>
          </div>
        </div>
        <p className="login-foot">FORGE / COMMERCE & OPERATIONS</p>
      </section>
      <section className="login-form">
        <div className="login-form-inner">
          <span className="small-label">YOUR WORKSPACE, READY WHEN YOU ARE</span>
          <h2>Welcome back.</h2>
          <p className="muted">Sign in to see what needs your attention.</p>
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="button primary login-submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in to Forge'}
              <ArrowRight size={18} />
            </button>
          </form>
          <aside className="demo-note">
            <strong>Local demo workspace</strong>
            <p>
              Use <code>alex@northstar.example</code>
              <br />
              Password: <code>Forge-demo-2026!</code>
            </p>
            <span>Synthetic data. Payments and shipping are simulated.</span>
          </aside>
          <a className="text-link" href="/academy">
            Explore the Engineering Academy <ArrowRight size={15} />
          </a>
        </div>
      </section>
    </main>
  );
}
