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
    // TODO: should test when user settings's test case size is 0 or INF
    // Scenario: assert default (test case with size not greater than 512KB should be shown)
    // Go to the popup page https://playwright.dev/docs/chrome-extensions
    // Set test case size to 0KB/INF then assert number of showing test cases
    await page.goto('https://atcoder.jp/contests/agc062/tasks/agc062_b');
    const taskStatement: Locator = page.locator('#task-statement');
    await expect(taskStatement).toContainText(`04_handmade_03 Input`);
    await expect(taskStatement).toContainText(`04_handmade_03 Output`);
});
