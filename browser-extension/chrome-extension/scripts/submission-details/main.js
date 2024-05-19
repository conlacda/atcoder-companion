(async () => {
    const testcaseList = await fetchTestCasesList(getContestName(), getProblemName());
    if (testcaseList.length > 0) {
        const resultTable = $('.table:last');
        addInputColumnToResultTable(resultTable);
        addOutputColumnToResultTable(resultTable);
        addDebugColumnToResultTable(resultTable);
    }
})();
