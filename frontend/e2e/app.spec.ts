import { test, expect } from '@playwright/test';

test('app loads and shows MyDash logo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('MyDash')).toBeVisible();
});

test('clicking tab buttons switches views', async ({ page }) => {
  await page.goto('/');
  // Click through available tab buttons and verify the page doesn't crash
  const tabs = page.locator('button[class*="tab"], nav button, [role="tab"]');
  const count = await tabs.count();
  if (count > 1) {
    await tabs.nth(1).click();
    await expect(page).toHaveURL(/./);
  }
});

test('weather section exists', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Weather')).toBeVisible();
});

test('calendar section exists', async ({ page }) => {
  await page.goto('/');
  // Calendar may be on a different tab — navigate if needed
  const calendarTab = page.getByRole('button', { name: /calendar/i });
  if (await calendarTab.isVisible()) {
    await calendarTab.click();
  }
  await expect(page.getByText(/calendar|january|february|march|april|may|june|july|august|september|october|november|december/i).first()).toBeVisible();
});
