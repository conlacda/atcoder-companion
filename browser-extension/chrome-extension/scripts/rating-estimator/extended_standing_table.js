class ExtendedStandingTable extends StandingTable {
    constructor(fixedResult) {
        super();
        this.result = this.loadData(fixedResult);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
    }

    loadData(fixedResult) {
        // TODO
    }
}
