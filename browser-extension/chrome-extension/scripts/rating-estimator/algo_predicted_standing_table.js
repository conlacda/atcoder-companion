/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * performanceArr is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 */
class AlgoPredictedStandingTable extends StandingTable {
    constructor(roundedPerfHistories, rank2Perf, standings) {
        super();
        this.roundedPerfHistories = roundedPerfHistories;
        this.rank2Perf = rank2Perf;
        this.standings = standings;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        this.addRatedRankToStandings();

        this.perfRatingData = new Map(); // map of {username: DataObject{}}

        /**
         * Get bottom rank
         * In the present, the rank of the bottom users is not accurate. (ABC has difference of ~10, ARC: 40)
         * Add "confident" to perfRatingData to indicate that.
         */
        const bottomRatedRank = this.standings.StandingsData.at(-1).RatedRank;
        const standingsData = this.standings.StandingsData;
        for (let i = 0; i < standingsData.length; i++) {
            const userScreenName = standingsData[i].UserScreenName;
            const isRated = standingsData[i].IsRated;
            const isDeleted = standingsData[i].UserIsDeleted;
            const oldRating = standingsData[i].Rating;
            const rank = standingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = this.rank2Perf[Math.floor(rank) - 1] ?? 0; // prevents out of bound error when new users joined after the last generated time
            const downPerformance = this.rank2Perf[Math.ceil(rank) - 1] ?? 0;
            const perfInContest = positivize(Math.floor((upPerformance + downPerformance) / 2));
            const competitionNum = standingsData[i].Competitions;
            let newRating = oldRating;
            if (isRated && !isDeleted) {
                // Prefer calculating based on the performance history to calculate based on last performance
                if (userScreenName in this.roundedPerfHistories) {
                    newRating = this.calculateRatingFromPerfArr(this.roundedPerfHistories[userScreenName], perfInContest);
                } else {
                    newRating = this.predictNewRatingFromLast(oldRating, perfInContest, competitionNum);
                }
            }

            this.perfRatingData.set(userScreenName, {
                performance: perfInContest,
                userScreenName: userScreenName,
                oldRating: oldRating,
                newRating: newRating,
                isRated: isRated,
                confident: (bottomRatedRank === rank) ? false: true
            });
        }
    }

    predictNewRatingFromLast(oldRating, performance, competitionNum) {
        return calc_rating_from_last(oldRating, performance, competitionNum);
    }

    calculateRatingFromPerfArr(pastPerfArr, perfInContest) {
        // This function runs slower but is more accurate than predictNewRatingFromLast.
        // predictNewRatingFromLast will fail when an user has just a few number of competitions
        // But calculateRatingFromPerfArr can be used to calculate with any number of competitions.
        return calc_rating([...pastPerfArr, perfInContest].toReversed());
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
