/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * rank2Perf is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 */
class HeuristicPredictedStandingTable extends StandingTable {
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
        this.perfRatingData = new Map();
        let unratedCount = 0;
        for (let i = 0; i < this.standings.StandingsData.length; i++) {
            const userScreenName = this.standings["StandingsData"][i].UserScreenName;
            // do not use this.standings.StandingsData[i].IsRated
            // in a heuristic contest, IsRated is always true, but if a user does not submit
            // that user is considered as unrated
            const isRated = this.standings.StandingsData[i].TotalResult.Count > 0;
            const isDeleted = this.standings.StandingsData[i].UserIsDeleted;
            const oldRating = this.standings.StandingsData[i].Rating;
            const rank = this.standings.StandingsData[i].RatedRank; // rank has not been rounded
            const upPerformance = this.rank2Perf[Math.floor(rank) - 1] ?? 0; // prevents out of bound error when new users joined after the last generated time
            const downPerformance = this.rank2Perf[Math.ceil(rank) - 1] ?? 0;
            const perfInContest = Math.floor((upPerformance + downPerformance) / 2);
            let newRating = oldRating;
            if (isRated && !isDeleted) {
                // Prefer calculating based on the performance history to calculate based on last performance
                if (userScreenName in this.roundedPerfHistories)
                    newRating = this.calculateRatingFromPerfArr(this.roundedPerfHistories[userScreenName], perfInContest);
            }

            this.perfRatingData.set(userScreenName, {
                performance: positivize(perfInContest),
                userScreenName: userScreenName,
                oldRating: oldRating,
                newRating: newRating,
                isRated: isRated,
                confident: true
            });
            if (!isRated)
                unratedCount++;
        }
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
                if (this.standings.StandingsData[i].IsRated)
                    ratedCount++;

            const actualRatedRank = (beforeRatedCount + 1 + beforeRatedCount + ratedCount) / 2;
            for (let i = startIndex; i <= endIndex; i++)
                this.standings.StandingsData[i].RatedRank = actualRatedRank;

            beforeRatedCount += ratedCount;
            endIndex++;
            startIndex = endIndex;
        }

        // add rated rank for the unrated participants
        let curRank = beforeRatedCount + 1;
        for (let i = this.standings.StandingsData.length - 1; i >= 0; i--) {
            if (this.standings.StandingsData[i].IsRated)
                curRank = this.standings.StandingsData[i].RatedRank;
            else
                this.standings.StandingsData[i].RatedRank = curRank;
        }
    }

    calculateRatingFromPerfArr(pastPerfArr, perfInContest) {
        const perfArr = [...pastPerfArr, perfInContest].toReversed();
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
