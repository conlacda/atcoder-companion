/**
 * Predict rating of rated participants while contest is running
 * allPerfHistory is the past performance array of all rated participants
 * rank2Perf is the performance based on rank of each user, calculate by backend (fomular 2)
 * standings is the current standings in the standing table
 * heuristicContests is the list of all the heuristic contests
 */
class HeuristicPredictedStandingTable extends StandingTable {
    constructor(roundedPerfHistories, rank2Perf, standings, heuristicContests) {
        super();
        this.roundedPerfHistories = roundedPerfHistories;
        this.rank2Perf = rank2Perf;
        this.standings = standings;
        this.heuristicContests = heuristicContests;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        this.addRatedRankToStandings();
        this.perfRatingData = new Map();
        for (let i = 0; i < this.standings.StandingsData.length; i++) {
            const userScreenName = this.standings.StandingsData[i].UserScreenName;
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
                // It’s better to calculate based on performance history rather than just the most recent performance.
                if (userScreenName in this.roundedPerfHistories) {
                    const decayedPerfsAndWeights = this.getDecayedPerfsAndWeights(
                        [...this.roundedPerfHistories[userScreenName][0], perfInContest],
                        [...this.roundedPerfHistories[userScreenName][1], getContestName()]
                    );
                    newRating = this.calculateRatingFromPerfArr(decayedPerfsAndWeights);
                }
            }

            this.perfRatingData.set(userScreenName, {
                performance: positivize(perfInContest),
                userScreenName: userScreenName,
                oldRating: oldRating,
                newRating: newRating,
                isRated: isRated,
                confident: true
            });
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

    /**
     * Get diff in days of 2 contests
     * @param {string} contestShortName1
     * @param {string} contestShortName2 
     * @returns {number}
     */
    getDiffInDays(contestShortName1, contestShortName2) {
        const contest1 = this.heuristicContests[contestShortName1];
        const contest2 = this.heuristicContests[contestShortName2];

        const datetime1 = new Date((new Date(contest1['start_time'])).getTime() + contest1['duration'] * 1000);
        const datetime2 = new Date((new Date(contest2['start_time'])).getTime() + contest2['duration'] * 1000);
        const options = { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'numeric', day: 'numeric' };

        const date1 = datetime1.toLocaleDateString('en-US', options);
        const date2 = datetime2.toLocaleDateString('en-US', options);

        return ((new Date(date1)) - (new Date(date2))) / (1000 * 3600 * 24);
    }

    /**
     * Calculate the decayed performance array of user by the formula: p = p' + 150 - 100 * d / 365
     * @param {number[]} perfs
     * @param {string[]} contestNames
     * @param {string} userScreenName
     * @returns {[number[], number[]]}
     */
    getDecayedPerfsAndWeights(perfs, contestNames) {
        const lastContest = contestNames[contestNames.length - 1];

        const weights = [];
        for (let i = 0; i < perfs.length; i++) {
            const contest = contestNames[i];
            perfs[i] = perfs[i] + 150 - 100 * this.getDiffInDays(lastContest, contest) / 365;
            weights.push(this.heuristicContests[contest].weight);
        }
        return [perfs, weights];
    }

    /**
     * 
     * @param {[number[], number[]]} decayedPerfsAndWeights 
     * @returns {number}
     */
    calculateRatingFromPerfArr(decayedPerfsAndWeights) {
        let [perfs, weights] = decayedPerfsAndWeights;
        perfs = perfs.toReversed();
        weights = weights.toReversed();

        const S = 724.4744301;
        let Q = [];
        for (let i = 0; i < perfs.length; i++) {
            for (let j = 1; j <= 100; j++) {
                Q.push([perfs[i] - S * Math.log(j), weights[i]]);
            }
        }
        Q.sort((x, y) => y[0] - x[0]);
        let rating = 0, sum = 0;
        const R = 0.8271973364;
        for (let i = 0; i < Q.length; i++) {
            const [q, w] = Q[i];
            sum += w;
            rating += q * (Math.pow(R, sum - w) - Math.pow(R, sum));
        }
        return positivize(Math.floor(rating + 0.5));
    }
}
