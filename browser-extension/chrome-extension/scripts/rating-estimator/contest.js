class Contest {
    constructor(contestName) {
        this.contestName = contestName;
    }

    async fetchStanding() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/standings/json`;
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

    // Fetch the performance array which is predicted by backend server
    async fetchPredictedPerfArr() {
        const resourceUrl = `https://raw.githubusercontent.com/conlacda/ac-perf-data/main/data/${this.contestName}_ranking_to_perf.json`;
        let res = await fetch(resourceUrl);
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
}
