/**
 * Predict performance for the extended standings table
 * Match index of Standings and index of Extended Standings to get the estimated performance.
 */
class ExtendedStandingTable extends StandingTable {
    constructor(extendedStandings, finalStandings) {
        super();
        this.result = this.loadData(extendedStandings.StandingsData, finalStandings);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
        this.addHeaderAndFooter();
    }

    loadData(standingsData, finalStandings) {
        let finalResult = new Map();
        for (let i = 0; i < standingsData.length; i++) {
            const UserScreenName = standingsData[i].UserScreenName;
            finalResult.set(UserScreenName, {
                performance: (finalStandings.length > i) ? finalStandings[i].Performance : 0,
                userScreenName: UserScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false
            });
        }
        return finalResult;
    }
}
