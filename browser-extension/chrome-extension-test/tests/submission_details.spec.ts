import { test, expect } from '../fixtures';
import { Page, Locator } from "@playwright/test";

require('dotenv').config({ path: './.env' });

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({ mode: 'serial' });

let page: Page;
const EXTENDED_PROBLEM_SUBMISSION_URL: string = 'https://atcoder.jp/contests/abc298/submissions/60492340';
const CE_SUBMISSION_URL = 'https://atcoder.jp/contests/abc298/submissions/60492314';
const MAPPING_PROBLEM_SUBMISSION_URL = 'https://atcoder.jp/contests/abc044/submissions/60493350';

const captureClipboard = async (
    copyButton: Locator,
    copiedButton: Locator,
    extensionId: string,
) => {
    const cdpSession = await page.context().newCDPSession(page);
    let extensionContextId: number | undefined;

    cdpSession.on('Runtime.executionContextCreated', event => {
        if (event.context.origin === `chrome-extension://${extensionId}`)
            extensionContextId = event.context.id;
    });
    await cdpSession.send('Runtime.enable');

    if (!extensionContextId)
        throw new Error('Atcoder Companion execution context was not found');

    try {
        await cdpSession.send('Runtime.evaluate', {
            contextId: extensionContextId,
            expression: `
                globalThis.__playwrightCopiedText = null;
                navigator.clipboard.writeText = async value => {
                    globalThis.__playwrightCopiedText = value;
                };
            `,
        });

        await copyButton.dispatchEvent('click');
        await expect(copiedButton).toBeVisible();

        let copiedText = '';
        await expect.poll(async () => {
            const response = await cdpSession.send('Runtime.evaluate', {
                contextId: extensionContextId,
                expression: 'globalThis.__playwrightCopiedText',
                returnByValue: true,
            });
            copiedText = String(response.result.value ?? '');
            return copiedText.length > 0;
        }).toBe(true);
        return copiedText;
    } finally {
        await cdpSession.detach();
    }
};

const captureDownload = async (downloadButton: Locator, extensionId: string) => {
    const cdpSession = await page.context().newCDPSession(page);
    let extensionContextId: number | undefined;

    cdpSession.on('Runtime.executionContextCreated', event => {
        if (event.context.origin === `chrome-extension://${extensionId}`)
            extensionContextId = event.context.id;
    });
    await cdpSession.send('Runtime.enable');

    if (!extensionContextId)
        throw new Error('Atcoder Companion execution context was not found');

    try {
        await cdpSession.send('Runtime.evaluate', {
            contextId: extensionContextId,
            expression: `
                globalThis.__playwrightDownloadBlob = null;
                globalThis.__playwrightDownloadName = null;
                const createObjectURL = URL.createObjectURL.bind(URL);
                URL.createObjectURL = blob => {
                    globalThis.__playwrightDownloadBlob = blob;
                    return createObjectURL(blob);
                };
                HTMLAnchorElement.prototype.click = function () {
                    globalThis.__playwrightDownloadName = this.download;
                };
            `,
        });

        await downloadButton.click();
        await expect.poll(async () => {
            const response = await cdpSession.send('Runtime.evaluate', {
                contextId: extensionContextId,
                expression: `Boolean(
                    globalThis.__playwrightDownloadBlob
                    && globalThis.__playwrightDownloadName
                )`,
                returnByValue: true,
            });
            return response.result.value;
        }).toBe(true);

        const response = await cdpSession.send('Runtime.evaluate', {
            contextId: extensionContextId,
            expression: `(async () => ({
                suggestedFilename: globalThis.__playwrightDownloadName,
                contents: await globalThis.__playwrightDownloadBlob.text(),
            }))()`,
            awaitPromise: true,
            returnByValue: true,
        });
        return response.result.value as {
            suggestedFilename: string;
            contents: string;
        };
    } finally {
        await cdpSession.detach();
    }
};

test.beforeAll(async ({ sharedContext: context }) => {
    page = await context.newPage();
});

test.afterAll(async () => {
    await page.close();
});

test.describe('Extension functions correctly on the submission details page', () => {
    test.describe('Copy button - extended problem', () => {
        test('Copy input', async ({ extensionId }) => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-in-0');
            const copiedButton: Locator = page.locator('#copied-in-0');
            const copiedText = await captureClipboard(copyButton, copiedButton, extensionId);
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toBe('5344525153411253');
        });
        test('Copy input - mapping problem', async ({ extensionId }) => {
            await page.goto(MAPPING_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-in-0');
            const copiedButton: Locator = page.locator('#copied-in-0');
            const copiedText = await captureClipboard(copyButton, copiedButton, extensionId);
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toBe('53100009000');
        });
        test('Copy output - extended problem', async ({ extensionId }) => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-out-0');
            const copiedButton: Locator = page.locator('#copied-out-0');
            const copiedText = await captureClipboard(copyButton, copiedButton, extensionId);
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toContain('463');
        });
        test('Copy output - mapping problem', async ({ extensionId }) => {
            await page.goto(MAPPING_PROBLEM_SUBMISSION_URL);
            const copyButton: Locator = page.locator('#copy-out-0');
            const copiedButton: Locator = page.locator('#copied-out-0');
            const copiedText = await captureClipboard(copyButton, copiedButton, extensionId);
            const onlyNumberText = copiedText.replace(/\D/g, '');
            expect(onlyNumberText).toContain('48000');
        });
    });

    test.describe('Download button', () => {
        test('Download input', async ({ extensionId }) => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const downloadButton: Locator = page.locator('#download-in-0');
            const download = await captureDownload(downloadButton, extensionId);
            expect(download.suggestedFilename).toBe("in-sample00.txt");
            const onlyNumberText = download.contents.replace(/\D/g, '');
            expect(onlyNumberText).toContain('5344525153411253');
        });
        test('Download output', async ({ extensionId }) => {
            await page.goto(EXTENDED_PROBLEM_SUBMISSION_URL);
            const downloadButton: Locator = page.locator('#download-out-0');
            const download = await captureDownload(downloadButton, extensionId);
            expect(download.suggestedFilename).toBe("out-sample00.txt");
            const onlyNumberText = download.contents.replace(/\D/g, '');
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
