(async () => {
    const testcaseList = await Testcase.fetchList(getContestName(), getProblemName());
    if (testcaseList.length > 0) {
        const resultTable = $('.table:last');
        addInputColumnToResultTable(resultTable);
        addOutputColumnToResultTable(resultTable);
        addDebugColumnToResultTable(resultTable);
    }
})();
