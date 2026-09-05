import { z } from 'zod';

const inputUuid = z.uuid().transform((value) => value.toLowerCase());

export const roleSchema = z.enum(['admin', 'operator', 'viewer']);
export type Role = z.infer<typeof roleSchema>;
export const loginSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export const productInputSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    sku: z
      .string()
      .trim()
      .regex(/^[A-Z0-9-]{2,40}$/),
    category: z.string().trim().min(1).max(60),
    priceCents: z.number().int().min(1).max(1_000_000),
    stock: z.number().int().min(0).max(1_000_000),
  })
  .strict();
export const productEditSchema = productInputSchema
  .omit({ stock: true })
  .extend({
    version: z.number().int().positive(),
  })
  .strict();
export const pageSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
    search: z.string().trim().max(100).default(''),
  })
  .strict();
export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2).max(100),
    customerEmail: z.email().max(254),
    lines: z
      .array(
        z
          .object({
            productId: inputUuid,
            quantity: z.number().int().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict()
  .refine(
    (input) => new Set(input.lines.map((line) => line.productId)).size === input.lines.length,
    {
      message: 'Each product must appear only once.',
    },
  );
export const idSchema = z.object({ id: inputUuid });
export const tenantParamsSchema = z.object({ tenantId: inputUuid });
export const idempotencyKeySchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);
export const chaosSchema = z
  .object({
    mode: z.enum(['none', 'payment_decline', 'payment_timeout', 'payment_unavailable']),
  })
  .strict();
export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sku: z.string(),
  category: z.string(),
  priceCents: z.number().int(),
  currency: z.literal('USD'),
  version: z.number().int(),
  onHand: z.number().int(),
  reserved: z.number().int(),
  available: z.number().int(),
});
export type Product = z.infer<typeof productSchema>;
export const orderSchema = z.object({
  id: z.uuid(),
  number: z.number().int(),
  customerName: z.string(),
  customerEmail: z.string(),
  status: z.enum(['awaiting_payment', 'confirmed', 'payment_failed', 'shipped']),
  totalCents: z.number().int(),
  currency: z.literal('USD'),
  createdAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;
export const membershipSchema = z.object({
  tenantId: z.uuid(),
  name: z.string(),
  slug: z.string(),
  role: roleSchema,
});
export const sessionSchema = z.object({
  user: z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
  memberships: z.array(membershipSchema),
});
export type Session = z.infer<typeof sessionSchema>;
export const notificationSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
});
export const summarySchema = z.object({
  orders: z.number(),
  revenueCents: z.number(),
  awaitingPayment: z.number(),
  readyToShip: z.number(),
  lowStock: z.number(),
  jobsPending: z.number(),
  jobsFailed: z.number(),
});
export type Summary = z.infer<typeof summarySchema>;
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
