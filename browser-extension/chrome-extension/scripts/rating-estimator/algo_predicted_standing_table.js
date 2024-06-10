class AlgoPredictedStandingTable extends StandingTable {
    constructor(performanceArr, standings) {
        super();
        this.result = this.loadData(performanceArr, standings);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
    }

    loadData(performanceArr, standings) {
        standings = this.addRatedRank(standings);

        let predictedResult = new Map(); // map of {username: DataObject{}}
        let unratedCount = 0;

        for (let i = 0; i < standings.StandingsData.length; i++) {
            const isRated = standings.StandingsData[i].IsRated;
            const competitionNum = standings.StandingsData[i].Competitions;
            const oldRating = standings.StandingsData[i].Rating;
            const rank = standings.StandingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = performanceArr[Math.floor(rank) - 1] ?? 0;
            const downPerformance = performanceArr[Math.ceil(rank) - 1] ?? 0;
            const performance = StandingTable.positivize_performance(Math.floor((upPerformance + downPerformance) / 2)); // prevents out of bound error when new users joined after the last generated time
            const newRating = isRated ? this.predictNewRatingFromLast(oldRating, performance, competitionNum) : oldRating;
            const userScreenName = standings["StandingsData"][i].UserScreenName;
            predictedResult.set(userScreenName, {
                performance: performance,
                userScreenName: userScreenName,
                oldRating: oldRating,
                newRating: newRating,
                isRated: isRated
            });
            if (!isRated)
                unratedCount++;
        }
        return predictedResult;
    }

    // Reference: https://github.com/koba-e964/atcoder-rating-estimator
    predictNewRatingFromLast(oldRating, performance, competitionNum) {
        const bigf = (n) => {
            let num = 1.0;
            let den = 1.0;
            for (let i = 0; i < n; ++i) {
                num *= 0.81;
                den *= 0.9;
            }
            num = (1 - num) * 0.81 / 0.19;
            den = (1 - den) * 0.9 / 0.1;
            return Math.sqrt(num) / den;
        }
        const f = (n) => {
            var finf = bigf(400);
            return (bigf(n) - finf) / (bigf(1) - finf) * 1200.0;
        }
        // (-inf, inf) -> (0, inf)
        const positivize_rating = (r) => {
            return (r < 400.0) ? 400.0 * Math.exp((r - 400.0) / 400.0) : r;
        }

        if (competitionNum === 0)
            return 0;

        oldRating += f(competitionNum);
        var wei = 9 - 9 * 0.9 ** competitionNum;
        var num = wei * (2 ** (oldRating / 800.0)) + 2 ** (performance / 800.0);
        var den = 1 + wei;
        var rating = Math.log2(num / den) * 800.0;
        rating -= f(competitionNum + 1);
        return Math.ceil(positivize_rating(rating));
    }

    // TODO
    calculateRatingFromPerfArr(perfArr) {
        // This function runs slower but more accurate than predictNewRatingFromLast.
        // predictNewRatingFromLast will fails when a user has just a few competitions
        // But calculateRatingFromPerfArr can calculate with any competitions
    }

    /**
     * Add the rated rank before calculating performance
     * Assume we have 3 people with the same rank at 2nd. The rank table that is showed in atcoder will like this
     * Displayed ranks    Ranks is used to calculate performance
     *    1                    1
     *    2                    3
     *    2         =>         3
     *    2                    3
     *    5                    5
     * When calculate the performance of the participants, 3 people at 2nd position should be considered like 3rd.
     * Atcoder says "Note that the rank is the average of all tied places - for example, if four
                     people are tied from the 3rd place to the 6th place, the rank of these people
                     is 4.5."
     */
    addRatedRank(standings) {
        // add rated rank for the rated participants
        const len = standings.StandingsData.length;
        let startIndex = 0, endIndex = 0;
        let beforeRatedCount = 0;
        while (endIndex < len) {
            let ratedCount = 0;
            while (endIndex + 1 < len && standings.StandingsData[endIndex + 1].Rank === standings.StandingsData[startIndex].Rank) {
                endIndex++;
            }
            for (let i = startIndex; i <= endIndex; i++)
                if (standings.StandingsData[i].IsRated) ratedCount++;

            const actualRatedRank = (beforeRatedCount + 1 + beforeRatedCount + ratedCount) / 2;
            for (let i = startIndex; i <= endIndex; i++)
                standings.StandingsData[i].RatedRank = actualRatedRank;

            beforeRatedCount += ratedCount;
            endIndex++;
            startIndex = endIndex;
        }

        // add rated rank for the unrated participants
        let curRank = beforeRatedCount + 1;
        for (let i = standings.StandingsData.length - 1; i >= 0; i--) {
            if (standings.StandingsData[i].IsRated) {
                curRank = standings.StandingsData[i].RatedRank;
            } else {
                standings.StandingsData[i].RatedRank = curRank;
            }
        }
        return standings;
    }
}
