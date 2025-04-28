import {test, expect} from '../fixtures';
import {Page} from "@playwright/test";

require('dotenv').config({path: './.env'});

test.describe.configure({mode: 'serial'});

let page: Page;

test.beforeAll(async ({context}) => {
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

test('Check clipboard after copying', async () => {
    const copyButtons = page.locator('span.btn-copy');
    // First button
    await copyButtons.nth(0).click();
    let copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText.replace(/\r\n/g, '')).toBe('7 7 7 1');

    // 28th button
    await copyButtons.nth(28).click();
    copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText.replace(/\r/g, '')).toBe('4 3\n' +
        '4 1 B\n' +
        '3 2 W\n' +
        '1 3 B\n');

    // Last button
    await copyButtons.nth(51).click();
    copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText.replace(/\r\n/g, '')).toBe('707081320');
});
