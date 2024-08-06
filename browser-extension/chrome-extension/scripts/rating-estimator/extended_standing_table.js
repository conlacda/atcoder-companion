/**
 * Predict performance for the extended standings table
 * Match index of Standings and index of Extended Standings to get the estimated performance.
 */
class ExtendedStandingTable extends StandingTable {
    constructor(extendedStandings, finalStandings) {
        super();
        this.extendedStandings = extendedStandings;
        this.finalStandings = finalStandings;
        this.calPerfAndRating();
        this.fillDataToColumns();
    }

    calPerfAndRating() {
        this.perfRatingData = new Map();
        for (let i = 0; i < this.extendedStandings.StandingsData.length; i++) {
            const userScreenName = this.extendedStandings.StandingsData[i].UserScreenName;
            this.perfRatingData.set(userScreenName, {
                performance: (this.finalStandings.length > i) ? positivize(this.finalStandings[i].Performance) : 0,
                userScreenName: userScreenName,
                oldRating: 0,
                newRating: 0,
                isRated: false,
                confident: true
            });
        }
    }
}
