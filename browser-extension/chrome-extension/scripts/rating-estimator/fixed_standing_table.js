/**
 * The standing table with the fixed data from Atcoder
 * This table does not need data from outside to draw
 * However, rank2Perf is added to make performance prediction more accurate
 * and also be consistent with the predicted_standing_table
 * The performance of unrated users in the old contests will be rounded down to the nearest user
 * The performance of recent contests (backend generated data) will be calculated like the predicted_standing_table
 */
class FixedStandingTable extends StandingTable {
    constructor(standings, fixedResult, rank2Perf = []) {
        super();
        this.standings = standings;
        this.fixedResult = fixedResult;
        this.rank2Perf = rank2Perf;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        this.correctPerformance();
        this.addRatedRankToStandings();

        this.perfRatingData = new Map(); // map of {username: DataObject{}}
        const isUnratedContest = (() => this.fixedResult.every((x) => !x.IsRated))();

        if (isUnratedContest)
            return;
        /*
        * Set data for rated participants but there are not results data for them
        * Check users at the last page of https://atcoder.jp/contests/agc032/standings
        */
        for (let i = 0; i < this.standings.StandingsData.length; i++) {
            let isRated = false;
            const rank = this.standings.StandingsData[i].RatedRank;
            let performance = '-';
            // Calculate performance for unrated users with data fetched from backend
            if (this.rank2Perf.length > 0) {
                const upPerformance = this.rank2Perf[Math.floor(rank) - 1] ?? 0;
                const downPerformance = this.rank2Perf[Math.ceil(rank) - 1] ?? 0;
                performance = positivize(Math.floor((upPerformance + downPerformance) / 2));
                // https://atcoder.jp/contests/agc033/standings - isRated but set as rated on the last page
                isRated = this.standings.StandingsData[i].IsRated;
            }

            this.perfRatingData.set(this.standings.StandingsData[i].UserScreenName, {
                performance: performance,
                userScreenName: this.standings.StandingsData[i].UserScreenName,
                oldRating: this.standings.StandingsData[i].OldRating,
                newRating: this.standings.StandingsData[i].OldRating,
                isRated: isRated
            });
        }

        // Set data for users who have results
        for (let i = 0; i < this.fixedResult.length; i++) {
            // unrated users was set before
            if (!this.fixedResult[i].IsRated && this.rank2Perf.length > 0)
                continue;

            this.perfRatingData.set(this.fixedResult[i].UserScreenName, {
                performance: positivize(this.fixedResult[i].Performance),
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

    addRatedRankToStandings() {
        // add rated rank for the rated participants
        const len = this.standings.StandingsData.length;
        let startIndex = 0, endIndex = 0;
        let beforeRatedCount = 0;
        while (endIndex < len) {
            let ratedCount = 0;
            while (endIndex + 1 < len && this.standings.StandingsData[endIndex + 1].Rank === this.standings.StandingsData[startIndex].Rank)
                endIndex++;

            for (let i = startIndex; i <= endIndex; i++)
                if (this.standings.StandingsData[i].IsRated) ratedCount++;

            let actualRatedRank = (beforeRatedCount + 1 + beforeRatedCount + ratedCount) / 2;
            if (actualRatedRank < 1) actualRatedRank = 1;

            for (let i = startIndex; i <= endIndex; i++)
                this.standings.StandingsData[i].RatedRank = actualRatedRank;

            beforeRatedCount += ratedCount;
            endIndex++;
            startIndex = endIndex;
        }
    }
}
