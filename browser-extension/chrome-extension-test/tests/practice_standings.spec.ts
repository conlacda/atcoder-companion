import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import vm from 'vm';
const background = fs.readFileSync(path.resolve(__dirname, '../../chrome-extension/scripts/background.js'), 'utf8');
function backgroundHandler(request: any) {
  let handler: any;
  vm.runInNewContext(background, {
    chrome: { runtime: { onInstalled: { addListener() {} }, onMessage: { addListener(fn: any) { handler = fn; } } } },
    fetch: request, AbortSignal,
  });
  return handler;
}
const script = path.resolve(__dirname, '../../chrome-extension/scripts/practice-standings/main.js');
const { PracticeSubmissions } = require(script);
test.use({ headless: true, channel: 'chrome' });

test('batches users and problems and splits capped responses without losing attempts', async () => {
  const urls: string[] = [];
  const api = new PracticeSubmissions(async (url: string) => {
    urls.push(url);
    const q = new URL(url).searchParams;
    const data = urls.length === 1 ? Array(10000).fill({}) :
      [{ id: urls.length, user_id: 'friend', contest_id: 'demo', problem_id: 'a', epoch_second: Number(q.get('from')), result: urls.length === 2 ? 'WA' : 'AC', point: 200 }];
    return { ok: true, json: async () => data };
  }, async () => {});
  const result = await api.load(['friend', 'other'], 'demo', 200, new Set(['a']));
  expect(result.get('friend').get('a')).toEqual({ points: 200, failures: 1, accepted: true });
  expect(urls).toHaveLength(3);
  expect(urls[0]).toContain('users=friend,other&problems=a&from=200&to=');
  expect(Number(new URL(urls[1]).searchParams.get('to')) + 1).toBe(Number(new URL(urls[2]).searchParams.get('from')));
  const batches: string[] = [];
  const empty = new PracticeSubmissions(async (url: string) => { batches.push(url); return { ok: true, json: async () => [] }; }, async () => {});
  await empty.load(Array.from({length: 21}, (_, i) => `u${i}`), 'demo', 200, new Set(Array.from({length: 11}, (_, i) => `p${i}`)));
  expect(batches).toHaveLength(2);
  for (const url of batches) expect(new URL(url).searchParams.get('users')?.split(',')).toHaveLength(21);
  const broken = new PracticeSubmissions(async () => ({ ok: false, status: 429 }), async () => {});
  await expect(broken.load(['friend'], 'demo', 200, new Set(['a']))).rejects.toThrow('429');
});

test('renders absent friends without affecting rankings, supports filters and extra rating columns', async ({ page }) => {
  await page.route('https://atcoder.jp/**', route => route.fulfill({ contentType: 'text/html', body: '<meta name="user_settings_ext_added" content="{}"><table><thead><tr><th>Rank</th><th>User</th><th>Total</th><th>A</th><th>B</th></tr></thead><tbody id="standings-tbody"><tr><td class="standings-rank">1</td><td class="standings-username"><a class="username" href="/users/participant"><span class="user-brown">participant</span></a></td><td>100</td><td>100</td><td></td></tr><tr><td class="standings-rank">-</td><td class="standings-username"><a class="username" href="/users/absent"><span class="user-unrated">absent</span></a></td><td class="standings-result" colspan="3"><p>-</p></td></tr><tr class="standings-fa"><td>AC</td></tr><tr><td>Tried</td></tr></tbody></table>' }));
  const handler = backgroundHandler(async (url: string) => ({ ok: true, json: async () => url.includes('contests.json') ? [{ id: 'demo', start_epoch_second: 100, duration_second: 100 }] : ['absent', 'participant'].map(user_id => ({ user_id, contest_id: 'demo', problem_id: 'b', result: 'AC', point: 200, epoch_second: 300 })) }));
  await page.exposeFunction('practiceBackground', (message: any) => new Promise(resolve => {
    handler(message, { url: 'https://atcoder.jp/contests/demo/standings' }, resolve);
  }));
  await page.goto('https://atcoder.jp/contests/demo/standings');
  await page.evaluate(() => Object.assign(window, {
    userScreenName: 'participant', toRegExp: (s: string) => new RegExp(s),
    vueStandings: { standings: { TaskInfo: [{ TaskScreenName: 'a' }, { TaskScreenName: 'b' }], StandingsData: [{ UserScreenName: 'participant', DisplayName: 'participant' }] }, favSet: new Set(['absent']), $watch: (_: any, callback: any) => { (window as any).updatePractice = callback; } }
  }));
  await page.evaluate(() => {
    // Direct page fetch must never be used, even when the API has no CORS headers.
    window.fetch = async (url: any) => {
      if (!String(url).startsWith('/users/')) throw new Error('CORS blocked');
      const user = String(url).split('/').pop();
      return new Response(`<h3><a class="username" href="/users/${user}"><span class="user-blue">${user}</span></a></h3>`);
    };
    Object.assign(window, { chrome: { runtime: {
      sendMessage: (message: any, callback: any) => (window as any).practiceBackground(message).then(callback)
    } } });
  });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../chrome-extension/scripts/practice-standings/bridge.js') });
  await page.addScriptTag({ path: script });
  const rows = page.locator('.ext-practice-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('* absent');
  await expect(rows.first().locator('td').nth(0)).toBeEmpty();
  await expect(rows.first().locator('td').nth(2)).toHaveText('200');
  await expect(rows.first().locator('td').nth(4)).toHaveText('200');
  await expect(page.locator('#standings-tbody tr').nth(1)).toHaveClass('ext-practice-row');
  await expect(page.locator('#standings-tbody tr').nth(3)).toContainText('absent');
  const placeholder = page.locator('#standings-tbody tr:not(.ext-practice-row)').filter({ has: page.locator('a[href="/users/absent"]') });
  await expect(placeholder).toBeHidden();
  await expect(page.locator('#standings-tbody tr').first()).toBeVisible();
  // Native rerenders may replace the placeholder without changing its contents.
  await placeholder.evaluate(row => { const replacement = row.cloneNode(true) as HTMLElement; replacement.hidden = false; row.replaceWith(replacement); });
  await expect(placeholder).toBeHidden();
  await expect(rows.first()).not.toHaveAttribute('style');
  await expect(rows.first().locator('td.standings-username > a.username > span.user-blue')).toHaveText('absent');
  await expect(rows.first().locator('td.standings-result > p > a > span.standings-ac')).toHaveText('200');
  await expect(rows.first().locator('td.standings-result > p > span.standings-score')).toHaveText('200');
  await expect(rows.nth(1).locator('a.username > span.user-blue')).toHaveText('participant');
  await expect(page.locator('#standings-tbody tr:not(.ext-practice-row)')).toHaveCount(4);
  await page.evaluate(() => Object.assign(window, {
    isVuePresent: () => true,
    getContestName: () => 'demo',
    Color: {},
  }));
  await page.evaluate(() => { (window as any).vueStandings.currentStandings = [{ UserScreenName: 'participant' }]; });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../chrome-extension/scripts/rating-predictor/standing_table.js') });
  await page.addScriptTag({ content: 'new StandingTable().fillDataToColumns();' });
  await expect(rows.first().locator('td')).toHaveCount(8);
  await expect(rows.first().locator('td').nth(7)).toBeEmpty();
  await page.evaluate(() => { (window as any).vueStandings.showFavOnly = true; (window as any).updatePractice(); });
  await expect(rows).toHaveCount(1);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.evaluate(() => { (window as any).vueStandings.showRatedOnly = true; (window as any).updatePractice(); });
  await expect(rows).toHaveCount(0);
  await expect(placeholder).toBeVisible();
});

for (const suffix of ['/virtual', '/extended']) {
  test(`does not load practice data on ${suffix}`, async ({ page }) => {
    await page.route('https://atcoder.jp/**', route => route.fulfill({ body: '<meta name="user_settings_ext_added" content="{}"><table></table>' }));
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto(`https://atcoder.jp/contests/demo/standings${suffix}`);
    await page.addScriptTag({ path: script });
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    expect(requests.filter(url => url.includes('kenkoooo'))).toEqual([]);
  });
}

test('background restricts requests and returns network errors', async () => {
  let calls = 0;
  const handler = backgroundHandler(async () => { calls++; throw new Error('Network unavailable'); });
  const send = (path: string, url = 'https://atcoder.jp/contests/demo/standings') => new Promise(resolve => {
    const pending = handler({ type: 'companion-practice-fetch', path }, { url }, resolve);
    if (pending !== true) resolve(undefined);
  });
  expect(await send('https://example.com')).toEqual({ error: 'Invalid practice API request' });
  expect(await send('resources/contests.json', 'https://example.com')).toBeUndefined();
  expect(calls).toBe(0);
  expect(await send('resources/contests.json')).toEqual({ error: 'Network unavailable' });
  expect(calls).toBe(1);
  const users = Array.from({ length: 50 }, (_, i) => `user${i}`).join(',');
  expect(await send(`atcoder-api/v3/users_and_time?users=${users}&problems=demo_a&from=200&to=300`)).toEqual({ error: 'Network unavailable' });
  expect(calls).toBe(2);
});

test('disabled practice setting makes no API requests or page controls', async ({ page }) => {
  await page.route('https://atcoder.jp/**', route => route.fulfill({ contentType: 'text/html', body: `<meta name="user_settings_ext_added" content='{"showPracticeSolves":0}'><table><tbody id="standings-tbody"></tbody></table>` }));
  await page.goto('https://atcoder.jp/contests/demo/standings');
  await page.evaluate(() => Object.assign(window, { vueStandings: { standings: {} } }));
  await page.addScriptTag({ path: script });
  await expect(page.locator('.ext-practice-row')).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await expect(page.getByText('Practice data unavailable')).toHaveCount(0);
});

test('popup saves and restores the practice setting', async ({ page }) => {
  const popup = path.resolve(__dirname, '../../chrome-extension/index.html');
  await page.route('https://popup.test/', route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync(popup, 'utf8').replace('<script src="scripts/popup.js"></script>', '') }));
  await page.goto('https://popup.test/');
  await page.evaluate(() => Object.assign(window, { chrome: { storage: { local: {
    get: (_: any, callback: any) => callback(JSON.parse(localStorage.getItem('settings') || '{}')),
    set: async (value: any) => localStorage.setItem('settings', JSON.stringify(value))
  } } } }));
  const popupScript = path.resolve(__dirname, '../../chrome-extension/scripts/popup.js');
  await page.addScriptTag({ path: popupScript });
  const checkbox = page.getByLabel('Show practice solves for you and your favorites (*)');
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('settings')!).user_settings).showPracticeSolves)).toBe(0);
  await page.reload();
  await page.evaluate(() => Object.assign(window, { chrome: { storage: { local: {
    get: (_: any, callback: any) => callback(JSON.parse(localStorage.getItem('settings') || '{}')),
    set: async () => {}
  } } } }));
  await page.addScriptTag({ path: popupScript });
  await expect(checkbox).not.toBeChecked();
});

test('counts failures before acceptance and includes unsuccessful practice users', async ({ page }) => {
  const submissions = [
    { id: 1, epoch_second: 200, result: 'WA' },
    { id: 2, epoch_second: 201, result: 'CE' },
    { id: 3, epoch_second: 202, result: 'TLE' },
    { id: 4, epoch_second: 203, result: 'AC', point: 100 },
    { id: 5, epoch_second: 204, result: 'WA' },
  ].map(s => ({ user_id: 'friend', contest_id: 'demo', problem_id: 'a', ...s }));
  const api = new PracticeSubmissions(async () => ({ ok: true, json: async () => submissions }), async () => {});
  expect((await api.load(['friend'], 'demo', 200, new Set(['a']))).get('friend').get('a')).toEqual({ points: 100, failures: 2, accepted: true });
  await page.route('https://atcoder.jp/**', route => route.fulfill({ contentType: 'text/html', body: `<meta name="user_settings_ext_added" content="{}"><table><thead><tr><th>Rank</th><th>User</th><th>Total</th><th>A</th></tr></thead><tbody id="standings-tbody"><tr class="standings-fa"><td>First Accepted</td></tr><tr class="standings-statistics"><td>Statistics</td></tr></tbody></table>` }));
  await page.goto('https://atcoder.jp/contests/demo/standings');
  await page.evaluate(() => {
    Object.assign(window, { userScreenName: '', vueStandings: {
      standings: { TaskInfo: [{ TaskScreenName: 'a' }], StandingsData: [] }, favSet: new Set(['wrong', 'solved']), $watch() {}
    } });
    window.addEventListener('message', event => {
      if (event.data?.type !== 'companion-practice-request') return;
      const data = event.data.path.includes('contests.json') ? [{ id: 'demo', start_epoch_second: 100, duration_second: 100 }] :
        [{ user_id: 'wrong', contest_id: 'demo', problem_id: 'a', epoch_second: 201, result: 'WA' },
         { user_id: 'solved', contest_id: 'demo', problem_id: 'a', epoch_second: 201, result: 'WA' },
         { user_id: 'solved', contest_id: 'demo', problem_id: 'a', epoch_second: 202, result: 'AC', point: 100 }];
      window.postMessage({ type: 'companion-practice-response', id: event.data.id, data }, location.origin);
    });
  });
  await page.addScriptTag({ path: script });
  const rows = page.locator('.ext-practice-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('.standings-ac')).toHaveText('100');
  await expect(rows.nth(0).locator('.standings-wa')).toHaveText('(1)');
  await expect(rows.nth(1)).toContainText('wrong');
  await expect(rows.nth(1).locator('.standings-wa')).toHaveText('(1)');
  await expect(rows.nth(1).locator('.standings-ac')).toHaveCount(0);
});

for (const outcome of ['success', 'failure', 'timeout']) {
  test(`holds native loading until practice ${outcome}`, async ({ page }) => {
    await page.route('https://atcoder.jp/**', route => route.fulfill({ contentType: 'text/html', body: '<meta name="user_settings_ext_added" content="{}"><div id="vue-standings"><div class="loading-show">Loading...</div><div class="loading-hide" style="display:none"><table><thead><tr><th>Rank</th><th>User</th><th>Total</th><th>A</th></tr></thead><tbody id="standings-tbody"><tr class="standings-fa"><td>First Accepted</td></tr><tr class="standings-statistics"><td>Statistics</td></tr></tbody></table></div></div>' }));
    await page.goto('https://atcoder.jp/contests/demo/standings');
    await page.clock.install();
    await page.evaluate(() => {
      Object.assign(window, { practiceRequests: [] });
      window.addEventListener('message', event => {
        if (event.data?.type !== 'companion-practice-request') return;
        (window as any).practiceRequests.push(event.data);
        if (event.data.path.includes('contests.json')) window.postMessage({ type: 'companion-practice-response', id: event.data.id, data: [{ id: 'demo', start_epoch_second: 100, duration_second: 100 }] }, location.origin);
      });
    });
    await page.addScriptTag({ path: script });
    // Metadata starts before Vue/native standings have loaded.
    await expect.poll(() => page.evaluate(() => (window as any).practiceRequests.length)).toBe(1);
    await page.evaluate(() => {
      Object.assign(window, { userScreenName: 'friend', vueStandings: {
        standings: { TaskInfo: [{ TaskScreenName: 'a' }], StandingsData: [] }, favSet: new Set(), $watch() {}
      } });
      (document.querySelector('.loading-show') as HTMLElement).style.display = 'none';
      (document.querySelector('.loading-hide') as HTMLElement).style.display = 'block';
    });
    await page.clock.runFor(1200);
    await expect.poll(() => page.evaluate(() => (window as any).practiceRequests.length)).toBe(2);
    await expect(page.locator('.loading-show')).toBeVisible();
    await expect(page.locator('.loading-hide')).toBeHidden();
    if (outcome === 'timeout') {
      await page.clock.runFor(30000);
    } else {
      await page.evaluate(outcome => {
        const request = (window as any).practiceRequests[1];
        window.postMessage({ type: 'companion-practice-response', id: request.id,
          ...(outcome === 'failure' ? { error: 'Unavailable' } : { data: [{ user_id: 'friend', contest_id: 'demo', problem_id: 'a', epoch_second: 200, result: 'AC', point: 100 }] })
        }, location.origin);
      }, outcome);
    }
    await expect(page.locator('.loading-hide')).toBeVisible();
    await expect(page.locator('.loading-show')).toBeHidden();
    if (outcome === 'success') await expect(page.locator('.ext-practice-row')).toHaveCount(1);
  });
}
