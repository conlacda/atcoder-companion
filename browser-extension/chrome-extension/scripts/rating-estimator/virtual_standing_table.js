/**
 * Estimate performance for the virtual participations
 * This prediction runs only we have the final result
 */
class VirtualStandingTable extends StandingTable {
    constructor(virtualStandings, standings, finalResult) {
        super();
        this.result = this.loadData(virtualStandings, standings, finalResult);
        this.fillDataToColumns();
        this.addHeaderAndFooter();
        this.observeFirstColumnChanged();
    }

    loadData(virtualStandings, standings, finalResult) {
        // Calculate the final result of each user
        let ratedResult = [];

        // In some old contests, the length of the standings and finalResult are different.
        // So we can not use index to map standings.StandingData[i] to finalResult[i]
        // Therefore, we calculate user2Perf to map rated users to their performance.
        let user2Perf = new Map();
        for (let i = 0; i < finalResult.length; i++) {
            if (finalResult[i].IsRated) {
                user2Perf.set(finalResult[i].UserScreenName, finalResult[i].Performance);
            }
        }

        for (let i = 0; i < standings.StandingsData.length; i++) {
            if (!standings.StandingsData[i].IsRated)
                continue;

            const username = standings.StandingsData[i].UserScreenName;
            ratedResult.push({
                username: username,
                score: standings.StandingsData[i].TotalResult.Score,
                elapsed: standings.StandingsData[i].TotalResult.Elapsed,
                performance: user2Perf.get(username) ?? 0 // avoid the error that some users exist on standings but do not exist on the finalResult.
            });
        }

        const isUnratedContest = (() => ratedResult.length === 0)();

        // Calculate the virtual performance
        let virtualPerf = new Map();
        let j = 0;
        for (let i = 0; i < virtualStandings.StandingsData.length; i++) {
            const score = virtualStandings.StandingsData[i].TotalResult.Score;
            const elapsed = virtualStandings.StandingsData[i].TotalResult.Elapsed;
            // Move pointer j on the 
            while (j < ratedResult.length && score < ratedResult[j].score) {
                j++;
            }

            while (j < ratedResult.length
                && score === ratedResult[j].score
                && elapsed > ratedResult[j].elapsed) {
                j++;
            }

            const userScreenName = virtualStandings.StandingsData[i].UserScreenName;
            virtualPerf.set(userScreenName, {
                performance: isUnratedContest ? '-' : positivize(ratedResult[j]?.performance ?? 0),
                userScreenName: userScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false // do not use virtualStandings.StandingsData[i].IsRated
            });
        }

        return virtualPerf;
    }
}
