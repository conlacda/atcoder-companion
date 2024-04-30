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

test('More test cases should be added to problem statement.', async () => {
    await page.goto('https://atcoder.jp/contests/abc347/tasks/abc347_a');
    const taskStatement: Locator = page.locator('#task-statement');
    for (let i = 1; i <= 12; i++) {
        await expect(taskStatement).toContainText(`Test Input ${i}`);
        await expect(taskStatement).toContainText(`Test Output ${i}`);
    }
});
