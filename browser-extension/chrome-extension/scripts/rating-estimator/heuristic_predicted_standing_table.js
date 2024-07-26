/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * performanceArr is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 */
class HeuristicPredictedStandingTable extends StandingTable {
    constructor(allPerfHistory, performanceArr, standings) {
        super();
        this.result = this.loadData(allPerfHistory, performanceArr, standings);
        this.observeFirstColumnChanged();
        this.addHeaderAndFooter();
    }

    loadData(allRoundedPerfHistory, performanceArr, standings) {
        standings = this.addRatedRank(standings);
        let predictedResult = new Map();
        let unratedCount = 0;
        for (let i = 0; i < standings.StandingsData.length; i++) {
            const userScreenName = standings["StandingsData"][i].UserScreenName;
            const isRated = standings.StandingsData[i].IsRated;
            const isDeleted = standings.StandingsData[i].UserIsDeleted;
            const oldRating = standings.StandingsData[i].Rating;
            const rank = standings.StandingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = performanceArr[Math.floor(rank) - 1] ?? 0; // prevents out of bound error when new users joined after the last generated time
            const downPerformance = performanceArr[Math.ceil(rank) - 1] ?? 0;
            const perfInContest = positivize(Math.floor((upPerformance + downPerformance) / 2));
            let newRating = oldRating;
            if (isRated && !isDeleted) {
                // Prefer calculating based on the performance history to calculate based on last performance
                if (userScreenName in allRoundedPerfHistory)
                    newRating = this.calculateRatingFromPerfArr(allRoundedPerfHistory[userScreenName], perfInContest);
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
            while (endIndex + 1 < len && standings.StandingsData[endIndex + 1].Rank === standings.StandingsData[startIndex].Rank)
                endIndex++;

            for (let i = startIndex; i <= endIndex; i++)
                if (standings.StandingsData[i].IsRated)
                    ratedCount++;

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
            if (standings.StandingsData[i].IsRated)
                curRank = standings.StandingsData[i].RatedRank;
            else
                standings.StandingsData[i].RatedRank = curRank;
        }
        return standings;
    }

    calculateRatingFromPerfArr(pastPerfArr, perfInContest) {
        pastPerfArr.push(perfInContest);
        const perfArr = pastPerfArr.reverse();
        const S = 724.4744301;
        const R = 0.8271973364;
        const Q = [];
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
