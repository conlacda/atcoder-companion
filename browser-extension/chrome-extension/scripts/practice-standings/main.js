/* Practice data deliberately stays outside Vue's ranked standings and rating inputs. */
class PracticeSubmissions {
    constructor(request, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
        this.request = request;
        this.pause = pause;
        this.lastRequest = 0;
    }

    async json(path) {
        await this.pause(Math.max(0, 1100 - (Date.now() - this.lastRequest)));
        this.lastRequest = Date.now();
        const response = await this.request(`https://kenkoooo.com/atcoder/${path}`);
        if (!response.ok) throw new Error(`Practice API: ${response.status}`);
        return response.json();
    }

    async fetchBatch(users, tasks, from, to) {
        const submissions = await this.json(`atcoder-api/v3/users_and_time?users=${users.join(',')}&problems=${tasks.join(',')}&from=${from}&to=${to}`);
        if (!Array.isArray(submissions)) throw new Error('Invalid practice submissions');
        if (submissions.length < 10000) return submissions;
        // This endpoint is capped and unordered. Split, never paginate by the last item.
        let left, right;
        if (from < to) {
            const middle = Math.floor((from + to) / 2);
            left = await this.fetchBatch(users, tasks, from, middle);
            right = await this.fetchBatch(users, tasks, middle + 1, to);
        } else if (users.length > 1) {
            const middle = Math.floor(users.length / 2);
            left = await this.fetchBatch(users.slice(0, middle), tasks, from, to);
            right = await this.fetchBatch(users.slice(middle), tasks, from, to);
        } else if (tasks.length > 1) {
            const middle = Math.floor(tasks.length / 2);
            left = await this.fetchBatch(users, tasks.slice(0, middle), from, to);
            right = await this.fetchBatch(users, tasks.slice(middle), from, to);
        } else {
            throw new Error('Practice response limit reached for a single user, problem and second');
        }
        return left.concat(right);
    }

    async load(users, contest, end, tasks, onBatch = () => {}) {
        const results = new Map(users.map(user => [user, new Map()]));
        const canonicalUsers = new Map(users.map(user => [user.toLowerCase(), user]));
        const problemIds = [...tasks];
        const to = Math.floor(Date.now() / 1000);
        if (!users.length) return results;
        const batch = users;
        for (let j = 0; j < problemIds.length; j += 10) {
            const submissions = await this.fetchBatch(batch, problemIds.slice(j, j + 10), end, to);
            submissions.sort((a, b) => a.epoch_second - b.epoch_second || a.id - b.id);
            const seen = new Set();
            for (const s of submissions) {
                const user = canonicalUsers.get(s.user_id?.toLowerCase());
                if (!batch.includes(user) || s.contest_id !== contest || s.epoch_second < end ||
                    s.epoch_second > to || !tasks.has(s.problem_id)) continue;
                if (s.id != null && seen.has(s.id)) continue;
                if (s.id != null) seen.add(s.id);
                if (!['AC', 'WA', 'TLE', 'MLE', 'RE', 'OLE', 'CE'].includes(s.result)) continue;
                const solved = results.get(user);
                const result = solved.get(s.problem_id) || { points: 0, failures: 0, accepted: false };
                if (s.result === 'AC') {
                    result.accepted = true;
                    if (Number.isFinite(s.point)) result.points = Math.max(result.points, s.point);
                } else if (!result.accepted && s.result !== 'CE') {
                    result.failures++;
                }
                solved.set(s.problem_id, result);
            }
        }
        onBatch(new Map(batch.map(user => [user, results.get(user)])));
        return results;
    }

}

if (typeof module !== 'undefined' && module.exports) module.exports = { PracticeSubmissions };

if (typeof window !== 'undefined') (async () => {
    const match = location.pathname.match(/^\/contests\/([^/]+)\/standings\/?$/);
    if (!match) return;
    // Keep AtCoder's own loading UI active while both datasets are prepared.
    // Removing this override restores AtCoder's current visibility state.
    const loadingStyle = document.createElement('style');
    loadingStyle.textContent = '#vue-standings .loading-hide { display: none !important; } #vue-standings .loading-show { display: block !important; }';
    document.documentElement.append(loadingStyle);
    const releaseLoading = () => loadingStyle.remove();
    const loadingTimeout = setTimeout(releaseLoading, 30000);
    try {
        const deadline = Date.now() + 30000;
        while (!document.querySelector('meta[name="user_settings_ext_added"]')) {
            if (Date.now() > deadline) return;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        const settings = JSON.parse(document.querySelector('meta[name="user_settings_ext_added"]').content);
        if (!(settings.showPracticeSolves ?? 1)) return;
        const contest = match[1];
        const api = new PracticeSubmissions(url => new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const cleanup = () => {
                clearTimeout(timer);
                window.removeEventListener('message', receive);
            };
            const receive = event => {
                if (event.source !== window || event.origin !== location.origin ||
                    event.data?.type !== 'companion-practice-response' || event.data.id !== id) return;
                cleanup();
                if (event.data.error) reject(new Error(event.data.error));
                else resolve({ ok: true, json: async () => event.data.data });
            };
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error('Practice request timed out. Reload the extension and this page.'));
            }, 25000);
            window.addEventListener('message', receive);
            window.postMessage({ type: 'companion-practice-request', id,
                path: url.replace('https://kenkoooo.com/atcoder/', '') }, location.origin);
        }));
        // Fetch metadata in parallel with AtCoder's standings request.
        // Capture failures immediately, even if the native standings are still loading.
        const contestData = api.json('resources/contests.json').then(
            data => ({ data }), error => ({ error }));
        while (typeof vueStandings === 'undefined' || !vueStandings.standings ||
            !document.querySelector('#standings-tbody') || !document.querySelector('#standings-tbody').closest('table').querySelector('thead tr')) {
            if (Date.now() > deadline) return;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        const vm = vueStandings;
        const table = document.querySelector('#standings-tbody').closest('table');
        const tbody = document.querySelector('#standings-tbody');
        const results = new Map();
        const currentColors = new Map();
        const colorRequests = new Map();

        async function loadCurrentColors() {
            const pending = [...results].filter(([user, tasks]) => tasks.size && !colorRequests.has(user));
            // Profile colors are independent of the contest's historical ratings.
            // Limit concurrent profile requests and reuse them across contest pages.
            for (let i = 0; i < pending.length; i += 4) {
                await Promise.all(pending.slice(i, i + 4).map(([user]) => {
                    const request = (async () => {
                        const key = `atcoder-companion-current-color:${user.toLowerCase()}`;
                        try {
                            let cached;
                            try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (_) {}
                            if (cached && Date.now() - cached.time < 300000 && /^user-(gray|brown|green|cyan|blue|yellow|orange|red|unrated)$/.test(cached.color)) {
                                currentColors.set(user, cached.color);
                                return;
                            }
                            const response = await fetch(`/users/${encodeURIComponent(user)}`, { signal: AbortSignal.timeout(10000) });
                            if (!response.ok) throw new Error(`Profile: ${response.status}`);
                            const profile = new DOMParser().parseFromString(await response.text(), 'text/html');
                            const username = [...profile.querySelectorAll('h3 a.username')].find(link =>
                                link.getAttribute('href')?.toLowerCase() === `/users/${user.toLowerCase()}`);
                            const color = [...(username?.querySelector('span')?.classList || [])].find(name =>
                                /^user-(gray|brown|green|cyan|blue|yellow|orange|red|unrated)$/.test(name));
                            if (!color) throw new Error('Current profile color unavailable');
                            currentColors.set(user, color);
                            try { sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), color })); } catch (_) {}
                        } catch (error) {
                            console.warn(`Could not load current rating color for ${user}`, error);
                        }
                    })();
                    colorRequests.set(user, request);
                    return request;
                }));
            }
            render();
        }
        const replacedPlaceholders = new WeakSet();
        const attempted = new Set();
        let end;
        let busy = false;
        let previous = '';

        function users() {
            const names = new Set(vm.favSet || []);
            if (typeof userScreenName !== 'undefined' && userScreenName) names.add(userScreenName);
            return [...names].sort();
        }

        function render() {
            const tasks = vm.standings.TaskInfo;
            const columns = table.querySelector('thead tr').children.length;
            const official = new Map(vm.standings.StandingsData.map(u => [u.UserScreenName, u]));
            const visible = !vm.showRatedOnly ? users().filter(user => {
                if (!results.get(user)?.size || (vm.showFavOnly && !vm.favSet.has(user))) return false;
                const u = official.get(user);
                if (vm.country && (!u || (vm.country.startsWith('-') ? u.Country === vm.country.slice(1) : u.Country !== vm.country))) return false;
                if (vm.affiliation && (!u || !u.Affiliation?.match(toRegExp(vm.affiliation)))) return false;
                return !vm.username || (u?.DisplayName || user).match(toRegExp(vm.username));
            }) : [];
            const officialRows = [...tbody.rows].filter(row => !row.classList.contains('ext-practice-row'));
            // Favorites absent from the contest have a '-' rank and a colspan result.
            // Practice belongs before those placeholders, not merely before statistics.
            const insertionPoint = officialRows.find(row =>
                row.querySelector('.standings-rank')?.textContent.trim() === '-' ||
                row.matches('.standings-fa, .standings-statistics')) || officialRows[officialRows.length - 2];
            const nativeUsers = new Map(officialRows.flatMap(row => {
                const link = row.querySelector('.standings-username a.username');
                return link ? [[link.getAttribute('href'), row]] : [];
            }));
            // Keep Vue-owned placeholders in the DOM so its updates and the rating
            // predictor retain their row mapping; suppress only visible duplicates.
            const practiceUsers = new Set(visible.map(user => `/users/${user}`.toLowerCase()));
            for (const row of officialRows) {
                const href = row.querySelector('.standings-username a.username')?.getAttribute('href');
                const replaced = row.querySelector('.standings-rank')?.textContent.trim() === '-' &&
                    row.querySelector('td.standings-result[colspan]') &&
                    practiceUsers.has(href?.toLowerCase());
                if (replaced && !row.hidden) {
                    row.hidden = true;
                    replacedPlaceholders.add(row);
                } else if (!replaced && replacedPlaceholders.has(row)) {
                    row.hidden = false;
                    replacedPlaceholders.delete(row);
                }
            }
            const signature = JSON.stringify([columns, tasks, vm.showInLogScale,
                officialRows.map(row => row.cells[1]?.innerHTML),
                visible.map(u => [u, currentColors.get(u), [...results.get(u)]])]);
            if (signature === previous && tbody.querySelectorAll('.ext-practice-row').length === visible.length) return;
            previous = signature;
            tbody.querySelectorAll('.ext-practice-row').forEach(row => row.remove());
            for (const user of visible) {
                const row = document.createElement('tr');
                row.className = 'ext-practice-row';
                for (let i = 0; i < columns; i++) {
                    const cell = row.insertCell();
                    cell.className = i === 0 ? 'standings-rank' : i === 1 ? 'standings-username' : 'standings-result';
                }
                const nativeUser = nativeUsers.get(`/users/${user}`);
                const nativeLink = nativeUser?.querySelector('a.username');
                const link = nativeLink ? nativeLink.cloneNode(true) : document.createElement('a');
                link.href = `/users/${encodeURIComponent(user)}`;
                link.className = 'username';
                if (!nativeLink) {
                    const username = document.createElement('span');
                    username.className = 'user-unrated';
                    username.textContent = user;
                    link.append(username);
                }
                if (currentColors.has(user)) {
                    // Do not retain a historical rating-stage badge from the contest.
                    link.replaceChildren();
                    const username = document.createElement('span');
                    username.className = currentColors.get(user);
                    username.textContent = user;
                    link.append(username);
                }
                const flag = nativeUser?.querySelector('.img-flag-btn');
                if (flag) row.cells[1].append(flag.cloneNode(true), ' ');
                row.cells[1].append('* ', link);
                row.cells[1].title = 'Practice after the contest; not ranked';
                // Native layout: rank, user, total, additional columns, task results.
                const taskStart = 3 + (vm.standings.AdditionalColumns?.length || 0);
                tasks.forEach((task, index) => {
                    if (!results.get(user).has(task.TaskScreenName)) {
                        const empty = document.createElement('p');
                        empty.textContent = '-';
                        row.cells[taskStart + index]?.append(empty);
                        return;
                    }
                    const accepted = document.createElement('a');
                    const pointsSpan = document.createElement('span');
                    pointsSpan.className = 'standings-ac';
                    const result = results.get(user).get(task.TaskScreenName);
                    const points = result.points;
                    pointsSpan.textContent = typeof toScoreString === 'function'
                        ? toScoreString(points * 100, vm.showInLogScale) : String(points);
                    accepted.append(pointsSpan);
                    accepted.title = 'Accepted in practice';
                    accepted.href = `/contests/${contest}/submissions?f.User=${encodeURIComponent(user)}&f.Task=${encodeURIComponent(task.TaskScreenName)}`;
                    const score = document.createElement('p');
                    if (result.accepted) score.append(accepted);
                    if (result.failures) {
                        const penalty = document.createElement('span');
                        penalty.className = 'standings-wa';
                        penalty.textContent = `(${result.failures})`;
                        score.append(' ', penalty);
                    } else if (!result.accepted) {
                        score.textContent = '-';
                    }
                    row.cells[taskStart + index]?.append(score);
                });
                const total = [...results.get(user).values()].reduce((sum, result) => sum + result.points, 0);
                const totalScore = document.createElement('p');
                const totalSpan = document.createElement('span');
                totalSpan.className = 'standings-score';
                totalSpan.textContent = typeof toScoreString === 'function'
                    ? toScoreString(total * 100, vm.showInLogScale) : String(total);
                totalScore.append(totalSpan);
                row.cells[2].append(totalScore);
                tbody.insertBefore(row, insertionPoint || null);
            }
        }

        async function update() {
            render();
            if (busy || !end) return;
            busy = true;
            try {
                const pending = [];
                for (const user of users()) {
                    if (attempted.has(user)) continue;
                    attempted.add(user);
                    let cached;
                    try { cached = JSON.parse(sessionStorage.getItem(`atcoder-companion-practice-v3:${contest}:${user}`)); } catch (_) { /* Best-effort cache. */ }
                    if (cached && Date.now() - cached.time < 300000 && Array.isArray(cached.tasks)) {
                        results.set(user, new Map(cached.tasks));
                    } else {
                        pending.push(user);
                    }
                }
                render();
                try {
                    await api.load(pending, contest, end, new Set(vm.standings.TaskInfo.map(t => t.TaskScreenName)), batch => {
                        for (const [user, solved] of batch) {
                            results.set(user, solved);
                            try { sessionStorage.setItem(`atcoder-companion-practice-v3:${contest}:${user}`, JSON.stringify({ time: Date.now(), tasks: [...solved] })); } catch (_) { /* Best-effort cache. */ }
                        }
                        render();
                    });
                } catch (error) {
                    console.warn('Could not load practice standings', error);
                }
                await loadCurrentColors();
            } finally {
                busy = false;
            }
        }
        // A stable render signature prevents feedback with the rating predictor's observer.
        new MutationObserver(render).observe(table, { childList: true, subtree: true });
        vm.$watch(() => [vm.showFavOnly, vm.showRatedOnly, vm.country, vm.username, vm.affiliation, ...users()].join('\n'), update);
        try {
            const response = await contestData;
            if (response.error) throw response.error;
            const contests = response.data;
            const info = contests.find(c => c.id === contest);
            end = info && info.start_epoch_second + info.duration_second;
            if (!end || end > Date.now() / 1000) {
                return;
            }
            await update();
        } catch (error) {
            console.warn('Could not load practice standings', error);
        }
    } finally {
        clearTimeout(loadingTimeout);
        releaseLoading();
    }
})();
