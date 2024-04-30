import { test, expect } from '../fixtures';
import { Page, Locator } from "@playwright/test";

require('dotenv').config({ path: './.env' });

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ context }) => {
    page = await context.newPage();
});

test.afterAll(async () => {
    await page.close();
});

test.describe('Extension functions correctly on the submission details page', () => {
    test.describe('Copy button', () => {
        test('Copy input', async () => {
            page.goto('https://atcoder.jp/contests/abc347/submissions/51807898');
            const copyButton: Locator = page.locator('#copy_in_0');
            const copiedButton: Locator = page.locator('#copied_in_0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("yay");
        });
        test('Copy output', async () => {
            page.goto('https://atcoder.jp/contests/abc347/submissions/51807898');
            const copyButton: Locator = page.locator('#copy_out_0');
            const copiedButton: Locator = page.locator('#copied_out_0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("5");
        });
    });


    // test('Download button', async () => {
    //     page.goto('https://atcoder.jp/contests/abc347/submissions/51807898');

    // });

    // test('Debug button', async () => {
    //     page.goto('https://atcoder.jp/contests/abc347/submissions/51807898');

    // });
});
