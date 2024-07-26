/**
 * Sleep in miliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise<void>} - A Promise that resolves after the specified time
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch data from a URL with retries when reach the request limit.
 * @param {string} url - The URL to fetch data from
 * @param {number} [retryNum=10] - Number of retry attempts (default: 10)
 * @returns {Promise<Response>} - A Promise that resolves to the Response object when successful
 */
const fetchWithRetry = async (url, options = {}, retryNum = 10) => {
    let sleepInMs = 500;
    while (retryNum > 0) {
        try {
            res = await fetch(url, options);
            if (res.status === 429) {
                await sleep(sleepInMs);
                sleepInMs += 1000;
                retryNum--;
            } else {
                return res;
            }
        } catch (e) {
            console.log(e);
        }
    }
}

class Contest {
    constructor(contestName) {
        this.contestName = contestName;
    }

    async fetchStandingFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/json`;
        let res = await fetchWithRetry(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    async fetchVirtualStandingFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/virtual/json`;
        let res = await fetchWithRetry(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    async fetchExtendedStandingsFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/extended/json`;
        let res = await fetchWithRetry(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    async fetchFinalResultFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/results/json`;
        let res = await fetchWithRetry(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        this.#setPerformanceEqualToNearestUser(res);
        return res;
    }

    /**
     * Fetch the performance array which is predicted by backend server
     * Do not to cache, because the size of this file is pretty small (an integer array of around 10k elements)
     * But maybe it should be cached to improve performance.
     * The reason to not cache here is at the first 10 minutes, the backend fetch data then calculate the predicted data
     * If the extension send a request without specifying no-cache, the browser will return 404 response from cache
     * If need to cache, cache for algo contests only, do not cache for heuristic contests 
     * because the number of participants is not fixed until the contest ends. 
     */
    async fetchPredictedPerfArr(needTocache = false) {
        const resourceUrl = `https://raw.githubusercontent.com/conlacda/ac-perf-data/main/data/${this.contestName}_ranking_to_perf.json`;
        const option = (needTocache) ? {} : { cache: "no-store" }; // headers: { 'Cache-Control': 'max-age=120' }
        let res = await fetchWithRetry(resourceUrl, option);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    /**
     * Fetch the rounded performance history of all participants before contest ~ the data of a contest with 10k users is about 5MB.
     */
    async fetchRoundedPerfHistory(needTocache = false) {
        const resourceUrl = `https://raw.githubusercontent.com/conlacda/ac-perf-data/main/data/${this.contestName}_rounded_perf_history.json`;
        const option = (needTocache) ? {} : { cache: "no-store" }; // headers: { 'Cache-Control': 'max-age=120' }
        let res = await fetchWithRetry(resourceUrl, option);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    #setPerformanceEqualToNearestUser(res) {
        let cur = 0;
        for (let i = res.length - 1; i >= 0; i--) {
            if (res[i].Performance === 0) {
                res[i].Performance = cur;
            }
            cur = res[i].Performance;
        }
    }

    /**
     * Retrieves the type of contest.
     * Sometimes we can not know the type of contest if the contest has an unusual name like wtf22-day2-open,...
     * @default 'algo'
     * @returns {string} The type of contest, which can be either "heuristic" or "algo".
     */
    async getContestType() {
        if (this.contestName.startsWith("abc")
            || this.contestName.startsWith("arc")
            || this.contestName.startsWith("agc")) {
            return "algo";
        }
        if (this.contestName.includes("ahc")) {
            return "heuristic";
        }

        const resourceUrl = `https://raw.githubusercontent.com/conlacda/ac-perf-data/main/data/${this.contestName}_contest_type.json`;
        let res = await fetchWithRetry(resourceUrl, { cache: "no-store" }); // headers: { 'Cache-Control': 'max-age=120' }
        if (res.status === 200) {
            res = await res.json();
            return res.type;
        }
        return 'algo';
    }
}
