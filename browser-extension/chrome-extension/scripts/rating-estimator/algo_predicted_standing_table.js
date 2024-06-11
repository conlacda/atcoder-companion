/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * performanceArr is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 */
class AlgoPredictedStandingTable extends StandingTable {
    constructor(allPerfHistory, performanceArr, standings) {
        super();
        this.result = this.loadData(allPerfHistory, performanceArr, standings);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
    }

    loadData(allPerfHistory, performanceArr, standings) {
        standings = this.addRatedRank(standings);

        let predictedResult = new Map(); // map of {username: DataObject{}}
        let unratedCount = 0;

        for (let i = 0; i < standings.StandingsData.length; i++) {
            const userScreenName = standings["StandingsData"][i].UserScreenName;
            const isRated = standings.StandingsData[i].IsRated;
            const oldRating = standings.StandingsData[i].Rating;
            const rank = standings.StandingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = performanceArr[Math.floor(rank) - 1] ?? 0; // prevents out of bound error when new users joined after the last generated time
            const downPerformance = performanceArr[Math.ceil(rank) - 1] ?? 0;
            const performance = StandingTable.positivize_performance(Math.floor((upPerformance + downPerformance) / 2));
            const competitionNum = standings.StandingsData[i].Competitions;
            let newRating = oldRating;
            if (isRated) {
                // Prefer calculating based on the performance history to calculate based on last performance
                if (userScreenName in allPerfHistory) {
                    // TODO: check if server returns Performance array of all participants (not InnerPerformance)
                    newRating = this.calculateRatingFromPerfArr(allPerfHistory[userScreenName], performance);
                } else {
                    newRating = this.predictNewRatingFromLast(oldRating, performance, competitionNum);
                }
            }
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

    predictNewRatingFromLast(oldRating, performance, competitionNum) {
        return calc_rating_from_last(oldRating, performance, competitionNum);
    }

    calculateRatingFromPerfArr(pastPerfArr, perfInContest) {
        // This function runs slower but more accurate than predictNewRatingFromLast.
        // predictNewRatingFromLast will fails when a user has just a few competitions
        // But calculateRatingFromPerfArr can calculate with any competitions
        pastPerfArr.push(perfInContest);
        const perfArr = pastPerfArr.reverse();
        return calc_rating(perfArr);
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
