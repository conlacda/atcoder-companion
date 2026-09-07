import {test as base, chromium, type BrowserContext} from '@playwright/test';
import * as path from 'path';

export * from '@playwright/test';

export const test = base.extend<{}, {
    sharedContext: BrowserContext;
    extensionId: string;
}>({
    // Connect to an already authenticated Chrome when PLAYWRIGHT_CDP_URL is set.
    // Otherwise, launch Playwright's Chromium with the unpacked extension.
    sharedContext: [async ({}, use) => {
        const cdpUrl = process.env.PLAYWRIGHT_CDP_URL;

        if (cdpUrl) {
            const browser = await chromium.connectOverCDP(cdpUrl);
            const context = browser.contexts()[0];

            if (!context) {
                await browser.close();
                throw new Error(`No browser context found at ${cdpUrl}`);
            }

            await context.grantPermissions(['clipboard-read', 'clipboard-write']);
            await use(context);
            await browser.close();
            return;
        }

        const pathToExtension = path.join(__dirname, '../chrome-extension');
        const context = await chromium.launchPersistentContext('.auth/browser-profile', {
            headless: false,
            permissions: ['clipboard-read', 'clipboard-write'],
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
            ],
        });
        await use(context);
        await context.close();
    }, {scope: 'worker'}],
    extensionId: [async ({sharedContext}, use) => {
        const configuredExtensionId = process.env.PLAYWRIGHT_EXTENSION_ID;
        if (configuredExtensionId) {
            await use(configuredExtensionId);
            return;
        }

        // for manifest v3:
        let background = sharedContext.serviceWorkers().find(
            worker => worker.url().endsWith('/scripts/background.js'),
        );
        if (!background)
            background = await sharedContext.waitForEvent('serviceworker', {
                predicate: worker => worker.url().endsWith('/scripts/background.js'),
            });

        const extensionId = background.url().split('/')[2];
        await use(extensionId);
    }, {scope: 'worker'}],
});
export const expect = test.expect;
