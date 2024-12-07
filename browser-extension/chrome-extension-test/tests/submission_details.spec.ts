import { test, expect } from '../fixtures';
import { Page, Locator, Download } from "@playwright/test";
import * as fs from 'fs';

require('dotenv').config({ path: './.env' });

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({ mode: 'serial' });

let page: Page;
const EXTENDED_PROBLEM_SUBMISSION_URL: string = 'https://atcoder.jp/contests/abc298/submissions/60492340';
const CE_SUBMISSION_URL = 'https://atcoder.jp/contests/abc298/submissions/60492314';
const MAPPING_PROBLEM_SUBMISSION_URL = 'https://atcoder.jp/contests/abc044/submissions/60493350';

test.beforeAll(async ({ context }) => {
    page = await context.newPage();
});

test.afterAll(async () => {
    await page.close();
});

test.describe('Extension functions correctly on the submission details page', () => {
    test.describe('Copy button - extended problem', () => {
        test('Copy input', async () => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-in-0');
            const copiedButton: Locator = page.locator('#copied-in-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            const copiedText = await page.evaluate(() => navigator.clipboard.readText());
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toBe('5344525153411253');
        });
        test('Copy input - mapping problem', async () => {
            await page.goto(MAPPING_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-in-0');
            const copiedButton: Locator = page.locator('#copied-in-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            const copiedText = await page.evaluate(() => navigator.clipboard.readText());
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toBe('53100009000');
        });
        test('Copy output - extended problem', async () => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-out-0');
            const copiedButton: Locator = page.locator('#copied-out-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            const copiedText = await page.evaluate(() => navigator.clipboard.readText());
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toContain('463');
        });
        test('Copy output - mapping problem', async () => {
            await page.goto(MAPPING_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-out-0');
            const copiedButton: Locator = page.locator('#copied-out-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            const copiedText = await page.evaluate(() => navigator.clipboard.readText());
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toContain('48000');
        });
    });

    test.describe('Download button', () => {
        test('Download input', async () => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const downloadButton: Locator = page.locator('#download-in-0');
            const downloadPromise = page.waitForEvent('download');
            await downloadButton.click();
            const download: Download = await downloadPromise;
            expect(download.suggestedFilename()).toBe("in-sample00.txt");
            await download.saveAs(download.suggestedFilename());
            const contents = await fs.promises.readFile(await download.path(), 'utf-8');
            const onlyNumberText = contents.replace(/\D/g, '');
            expect(onlyNumberText).toContain('5344525153411253');
        });
        test('Download output', async () => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const downloadButton: Locator = page.locator('#download-out-0');
            const downloadPromise = page.waitForEvent('download');
            await downloadButton.click();
            const download: Download = await downloadPromise;
            expect(download.suggestedFilename()).toBe("out-sample00.txt");
            await download.saveAs(download.suggestedFilename());
            const contents = await fs.promises.readFile(await download.path(), 'utf-8');
            const onlyNumberText = contents.replace(/\D/g, '');
            expect(onlyNumberText).toContain('463');
        });
    })

    test('Debug button', async () => {
        await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
        const debugButton: Locator = page.locator('#debug-0');
        await debugButton.click();
        await page.waitForURL('https://atcoder.jp/contests/abc298/custom_test?submissionId=60492340&testcase=sample00&problem=Ex');
    });

    test('Do not show the debug button in a table that is not the result table', async () => {
        await page.goto(CE_SUBMISSION_URL);
        const debugButton: Locator = page.locator('th:has-text("Debug")');
        await expect(debugButton).toHaveCount(0);
    });
});
