(async () => {
    const testcaseList = await fetchTestCasesList(getContestName(), getProblemID());
    if (testcaseList.length > 0) {
        const resultTable = $('.table:last');
        if (resultTable.text().toLowerCase().includes('case name')) {
            addInputColumnToResultTable(resultTable);
            addOutputColumnToResultTable(resultTable);
            addDebugColumnToResultTable(resultTable);
        }
    }
})();
