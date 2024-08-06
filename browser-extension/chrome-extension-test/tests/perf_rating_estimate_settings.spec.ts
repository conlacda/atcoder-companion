import { test, expect } from '../fixtures';
import { Page, Locator, Download } from "@playwright/test";

require('dotenv').config({ path: './.env' });

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({ mode: 'serial' });

let page: Page;
let _extensionId: string;

test.beforeAll(async ({ context, extensionId }) => {
    page = await context.newPage();
    // because we have the set up step, dont put extensionId into the following tests directly like test('Test something', async ({extensionId}) => {}));
    // it makes the test run twice, then playwright will crash
    _extensionId = extensionId;
});

test.afterAll(async () => {
    await page.close();
});

test.describe('Test settings for perf/rating estimation', () => {
    test('Always show', async () => {
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await page.locator('#prediction-0').click();
        await page.locator('#save-settings').click();

        await page.goto('https://atcoder.jp');
        const userSettingsMeta: Locator = page.locator('meta[name="user_settings_ext_added"]');
        const userSettings = JSON.parse(await userSettingsMeta.getAttribute('content') ?? '');
        expect(userSettings.prediction).toEqual(0);
    });

    test('Show for past contests only', async () => {
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await page.locator('#prediction-1').click();
        await page.locator('#save-settings').click();

        await page.goto('https://atcoder.jp/contests/abc360/standings');
        await expect(page.locator('.ext-added')).not.toHaveCount(0);
        await page.goto('https://atcoder.jp/contests/abc360/standings/virtual');
        await expect(page.locator('.ext-added')).not.toHaveCount(0);

        const userSettingsMeta: Locator = page.locator('meta[name="user_settings_ext_added"]');
        const userSettings = JSON.parse(await userSettingsMeta.getAttribute('content') ?? '');
        expect(userSettings.prediction).toEqual(1);
    });

    test('Disabled', async () => {
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await page.locator('#prediction-2').click();
        await page.locator('#save-settings').click();
        
        await page.goto('https://atcoder.jp/contests/abc360/standings');
        await expect(page.locator('.ext-added')).toHaveCount(0);
        await page.goto('https://atcoder.jp/contests/abc360/standings/virtual');
        await expect(page.locator('.ext-added')).toHaveCount(0);

        const userSettingsMeta: Locator = page.locator('meta[name="user_settings_ext_added"]');
        const userSettings = JSON.parse(await userSettingsMeta.getAttribute('content') ?? '');
        expect(userSettings.prediction).toEqual(2);
    });
});
