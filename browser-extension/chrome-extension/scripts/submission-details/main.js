(async () => {
    const tcpub = await isTestCasePublished(getContestName(), getProblemName());
    if (!tcpub) {
        return;
    }
    const resultTable = $('.table:last');
    addInputColumnToResultTable(resultTable);
    addOutputColumnToResultTable(resultTable);
    addDebugColumnToResultTable(resultTable);
})();
