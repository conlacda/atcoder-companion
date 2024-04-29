import {test, expect} from '../fixtures';
import {Page} from "@playwright/test";

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
    await page.goto('https://atcoder.jp/contests/abc301/tasks');
    await expect(page.locator('table').nth(0)).toContainText('Status');
});

test('Test status of an un-participated contest', async () => {
    await page.goto('https://atcoder.jp/contests/abc100/tasks');
    await expect(page.locator('table').nth(0)).not.toContainText('Status');
})
