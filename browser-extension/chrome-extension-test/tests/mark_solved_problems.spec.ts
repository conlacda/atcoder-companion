import {test, expect} from '../fixtures';
import {Page, Locator} from "@playwright/test";

require('dotenv').config({path: './.env'});

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({mode: 'serial'});

let page: Page;

test.beforeAll(async ({context}) => {
    page = await context.newPage();
});

test.afterAll(async () => {
    await page.close();
});

test('Test status of a participated contest', async () => {
    // Test the status column is added
    await page.goto('https://atcoder.jp/contests/abc292/tasks');
    await expect(page.locator('table').nth(0)).toContainText('Status');

    // Test status of columns
    const tbody: Locator = page.locator('table').locator('tbody');
    await expect(tbody.locator('tr').nth(0).locator('td').nth(0)).toHaveText('AC');
    await expect(tbody.locator('tr').nth(1).locator('td').nth(0)).toHaveText('AC');
    await expect(tbody.locator('tr').nth(2).locator('td').nth(0)).toHaveText('WA');
    await expect(tbody.locator('tr').nth(3).locator('td').nth(0)).toHaveText('AC');
    await expect(tbody.locator('tr').nth(4).locator('td').nth(0)).toHaveText('AC');
    await expect(tbody.locator('tr').nth(5).locator('td').nth(0)).toHaveText('');
    await expect(tbody.locator('tr').nth(6).locator('td').nth(0)).toHaveText('');
    await expect(tbody.locator('tr').nth(7).locator('td').nth(0)).toHaveText('AC');
});

test('Test status of an un-participated contest', async () => {
    await page.goto('https://atcoder.jp/contests/abc100/tasks');
    await expect(page.locator('table').nth(0)).not.toContainText('Status');
})
