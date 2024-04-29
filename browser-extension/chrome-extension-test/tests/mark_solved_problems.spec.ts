import {test, expect} from '../fixtures';
import {Page} from "@playwright/test";
require('dotenv').config({path: './.env'});

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({context}) => {
    page = await context.newPage();
    await page.goto('https://atcoder.jp/login');
    const username = process.env.ATCODER_USERNAME;
    const password = process.env.ATCODER_PASSWORD;
    await page.fill('input[id="username"]', username);
    await page.fill('input[id="password"]', password);
    await page.locator('#submit').click();

    await page.waitForURL('https://atcoder.jp/home');
    await expect(page.getByText(`Welcome, ${process.env.ATCODER_USERNAME}.`)).toBeVisible();
})

test('example test', async () => {
    await page.goto('https://atcoder.jp/contests/abc301/tasks');
    await expect(page.locator('table').nth(0)).toContainText('Status');
});

test.afterAll(async () => {
    await page.close();
})
