import type { Database } from '../../../../../packages/database/src/index.js';

export type PaymentResult = {
  reference: string;
  state: 'succeeded' | 'declined';
  amount_cents: number;
};
export interface PaymentProvider {
  capture(input: {
    tenantId: string;
    orderId: string;
    amountCents: number;
    attempt: number;
  }): Promise<PaymentResult>;
}
// This adapter is an executable local simulator. No money leaves Forge.
export class SimulatedPaymentProvider implements PaymentProvider {
  constructor(
    private readonly pool: Database,
    private readonly chaosEnabled: boolean,
  ) {}
  async capture(input: {
    tenantId: string;
    orderId: string;
    amountCents: number;
    attempt: number;
  }): Promise<PaymentResult> {
    const previous = await this.pool.query<PaymentResult>(
      'SELECT reference, state, amount_cents FROM simulated_provider_payments WHERE idempotency_key=$1',
      [input.orderId],
    );
    if (previous.rows[0]) {
      if (previous.rows[0].amount_cents !== input.amountCents)
        throw new Error('PROVIDER_IDEMPOTENCY_CONFLICT');
      return previous.rows[0];
    }
    const rules = this.chaosEnabled
      ? await this.pool.query<{ mode: string }>(
          'SELECT mode FROM chaos_rules WHERE tenant_id=$1 AND expires_at > now()',
          [input.tenantId],
        )
      : { rows: [] };
    const mode = rules.rows[0]?.mode ?? 'none';
    if (mode === 'payment_unavailable') throw new Error('PROVIDER_UNAVAILABLE');
    const result = await this.pool.query<PaymentResult>(
      `INSERT INTO simulated_provider_payments (idempotency_key, amount_cents, state) VALUES ($1,$2,$3)
       ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key
       RETURNING reference, state, amount_cents`,
      [input.orderId, input.amountCents, mode === 'payment_decline' ? 'declined' : 'succeeded'],
    );
    if (mode === 'payment_timeout' && input.attempt === 1)
      throw new Error('PROVIDER_TIMEOUT_AFTER_CAPTURE');
    return result.rows[0]!;
  }
}
