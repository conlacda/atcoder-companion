import {test as base, chromium, type BrowserContext} from '@playwright/test';
import * as path from 'path';

export * from '@playwright/test';

export const test = base.extend<{
    context: BrowserContext;
    extensionId: string;
}>({
    // Install extension from path
    context: async ({}, use) => {
        const pathToExtension = path.join(__dirname, '../chrome-extension');
        const context = await chromium.launchPersistentContext('', {
            headless: false,
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
            ],
        });
        await use(context);
    },
    extensionId: async ({context}, use) => {
        // for manifest v3:
        let [background] = context.serviceWorkers();
        if (!background)
            background = await context.waitForEvent('serviceworker');

        const extensionId = background.url().split('/')[2];
        await use(extensionId);
    }
});
export const expect = test.expect;
