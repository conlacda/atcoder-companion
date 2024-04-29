import {test, expect} from '../fixtures';
require('dotenv').config({path: './.env'});

test('example test', async ({page}) => {
    await page.goto('https://atcoder.jp/contests/abc301/tasks');
    await expect(page.locator('table').nth(0)).toContainText('Status');
});
