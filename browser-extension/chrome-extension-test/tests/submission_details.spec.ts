import {test, expect} from '../fixtures';
import {Page, Locator, Download} from "@playwright/test";
import * as fs from 'fs';

require('dotenv').config({path: './.env'});

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({mode: 'serial'});

let page: Page;

test.beforeAll(async ({context}) => {
    page = await context.newPage();
    const SUBMISSION_URL: string = 'https://atcoder.jp/contests/abc347/submissions/51807898';
    await page.goto(SUBMISSION_URL);
});

test.afterAll(async () => {
    await page.close();
});

test.describe('Extension functions correctly on the submission details page', () => {
    test.describe('Copy button', () => {
        test('Copy input', async () => {
            const copyButton: Locator = page.locator('#copy-in-0');
            const copiedButton: Locator = page.locator('#copied-in-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("yay");
        });
        test('Copy output', async () => {
            const copyButton: Locator = page.locator('#copy-out-0');
            const copiedButton: Locator = page.locator('#copied-out-0');
            await copyButton.dispatchEvent('click');
            await expect(copiedButton).toBeVisible();
            expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("5");
        });
    });
    test.describe('Download button', () => {
        test('Download input', async () => {
            const downloadButton: Locator = page.locator('#download-in-0');
            const downloadPromise = page.waitForEvent('download');
            await downloadButton.click();
            const download: Download = await downloadPromise;
            expect(download.suggestedFilename()).toBe("in-00_sample_01.txt");
            await download.saveAs(download.suggestedFilename());
            const contents = await fs.promises.readFile(await download.path(), 'utf-8');
            expect(contents).toContain("yay");
        });
        test('Download output', async () => {
            const downloadButton: Locator = page.locator('#download-out-0');
            const downloadPromise = page.waitForEvent('download');
            await downloadButton.click();
            const download: Download = await downloadPromise;
            expect(download.suggestedFilename()).toBe("out-00_sample_01.txt");
            await download.saveAs(download.suggestedFilename());
            const contents = await fs.promises.readFile(await download.path(), 'utf-8');
            expect(contents).toContain("5");
        });
    })

    test('Debug button', async () => {
        const debugButton: Locator = page.locator('#debug-0');
        await debugButton.click();
        await page.waitForURL('https://atcoder.jp/contests/abc347/custom_test?submissionId=51807898&testcase=00_sample_01&problem=B');
    });
});
