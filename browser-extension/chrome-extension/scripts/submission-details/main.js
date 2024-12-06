(async () => {
    const testcaseList = await fetchTestCasesList(getContestName(), getProblemID());
    if (testcaseList.length > 0) {
        const resultTable = $('.table:last');
        addInputColumnToResultTable(resultTable);
        addOutputColumnToResultTable(resultTable);
        addDebugColumnToResultTable(resultTable);
    }
})();
