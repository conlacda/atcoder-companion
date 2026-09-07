import { Page } from "@playwright/test";
import { expect, test } from '../fixtures';

require('dotenv').config({ path: './.env' });

test.describe.configure({ mode: 'serial' });

let page: Page;

test.beforeAll(async ({ sharedContext: context }) => {
    page = await context.newPage();
    await page.goto('https://atcoder.jp/contests/abc386/tasks_print');
});

test.afterAll(async () => {
    await page.close();
});

test('Check copy buttons are added', async () => {
    const copyButtons = page.locator('span.btn-copy');
    await expect(copyButtons).toHaveCount(52);
});

test('Check clipboard after copying', async ({ extensionId }) => {
    const copyButtons = page.locator('span.btn-copy');
    const cdpSession = await page.context().newCDPSession(page);
    let extensionContextId: number | undefined;

    cdpSession.on('Runtime.executionContextCreated', event => {
        if (event.context.origin === `chrome-extension://${extensionId}`)
            extensionContextId = event.context.id;
    });
    await cdpSession.send('Runtime.enable');

    if (!extensionContextId)
        throw new Error('Atcoder Companion execution context was not found');

    // Capture what the extension writes without relying on the host OS clipboard.
    await cdpSession.send('Runtime.evaluate', {
        contextId: extensionContextId,
        expression: `
            globalThis.__playwrightCopiedText = null;
            navigator.clipboard.writeText = async value => {
                globalThis.__playwrightCopiedText = value;
            };
        `,
    });

    const readClipboard = async () => {
        const response = await cdpSession.send('Runtime.evaluate', {
            contextId: extensionContextId,
            expression: 'globalThis.__playwrightCopiedText',
            returnByValue: true,
        });
        const copiedText = String(response.result.value ?? '');
        return copiedText.replace(/\r\n?/g, '\n').trimEnd();
    };
    const clickAndExpectClipboard = async (index: number, expected: string) => {
        const button = copyButtons.nth(index);
        await button.click();
        await expect(button).toHaveText('Copied');
        await expect.poll(readClipboard).toBe(expected);
    };

    // First button
    await clickAndExpectClipboard(0, '7 7 7 1');

    // 28th button
    await clickAndExpectClipboard(28, '4 3\n' +
        '4 1 B\n' +
        '3 2 W\n' +
        '1 3 B');

    // Last button
    await clickAndExpectClipboard(51, '707081320');

    await cdpSession.detach();
});
