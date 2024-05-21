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

test.describe('Test cases should be added as the user settings', () => {
    test('Show sample test cases only', async () => {
        // Set test case size to zero by submitting user setting form
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await expect(page.locator('#save-settings')).toHaveCount(1);
        await page.locator('#testcase-size-0').click();
        await page.locator('#save-settings').click();

        // Test
        await page.goto('https://atcoder.jp/contests/agc062/tasks/agc062_b');
        await expect(page.locator('#task-statement').locator('div.part')).toHaveCount(20);
    });

    test('Show small test cases (<=512KB)', async () => {
        // Set test case size to 512KB by submitting user setting form
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await expect(page.locator('#save-settings')).toHaveCount(1);
        await page.locator('#testcase-size-512').click();
        await page.locator('#save-settings').click();

        // Test
        await page.goto('https://atcoder.jp/contests/agc062/tasks/agc062_b');
        await expect(page.locator('#task-statement').locator('div.part')).toHaveCount(36);
    });

    test('Show all test cases', async () => {
        // Set test case size to INF by submitting user setting form
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await expect(page.locator('#save-settings')).toHaveCount(1);
        await page.locator('#testcase-size-100000000000000').click();
        await page.locator('#save-settings').click();

        // Test
        await page.goto('https://atcoder.jp/contests/agc062/tasks/agc062_b');
        await expect(page.locator('#task-statement').locator('div.part')).toHaveCount(110);
    });
})

test.describe('Test download test cases', () => {
    test('Download test cases button should be displayed', async () => {
        await page.goto('https://atcoder.jp/contests/agc062/tasks/agc062_b');
        await expect(page.getByText('Download all test cases (43KB)')).toBeVisible();

        await page.goto('https://atcoder.jp/contests/abc350/tasks/abc350_g');
        await expect(page.getByText('Download all test cases (249.5MB)')).toBeVisible();
    });

    test('Download test cases as a zip file', async () => {
        await page.goto('https://atcoder.jp/contests/abc346/tasks/abc346_c');
        await expect(page.getByText('Download all test cases (31.5MB)')).toBeVisible();
        const downloadButton: Locator = page.locator('#dltc');
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download: Download = await downloadPromise;
        expect(download.suggestedFilename()).toBe("abc346-C.zip");
        await download.saveAs(download.suggestedFilename());
        // TODO: It should be better to test unzip and then check the folder structure and file contents.
    });
});

test.describe('A dialog should be displayed if the test cases size is too big', () => {
    test('Dismiss the dialog', async () => {
        // Set test case size to INF by submitting user setting form
        await page.goto(`chrome-extension://${_extensionId}/index.html`);
        await page.locator('#testcase-size-100000000000000').click();
        await page.locator('#save-settings').click();

        await page.goto('https://atcoder.jp/contests/abc346/tasks/abc346_c');
        await expect(page.locator('#task-statement').locator('div.part')).toHaveCount(20);
    });
    test('Accept the dialog', async () => {
        // Accept the dialog should be tested after dismissing. Because we cannot rewrite page.on('dialog')
        page.on('dialog', dialog => {
            expect(dialog.message() === 'The size of all the test cases is too large (31.5MB). Loading all of them might make the browser crash. Still load?').toBeTruthy();
            dialog.accept();
        });
        await page.goto('https://atcoder.jp/contests/abc346/tasks/abc346_c');
        await expect(page.locator('#task-statement').locator('div.part')).toHaveCount(58, {timeout: 60 * 1000});
    });
});
