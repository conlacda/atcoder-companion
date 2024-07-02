/**
 * Predict performance for the virtual participation
 * This prediction will run only we have the final result
 */
class VirtualStandingTable extends StandingTable {
    constructor(virtualStandings, finalStandings, finalResult) {
        super();
        this.result = this.loadData(virtualStandings, finalStandings, finalResult);
        this.fillDataToColumns();
        this.addHeaderAndFooter();
        this.observeFirstColumnChanged();
    }

    loadData(virtualStandings, finalStandings, finalResult) {
        // Calculate the final result of each user
        let combinedContestResult = [];

        for (let i = 0; i < finalStandings.StandingsData.length; i++) {
            if (!finalStandings.StandingsData[i].IsRated)
                continue;

            combinedContestResult.push({
                username: finalStandings.StandingsData[i].UserScreenName,
                score: finalStandings.StandingsData[i].TotalResult.Score,
                elapsed: finalStandings.StandingsData[i].TotalResult.Elapsed,
                performance: finalResult[i].Performance
            });
        }

        const isUnratedContest = () => combinedContestResult.length === 0;

        // Calculate the virtual performance
        let virtualPerf = new Map();
        let j = 0;
        for (let i = 0; i < virtualStandings.StandingsData.length; i++) {
            const score = virtualStandings.StandingsData[i].TotalResult.Score;
            const elapsed = virtualStandings.StandingsData[i].TotalResult.Elapsed;
            // Move pointer j on the 
            while (j < combinedContestResult.length && score < combinedContestResult[j].score) {
                j++;
            }

            while (j < combinedContestResult.length
                && score === combinedContestResult[j].score
                && elapsed > combinedContestResult[j].elapsed) {
                j++;
            }

            virtualPerf.set(virtualStandings.StandingsData[i].UserScreenName, {
                performance: isUnratedContest() ? '-' : positivize(combinedContestResult[j]?.performance ?? 0),
                userScreenName: virtualStandings.StandingsData[i].UserScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false // dont use virtualStandings.StandingsData[i].IsRated
            });
        }

        return virtualPerf;
    }
}
