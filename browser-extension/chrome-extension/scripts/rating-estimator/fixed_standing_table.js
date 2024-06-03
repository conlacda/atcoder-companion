class FixedStandingTable extends StandingTable {
    constructor(fixedResult) {
        super();
        this.result = this.loadData(fixedResult);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
    }

    loadData(fixedResult) {
        let finalResult = new Map(); // map of {username: DataObject{}}
        for (let i = 0; i < fixedResult.length; i++) {
            finalResult.set(fixedResult[i].UserScreenName, {
                performance: this.positivize_performance(fixedResult[i].Performance),
                userScreenName: fixedResult[i].UserScreenName,
                oldRating: fixedResult[i].OldRating,
                newRating: fixedResult[i].NewRating,
                isRated: fixedResult[i].IsRated,
                competitionNum: fixedResult[i].Competitions
            });
        }
        return finalResult;
    }
}
