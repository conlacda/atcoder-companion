import {test, expect} from '../fixtures';
import {Page, Locator} from "@playwright/test";

require('dotenv').config({path: './.env'});

// chromium.launch PersistentContext prevents you from using multiple pages, so do not use parallel mode.
// The parallel mode opens each tab for each test, and the context will be closed after one test.
test.describe.configure({mode: 'serial'});

let page: Page;

test.beforeAll(async ({context}) => {
    page = await context.newPage();
    await page.goto('https://atcoder.jp/contests/abc347/custom_test?submissionId=51807898&testcase=00_sample_01.txt&problem=B');
    const runButton: Locator = page.locator('a.btn.btn-primary:has-text("Run")').first();
    await runButton.click();
});

test.afterAll(async () => {
    await page.close();
});

test('Check if source code contains submission\'s code', async () => {
    const toggleEditorButton: Locator = page.locator('.btn-toggle-editor').first();
    if (await page.locator('.btn-toggle-editor.active:visible').count() == 0) {
        await toggleEditorButton.click();
    }
    const submissionCode: string = `
#include<bits/stdc++.h>

typedef long long ll; // double long double
const ll mod = 1000000007; // 998244353  1000000009  1000000007 // đừng dùng ull
#define int long long // __int128
const int INF = std::numeric_limits<int>::max(); // INT32_MAX  DBL_MAX

using namespace std;

#ifdef DEBUG
#include "debug.cpp"
#else
#define dbg(...)
#define show_exec_time()
#define destructure(a) #a
#endif

signed main(){
    ios::sync_with_stdio(0); cin.tie(0);
#ifdef DEBUG
    freopen("inp.txt", "r", stdin);
    freopen("out.txt", "w", stdout);
#endif
    string s;
    cin >> s;
    int n = s.size();
    set<string> _set;
    for (int i=0;i<n;i++) {
        for (int j=i;j<n;j++) {
            _set.insert(s.substr(i, j-i+1));
        }
    }
    cout << _set.size();


    show_exec_time();
}`;
    await expect(page.locator('#plain-textarea')).toContainText(submissionCode);
});

test('Check if standard input contains the testcase\'s input', async () => {
    const standardInputTxtArea: Locator = page.locator('#input');
    await expect(standardInputTxtArea).toHaveText('yay');
});

test('Check if standard output contains the testcase\'s input', async () => {
    const standardOutputTxtArea: Locator = page.locator('#expected-output');
    await expect(standardOutputTxtArea).toHaveAttribute('readonly', 'readonly');
    expect(await standardOutputTxtArea.inputValue()).toContain('5');
});
