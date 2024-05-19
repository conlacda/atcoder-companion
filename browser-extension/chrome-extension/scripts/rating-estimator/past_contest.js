class PastContest {
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

    async fetchResult() {
        const resourceUrl = `https://atcoder.jp/contests/${this.contestName}/results/json`;
        let res = await fetch(resourceUrl);
        if (res.status !== 200)
            return [];

        res = await res.json();
        this.#setRatingToNearestUser(res);
        return res;
    }
    
    #setRatingToNearestUser(res) {
        let cur = 0;
        for (let i=res.length-1;i>=0;i--) {
            if (res[i].Performance === 0) {
                res[i].Performance = cur;
            }
            cur = res[i].Performance;
        }
    }
}
