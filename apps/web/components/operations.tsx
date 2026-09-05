'use client';
import { useEffect, useState } from 'react';
import { Workflow } from 'lucide-react';
import { z } from 'zod';
import type { WorkspaceData } from '../lib/workspace-data';
import { api } from '../lib/api';
export function Operations({
  data,
  root,
  busy,
  action,
}: {
  data: WorkspaceData;
  root: string;
  busy: boolean;
  action: (work: () => Promise<unknown>, message: string) => Promise<void>;
}) {
  const [chaos, setChaos] = useState<{ enabled: boolean; mode: string }>({
    enabled: false,
    mode: 'none',
  });
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () =>
      api(root + '/chaos')
        .then((body) => {
          if (active) {
            setChaos(z.object({ enabled: z.boolean(), mode: z.string() }).parse(body));
            setError('');
          }
        })
        .catch(() => {
          if (active) setError('Could not read failure-console settings.');
        });
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 15_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [root]);
  return (
    <>
      <div className="operations-notice">
        <Workflow size={22} />
        <div>
          <strong>Durable execution, visible outcomes.</strong>
          <p>
            Jobs retry up to five times with backoff. Replay a dead-letter job after resolving the
            cause.
          </p>
        </div>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Background jobs</h2>
          <span className="badge neutral">Payment provider: simulated</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>State</th>
                <th>Attempts</th>
                <th>Last failure</th>
                <th>Recovery</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.type}</strong>
                    <small className="block">Request {job.correlationId.slice(0, 8)}</small>
                  </td>
                  <td>
                    <span
                      className={
                        'badge ' +
                        (job.state === 'dead'
                          ? 'warning'
                          : job.state === 'completed'
                            ? 'positive'
                            : 'neutral')
                      }
                    >
                      {job.state}
                    </span>
                  </td>
                  <td>{job.attempts} / 5</td>
                  <td>
                    <code>{job.lastError ?? '—'}</code>
                  </td>
                  <td>
                    {job.state === 'dead' ? (
                      <button
                        className="button small"
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () =>
                              api(root + '/jobs/' + job.id + '/replay', {
                                method: 'POST',
                                body: '{}',
                              }),
                            'Job queued for replay.',
                          )
                        }
                      >
                        Replay
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.jobs.length && (
            <div className="empty">Create an order to see its background work here.</div>
          )}
        </div>
      </section>
      <section className="panel chaos-panel">
        <div>
          <p className="eyebrow">DEVELOPMENT LAB</p>
          <h2>Failure console</h2>
          <p className="muted">
            {chaos.enabled
              ? 'Tenant-scoped injections expire after five minutes. Reset before replaying a job.'
              : 'Failure injection is disabled. Enable CHAOS_ENABLED in your local environment and restart to run this lab.'}
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
        {chaos.enabled && (
          <label>
            Payment behavior
            <select
              value={chaos.mode}
              disabled={busy}
              onChange={(event) => {
                const mode = event.target.value;
                void action(async () => {
                  await api(root + '/chaos', { method: 'POST', body: JSON.stringify({ mode }) });
                  setChaos({ enabled: true, mode });
                }, 'Failure scenario updated.');
              }}
            >
              <option value="none">Normal operation</option>
              <option value="payment_decline">Decline payment</option>
              <option value="payment_timeout">Timeout after successful charge</option>
              <option value="payment_unavailable">Provider unavailable</option>
            </select>
          </label>
        )}
      </section>
    </>
  );
}
