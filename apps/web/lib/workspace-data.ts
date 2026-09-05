'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import {
  productSchema,
  orderSchema,
  summarySchema,
  notificationSchema,
} from '../../../packages/contracts/src/index';
import { api, ApiError } from './api';
export const activitySchema = z.object({
  id: z.string(),
  action: z.string(),
  resourceId: z.string().nullable(),
  correlationId: z.string(),
  createdAt: z.string(),
});
const jobSchema = z.object({
  id: z.string(),
  type: z.string(),
  state: z.string(),
  attempts: z.number(),
  lastError: z.string().nullable(),
  correlationId: z.string(),
  createdAt: z.string(),
});
const productPageSchema = z.object({ items: z.array(productSchema), hasMore: z.boolean() });
const orderPageSchema = z.object({ items: z.array(orderSchema), hasMore: z.boolean() });
export type Tab =
  'overview' | 'orders' | 'products' | 'inventory' | 'notifications' | 'activity' | 'operations';
export type WorkspaceData = {
  products: z.infer<typeof productSchema>[];
  orders: z.infer<typeof orderSchema>[];
  summary: z.infer<typeof summarySchema>;
  notifications: z.infer<typeof notificationSchema>[];
  activity: z.infer<typeof activitySchema>[];
  jobs: z.infer<typeof jobSchema>[];
  productsMore: boolean;
  ordersMore: boolean;
};
export function useWorkspaceData(
  root: string,
  tab: Tab,
  search: string,
  offset: number,
  isAdmin: boolean,
  onSignOut: () => void,
) {
  const [data, setData] = useState<WorkspaceData>();
  const [error, setError] = useState('');
  const generation = useRef({ value: 0 });
  const load = useCallback(async () => {
    const current = ++generation.current.value;
    try {
      const query = '?limit=25&offset=' + offset + '&search=' + encodeURIComponent(search);
      const [products, orders, summary, notifications, activity, jobs] = await Promise.all([
        api(
          root + '/products' + (tab === 'products' || tab === 'inventory' ? query : '?limit=100'),
        ),
        api(root + '/orders' + (tab === 'orders' ? query : '?limit=25')),
        api(root + '/summary'),
        api(root + '/notifications'),
        api(root + '/activity'),
        isAdmin ? api(root + '/jobs') : Promise.resolve({ items: [] }),
      ]);
      if (current !== generation.current.value) return;
      const productPage = productPageSchema.parse(products);
      const orderPage = orderPageSchema.parse(orders);
      setData({
        products: productPage.items,
        productsMore: productPage.hasMore,
        orders: orderPage.items,
        ordersMore: orderPage.hasMore,
        summary: summarySchema.parse(summary),
        notifications: z.object({ items: z.array(notificationSchema) }).parse(notifications).items,
        activity: z.object({ items: z.array(activitySchema) }).parse(activity).items,
        jobs: z.object({ items: z.array(jobSchema) }).parse(jobs).items,
      });
      setError('');
    } catch (error) {
      if (current !== generation.current.value) return;
      if (error instanceof ApiError && error.status === 401) onSignOut();
      else setError(error instanceof Error ? error.message : 'Could not load this workspace.');
    }
  }, [root, offset, search, tab, isAdmin, onSignOut]);
  useEffect(() => {
    const activeGeneration = generation.current;
    void load();
    const timer = setInterval(() => {
      void load();
    }, 15_000);
    return () => {
      ++activeGeneration.value;
      clearInterval(timer);
    };
  }, [load]);
  return { data, error, setError, load };
}
