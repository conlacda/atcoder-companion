class FixedStandingTable extends StandingTable {
    constructor(standings, fixedResult) {
        super();
        this.result = this.loadData(standings, fixedResult);
        this.observeFirstColumnChanged();
        this.addHeaderAndFooter();
    }

    loadData(standings, fixedResult) {
        this.correctPerformance(fixedResult);

        let finalResult = new Map(); // map of {username: DataObject{}}
        const isUnratedContest = (() => fixedResult.every((x) => !x.IsRated))();

        /*
        * Set data for rated participants but there are not results data for them
        * Check users at the last page of https://atcoder.jp/contests/agc032/standings
        */
        for (let i = 0; i < standings.StandingsData.length; i++) {
            finalResult.set(standings.StandingsData[i].UserScreenName, {
                performance: '-',
                userScreenName: standings.StandingsData[i].UserScreenName,
                oldRating: standings.StandingsData[i].OldRating,
                newRating: standings.StandingsData[i].OldRating,
                isRated: false
            });
        }

        // Set data for users who have results
        for (let i = 0; i < fixedResult.length; i++) {
            finalResult.set(fixedResult[i].UserScreenName, {
                performance: isUnratedContest ? '-' : positivize(fixedResult[i].Performance),
                userScreenName: fixedResult[i].UserScreenName,
                oldRating: fixedResult[i].OldRating,
                newRating: fixedResult[i].NewRating,
                isRated: fixedResult[i].IsRated
            });
        }

        return finalResult;
    }

    /* 
    * Correct input data
    * Check https://atcoder.jp/contests/wtf22-day1-open/standings/ rank 271
    * Many people with same rank but not same performance
    */
    correctPerformance(fixedResult) {
        let rank2Perf = new Map();
        for (let i = 0; i < fixedResult.length; i++) {
            if (!rank2Perf.has(fixedResult[i].Place)) {
                rank2Perf.set(fixedResult[i].Place, fixedResult[i].Performance);
            } else {
                rank2Perf.set(fixedResult[i].Place, Math.max(fixedResult[i].Performance, rank2Perf.get(fixedResult[i].Place)));
            }
        }
        for (let i = 0; i < fixedResult.length; i++) {
            fixedResult[i].Performance = rank2Perf.get(fixedResult[i].Place);
        }
    }
}
