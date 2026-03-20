import { expect } from '@playwright/test';

const IS_CI = !!process.env.CI;

export const TIMEOUTS = {
  action: IS_CI ? 15_000 : 10_000,
  navigation: IS_CI ? 30_000 : 15_000,
  appReady: IS_CI ? 30_000 : 15_000,
  authVerify: IS_CI ? 20_000 : 10_000,
};

export async function waitForAppReady(page, path = '/', timeout = TIMEOUTS.appReady) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout });
  await expect(page.locator('#root')).not.toBeEmpty({ timeout });
}
