import { test, expect } from '@playwright/test';

test('an operator can create a product, check out and ship its order', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Password', { exact: true }).fill('Forge-demo-2026!');
  await page.getByRole('button', { name: 'Sign in to Forge' }).click();
  await expect(page.getByRole('heading', { name: 'Your operations, in focus.' })).toBeVisible();
  await page.getByRole('button', { name: 'Products', exact: true }).click();
  await page.getByRole('button', { name: 'Add product', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a product' });
  await dialog.getByLabel('Product name').fill('E2E Travel Pouch');
  await dialog.getByLabel('SKU', { exact: true }).fill('E2E-POUCH');
  await dialog.getByLabel('Category').fill('Travel');
  await dialog.getByLabel('Unit price (USD)').fill('29.50');
  await dialog.getByLabel('Opening stock').fill('3');
  await dialog.getByRole('button', { name: 'Add product', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole('row').filter({ hasText: 'E2E Travel Pouch' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: /Review order/ }).click();
  const checkout = page.getByRole('dialog', { name: 'Create an order' });
  await checkout.getByLabel('Customer name').fill('Browser Test Customer');
  await checkout.getByLabel('Customer email').fill('browser@example.test');
  await expect(checkout.getByText('$29.50', { exact: true })).toBeVisible();
  await checkout.getByRole('button', { name: 'Create order', exact: true }).click();
  await expect(checkout).not.toBeVisible();
  const order = page.getByRole('row').filter({ hasText: 'Browser Test Customer' });
  await expect(order).toBeVisible();
  await expect(async () => {
    await page.getByRole('button', { name: 'Refresh workspace' }).click();
    await expect(order.getByText('Ready to ship', { exact: true })).toBeVisible();
  }).toPass({ timeout: 20_000 });
  await order.getByRole('button', { name: 'Ship order', exact: true }).click();
  await expect(order.getByText('Shipped', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inventory', exact: true }).click();
  const inventory = page.getByRole('row').filter({ hasText: 'E2E Travel Pouch' });
  await expect(inventory.getByRole('cell').nth(3)).toHaveText('2');
  await expect(inventory.getByRole('cell').nth(4)).toHaveText('0');
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(page.getByText('Order confirmed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.screenshot({ path: 'test-results/forge-overview.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});

test('viewer sees data without mutation controls; dialogs support keyboard dismissal', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Email address').fill('viewer@northstar.example');
  await page.getByLabel('Password', { exact: true }).fill('Forge-demo-2026!');
  await page.getByRole('button', { name: 'Sign in to Forge' }).click();
  await expect(page.getByRole('heading', { name: 'Your operations, in focus.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create order', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Operations', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Products', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add product', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.getByLabel('Email address').fill('alex@northstar.example');
  await page.getByLabel('Password', { exact: true }).fill('Forge-demo-2026!');
  await page.getByRole('button', { name: 'Sign in to Forge' }).click();
  await page.getByRole('button', { name: 'Create order', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('mobile workspace has usable navigation and academy', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Password', { exact: true }).fill('Forge-demo-2026!');
  await page.getByRole('button', { name: 'Sign in to Forge' }).click();
  await expect(page.getByRole('heading', { name: 'Your operations, in focus.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.getByText('Confirmed revenue', { exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  await page.screenshot({ path: 'test-results/forge-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  await page.goto('/academy');
  await expect(page.getByRole('heading', { name: /Understand the system/ })).toBeVisible();
});
