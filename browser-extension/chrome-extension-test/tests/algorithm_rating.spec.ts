/*
TODO: test the data's correctness
* https://atcoder.jp/contests/wtf22-day1-open/standings/ - same standing should have same performance
* Check performance of newcomers
* Test when click the refresh button or execute "vueStandings.refresh()"
* Rating should never be negative
* Performance of a user with lower rank should be less than or equal to users with higher rank

TODO: test against a running contest
* Algo
* Heuristic 
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
    const tdTextContents: Array<string> = await tdCells.allTextContents();
    for (const text of tdTextContents) {
        let match: boolean = false;
        match ||= /^\d+$/gm.test(text); // 2400
        match ||= /^[\+\-±]\d+$/gm.test(text); // +20 -20
        match ||= /^\d+[⭜⭝]\d+$/gm.test(text); // 1500⭜1600 1600⭝1500
        match ||= (text === '-'); // -
        expect(match).toBe(true);
    }
}

const checkIfThereArePerfOnly = async (): Promise<void> => {
    // Test the performance column
    const allTextContents: string[] = await page.locator('td.ext-added').allTextContents();
    const perfs: string[] = allTextContents.filter((value, i) => {
        if (i % 3 == 0 && i < tableConfigures.perPage * 3) return value;
    });
    for (const perf in perfs) {
        expect(perf).not.toBeNaN();
    }

    // Test the diff & color change column
    const diffsAndColorChanges: string[] = allTextContents.filter((value, i) => {
        if (i % 3 != 0 && i < tableConfigures.perPage * 3) return value;
    });
    for (const item of diffsAndColorChanges) {
        expect(item === '-').toBe(true);
    }
}

test.describe('Test against the contests that have fixed result', (): void => {
    test('The 3 columns should be added by the extension', async (): Promise<void> => {
        await page.goto('https://atcoder.jp/contests/abc360/standings');
        await resetSettings();
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

    test('Unrated contests', async (): Promise<void> => {
        await page.goto('https://atcoder.jp/contests/abc306/standings');
        const tdTextContents: Array<string> = await page.locator('td.ext-added').allTextContents();
        for (const text of tdTextContents) {
            expect(text).toBe('-');
        }
    });

    test('Old contests with data is not correct', async(): Promise<void> => {
        // https://atcoder.jp/contests/agc033/standings - last page
        // Some unrated users contain IsRated = true
        // TODO
    });
});

test.describe('Test the virtual standings tables', (): void => {
    test('Algorithm contests', async (): Promise<void> => {
        await page.goto('https://atcoder.jp/contests/abc365/standings/virtual');
        await resetSettings();
        await setPerPage(100);
        await testTable();
        await checkIfThereArePerfOnly();
        await changePage(2);
        await testTable();
        await checkIfThereArePerfOnly();
    });

    test('Heuristic contests', async (): Promise<void> => {
        await page.goto('https://atcoder.jp/contests/ahc033/standings/virtual');
        await resetSettings();
        await setPerPage(10);
        await testTable();
        await checkIfThereArePerfOnly();
        await changePage(2);
        await testTable();
        await checkIfThereArePerfOnly();
    });
});

test.describe('Test the extended standings tables', () => {
    test('Heuristic contest\'s extended standings table', async () => {
        await page.goto('https://atcoder.jp/contests/ahc033/standings/extended ');
        await resetSettings();
        await setPerPage(1000);
        await testTable();
        await checkIfThereArePerfOnly();
    });
});
