(async () => {
    const testcaseList = await fetchListOfTestcases(getContestName(), getProblemName());
    if (testcaseList.length > 0) {
        const resultTable = $('.table:last');
        addInputColumnToResultTable(resultTable);
        addOutputColumnToResultTable(resultTable);
        addDebugColumnToResultTable(resultTable);
    }
})();
