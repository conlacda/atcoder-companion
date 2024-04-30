import { test as setup, expect } from '../fixtures';
import {Locator} from "@playwright/test";
require('dotenv').config({path: './.env'});

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
    await page.goto('https://atcoder.jp/login');

    const username: string = process.env.ATCODER_USERNAME;
    const password: string = process.env.ATCODER_PASSWORD;

    // Check if logged in
    let usernameLocator: Locator = page.getByText(process.env.ATCODER_USERNAME);
    if (await usernameLocator.count() > 0) {
        return;
    }

    await page.fill('input[id="username"]', username);
    await page.fill('input[id="password"]', password);
    await page.locator('#submit').click();

    await page.waitForURL('https://atcoder.jp/home');
    await expect(page.getByText(`Welcome, ${process.env.ATCODER_USERNAME}.`)).toBeVisible();
    // End of authentication steps.

    // Store session to authFile
    await page.context().storageState({ path: authFile });
});
