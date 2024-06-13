class Contest {
    constructor(contestName) {
        this.contestName = contestName;
    }

    async fetchStandingFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/json`;
        let res = await fetch(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    async fetchVirtualStandingFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/virtual/json`
        let res = await fetch(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        return res;
    }

    async fetchFinalResultFromAtcoder() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/results/json`;
        let res = await fetch(resourceUrl);
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
     * How to not cache 404 response but cache 200 response??
     */
    async fetchPredictedPerfArr() {
        const resourceUrl = `https://raw.githubusercontent.com/conlacda/ac-perf-data/main/data/${this.contestName}_ranking_to_perf.json`;
        let res = await fetch(resourceUrl, { cache: "no-store" });
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
        const option = (needTocache) ? {} : { cache: "no-store" };
        let res = await fetch(resourceUrl, option);
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
        let res = await fetch(resourceUrl, { cache: "no-store" });
        if (res.status === 200) {
            res = await res.json();
            return res.type;
        }
        return 'algo';
    }
}
