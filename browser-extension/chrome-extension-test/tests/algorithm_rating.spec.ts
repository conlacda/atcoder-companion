// TODO
/*
Test against a running contest
Test against a past contest
Test for old contest abc040 (not have rating changes)
https://atcoder.jp/contests/wtf22-day1-open/standings/ - same standing should have same performance
Check performance of newcomers

https://atcoder.jp/contests/agc032/standings - page 128
https://atcoder.jp/contests/agc021/standings/virtual - page 1
Check when "Show favs only" check box is clicked
Test when click the refresh button or execute "vueStandings.refresh()"
*/

import {test, expect} from '../fixtures';
import {Page, Locator} from "@playwright/test";

require('dotenv').config({path: './.env'});

test.describe.configure({mode: 'serial'});

let page: Page;

test.beforeAll(async ({context}) => {
    page = await context.newPage();
});

test.afterAll(async () => {
    await page.close();
});

let tableConfigures = {
    perPage: 20,
    showAffiliation: false,
    showRatedOnly: false,
    showFavOnly: false
};


const showAffiliation = async (show: boolean = true): Promise<void> => {
    tableConfigures.showAffiliation = true;
    if (show)
        await page.evaluate(() => vueStandings.showAffiliation = true);
    else
        await page.evaluate(() => vueStandings.showAffiliation = false);
}

const showRatedOnly = async (show: boolean = true): Promise<void> => {
    tableConfigures.showRatedOnly = true;
    if (show)
        await page.evaluate(() => vueStandings.showRatedOnly = true);
    else
        await page.evaluate(() => vueStandings.showRatedOnly = false);
}

const showFavOnly = async (show: boolean = true): Promise<void> => {
    tableConfigures.showFavOnly = true;
    if (show)
        await page.evaluate(() => vueStandings.showFavOnly = true);
    else
        await page.evaluate(() => vueStandings.showFavOnly = false);
}

const setPerPage = async (perPage: number = 1000): Promise<void> => {
    tableConfigures.perPage = perPage;
    await page.locator('a.standings-per-page').getByText(`${perPage}`, {exact: true}).click();
}

const changePage = async (pageNum: number): Promise<void> => {
    await page.getByRole('link', {name: '2', exact: true}).first().click();
}

const resetSettings = async (): Promise<void> => {
    await setPerPage(tableConfigures.perPage);
    await showAffiliation(false)
    await showRatedOnly(false);
    await showFavOnly(false);
}

const testTable = async () => {
    // Check header
    await expect(page.locator('th.ext-added')).toHaveCount(3);
    // Check table's body
    if (!tableConfigures.showFavOnly) {
        await expect(page.locator('td.ext-added')).toHaveCount(tableConfigures.perPage * 3 + 6);
    }
    // Check content format of the added cells
    const tdCells: Locator = page.locator('td.ext-added');
    const tdTextContent: Array<string> = await tdCells.allTextContents();
    for (const text of tdTextContent) {
        let match = false;
        match ||= /^\d+$/gm.test(text); // 2400
        match ||= /^[\+\-±]\d+$/gm.test(text); // +20 -20
        match ||= /^\d+[⭜⭝]\d+$/gm.test(text); // 1500⭜1600 1600⭝1500
        match ||= (text === '-'); // -
        expect(match).toBe(true);
    }
}

test.describe('Test against the contests that have fixed result', (): void => {
    test('The 3 columns should be added by the extension', async (): Promise<void> => {
        await page.goto('https://atcoder.jp/contests/abc360/standings');
        await resetSettings();
        let perPage = 20;
        await testTable();

        await setPerPage(50);
        await showAffiliation();
        await testTable();

        await changePage(2);
        await testTable();

        await setPerPage(10);
        await showRatedOnly();
        await testTable();

        await showFavOnly();
        await testTable();
    });
    
    test('Unrated contests', () => {
        // TODO: https://atcoder.jp/contests/abc306/standings
    });
    
    test('Old contests', () => {
       // TODO: abc040 
    });
});
