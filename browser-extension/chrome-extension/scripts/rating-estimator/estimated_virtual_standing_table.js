/**
 * Predict performance for the virtual participation
 * This prediction runs without the final result from Atcoder
 */
class PredictedVirtualStandingTable extends StandingTable {
    constructor(virtualStandings, standings, rank2Perf) {
        super();
        this.virtualStandings = virtualStandings;
        this.standings = standings;
        this.rank2Perf = rank2Perf;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        // Map (score, elapsed) to performance
        let sep = [];
        const standingsData = this.standings.StandingsData.filter(user => user.IsRated);
        for (let i = 0; i < standingsData.length; i++) {
            if (standingsData[i].IsRated) {
                sep.push({
                    score: standingsData[i].TotalResult.Score,
                    elapsed: standingsData[i].TotalResult.Elapsed,
                    performance: this.rank2Perf[i] ?? 0,
                    userScreenName: standingsData[i].UserScreenName
                })
            }
        }

        const isUnratedContest = (() => this.standings.StandingsData.every((user) => !user.IsRated))();

        // Estimate performance of (score, time) in virtualStandings
        this.perfRatingData = new Map();
        let pointer = 0;
        for (let i = 0; i < this.virtualStandings.StandingsData.length; i++) {
            // for (let i=0;i<1;i++) {
            const score = this.virtualStandings.StandingsData[i].TotalResult.Score;
            const elapsed = this.virtualStandings.StandingsData[i].TotalResult.Elapsed;
            while (pointer < sep.length && score < sep[pointer].score) {
                pointer++;
            }
            while (pointer < sep.length && score == sep[pointer].score && elapsed > sep[pointer].elapsed) {
                pointer++;
            }
            const userScreenName = this.virtualStandings.StandingsData[i].UserScreenName;
            this.perfRatingData.set(userScreenName, {
                performance: isUnratedContest ? '-' : positivize(sep[pointer]?.performance ?? 0),
                userScreenName: userScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false,
                confident: true
            });
        }
    }
}
