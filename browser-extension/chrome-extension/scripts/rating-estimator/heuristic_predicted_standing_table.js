/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * performanceArr is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 * TODO: allow fetching the performance history of a user directly from Atcoder due to crawler delay (5 minutes)
 */
class HeuristicPredictedStandingTable extends StandingTable {
    constructor(allPerfHistory, performanceArr, standings) {
        super();
        this.result = this.loadData(allPerfHistory, performanceArr, standings);
        this.fillDataToColumns();
        this.addHeaderAndFooter();
        this.observeFirstColumnChanged();
    }

    // TODO: copy from algo_predicted_standing_table.js
    // need to be checked
    loadData(allRoundedPerfHistory, performanceArr, standings) {
        let predictedResult = new Map();
        let unratedCount = 0;
        for (let i = 0; i < standings.StandingsData.length; i++) {
            const userScreenName = standings["StandingsData"][i].UserScreenName;
            const isRated = standings.StandingsData[i].IsRated;
            const oldRating = standings.StandingsData[i].Rating;
            const rank = standings.StandingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = performanceArr[Math.floor(rank) - 1] ?? 0; // prevents out of bound error when new users joined after the last generated time
            const downPerformance = performanceArr[Math.ceil(rank) - 1] ?? 0;
            const perfInContest = positivize(Math.floor((upPerformance + downPerformance) / 2));
            let newRating = oldRating;
            if (isRated) {
                // Prefer calculating based on the performance history to calculate based on last performance
                if (userScreenName in allRoundedPerfHistory) {
                    newRating = this.calculateRatingFromPerfArr(allRoundedPerfHistory[userScreenName], perfInContest);
                }
            }

            predictedResult.set(userScreenName, {
                performance: perfInContest,
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

    calculateRatingFromPerfArr(pastPerfArr, perfInContest) {
        pastPerfArr.push(perfInContest)
        const perfArr = pastPerfArr.reverse()
        S = 724.4744301
        R = 0.8271973364
        Q = []
        for (let i = 0; i < perfArr.length; i++) {
            for (let j = 1; j <= 100; j++) {
                Q.push(perfArr[i] - S * Math.log(j));
            }
        }
        Q.sort((x, y) => y - x);

        let num = 0, den = 0;
        let Ri = 1;
        for (let i = 0; i < 100; i++) {
            Ri *= R;
            num += Q[i] * Ri;
            den += Ri;
        }
        return positivize(Math.floor(num / den));
    }
}
