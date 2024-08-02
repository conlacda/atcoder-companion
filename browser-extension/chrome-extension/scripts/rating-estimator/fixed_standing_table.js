class FixedStandingTable extends StandingTable {
    constructor(standings, fixedResult) {
        super();
        this.standings = standings;
        this.fixedResult = fixedResult;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        this.correctPerformance();

        this.perfRatingData = new Map(); // map of {username: DataObject{}}
        const isUnratedContest = (() => this.fixedResult.every((x) => !x.IsRated))();

        /*
        * Set data for rated participants but there are not results data for them
        * Check users at the last page of https://atcoder.jp/contests/agc032/standings
        */
        for (let i = 0; i < this.standings.StandingsData.length; i++) {
            this.perfRatingData.set(this.standings.StandingsData[i].UserScreenName, {
                performance: '-',
                userScreenName: this.standings.StandingsData[i].UserScreenName,
                oldRating: this.standings.StandingsData[i].OldRating,
                newRating: this.standings.StandingsData[i].OldRating,
                isRated: false
            });
        }

        // Set data for users who have results
        for (let i = 0; i < this.fixedResult.length; i++) {
            this.perfRatingData.set(this.fixedResult[i].UserScreenName, {
                performance: isUnratedContest ? '-' : positivize(this.fixedResult[i].Performance),
                userScreenName: this.fixedResult[i].UserScreenName,
                oldRating: this.fixedResult[i].OldRating,
                newRating: this.fixedResult[i].NewRating,
                isRated: this.fixedResult[i].IsRated
            });
        }
    }

    /* 
    * Correct input data
    * Check https://atcoder.jp/contests/wtf22-day1-open/standings/ rank 271
    * Many people with same rank but not same performance
    */
    correctPerformance() {
        let rank2Perf = new Map();
        for (let i = 0; i < this.fixedResult.length; i++) {
            if (!rank2Perf.has(this.fixedResult[i].Place)) {
                rank2Perf.set(this.fixedResult[i].Place, this.fixedResult[i].Performance);
            } else {
                rank2Perf.set(this.fixedResult[i].Place, Math.max(this.fixedResult[i].Performance, rank2Perf.get(this.fixedResult[i].Place)));
            }
        }
        for (let i = 0; i < this.fixedResult.length; i++) {
            this.fixedResult[i].Performance = rank2Perf.get(this.fixedResult[i].Place);
        }
    }
}
