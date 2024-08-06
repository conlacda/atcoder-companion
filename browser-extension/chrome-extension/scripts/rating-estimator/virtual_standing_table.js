/**
 * Estimate performance for the virtual participations
 * This prediction runs only we have the final result
 */
class VirtualStandingTable extends StandingTable {
    constructor(virtualStandings, standings, finalResult) {
        super();
        this.virtualStandings = virtualStandings;
        this.standings = standings;
        this.finalResult = finalResult;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        // Calculate the final result of each user
        let ratedResult = [];

        // In some old contests, the length of the standings and finalResult are different.
        // So we can not use index to map standings.StandingData[i] to finalResult[i]
        // Therefore, we calculate user2Perf to map rated users to their performance.
        let user2Perf = new Map();
        for (let i = 0; i < this.finalResult.length; i++) {
            if (this.finalResult[i].IsRated) {
                user2Perf.set(this.finalResult[i].UserScreenName, this.finalResult[i].Performance);
            }
        }

        for (let i = 0; i < this.standings.StandingsData.length; i++) {
            if (!this.standings.StandingsData[i].IsRated)
                continue;

            const username = this.standings.StandingsData[i].UserScreenName;
            ratedResult.push({
                username: username,
                score: this.standings.StandingsData[i].TotalResult.Score,
                elapsed: this.standings.StandingsData[i].TotalResult.Elapsed,
                performance: user2Perf.get(username) ?? 0 // avoid the error that some users exist on standings but do not exist on the finalResult.
            });
        }

        const isUnratedContest = (() => ratedResult.length === 0)();

        // Calculate the virtual performance
        this.perfRatingData = new Map();
        let j = 0;
        for (let i = 0; i < this.virtualStandings.StandingsData.length; i++) {
            const score = this.virtualStandings.StandingsData[i].TotalResult.Score;
            const elapsed = this.virtualStandings.StandingsData[i].TotalResult.Elapsed;
            // Move pointer j on the 
            while (j < ratedResult.length && score < ratedResult[j].score) {
                j++;
            }

            while (j < ratedResult.length
                && score === ratedResult[j].score
                && elapsed > ratedResult[j].elapsed) {
                j++;
            }

            const userScreenName = this.virtualStandings.StandingsData[i].UserScreenName;
            this.perfRatingData.set(userScreenName, {
                performance: isUnratedContest ? '-' : positivize(ratedResult[j]?.performance ?? 0),
                userScreenName: userScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false, // do not use virtualStandings.StandingsData[i].IsRated,
                confident: true
            });
        }
    }
}
