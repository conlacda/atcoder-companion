/**
 * Predict performance for the virtual participation
 * This prediction runs without the final result from Atcoder
 */
class PredictedVirtuakStandingTable extends StandingTable {
    constructor(virtualStandings, standings, performanceArr) {
        super();
        this.result = this.loadData(virtualStandings, standings, performanceArr);
        this.fillDataToColumns();
        this.addHeaderAndFooter();
        this.observeFirstColumnChanged();
    }

    loadData(virtualStandings, standings, performanceArr) {
        // Map (score, elapsed) to performance
        let sep = [];
        const standingsData = standings.StandingsData.filter(user => user.IsRated);
        for (let i = 0; i < standingsData.length; i++) {
            if (standingsData[i].IsRated) {
                sep.push({
                    score: standingsData[i].TotalResult.Score,
                    elapsed: standingsData[i].TotalResult.Elapsed,
                    performance: performanceArr[i] ?? 0,
                    userScreenName: standingsData[i].UserScreenName
                })
            }
        }

        // Estimate performance of (score, time) in virtualStandings
        let estimatedData = new Map();
        let pointer = 0;
        for (let i = 0; i < virtualStandings.StandingsData.length; i++) {
            // for (let i=0;i<1;i++) {
            const score = virtualStandings.StandingsData[i].TotalResult.Score;
            const elapsed = virtualStandings.StandingsData[i].TotalResult.Elapsed;
            while (pointer < sep.length && score < sep[pointer].score) {
                pointer++;
            }
            while (pointer < sep.length && score == sep[pointer].score && elapsed > sep[pointer].elapsed) {
                pointer++;
            }
            const userScreenName = virtualStandings.StandingsData[i].UserScreenName;
            estimatedData.set(userScreenName, {
                performance: positivize(sep[pointer]?.performance ?? 0),
                userScreenName: userScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false
            });
        }
        return estimatedData;
    }
}
