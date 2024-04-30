addInOutColumnToResultTable = (resultTable, inOrOut) => {
    const thead = resultTable.find('thead');
    const tbody = resultTable.find('tbody');
    let rows = tbody.find('tr');

    // Add cell to header
    const lastHeadCell = thead.find('th:last');
    const inputHeadCell = $(`<th width="15%">${inOrOut === "in" ? "Input" : "Output"}</th>`);
    inputHeadCell.insertAfter(lastHeadCell);

    // Add cell to body
    rows.each(function (index, row) {
        const tcfile = $(this).find('td:first').text();
        // add copy button
        const lastTdCell = $(this).find('td:last');
        const copyIcon = $('<svg xmlns="http://www.w3.org/2000/svg" style="margin-right: 1rem" width="1.5rem" height="1.5rem" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg>');
        copyIcon.css('cursor', 'pointer');
        copyIcon.attr('id', `copy_${inOrOut}_${index}`);
        const copiedIcon = $('<svg xmlns="http://www.w3.org/2000/svg" style="margin-right: 1rem" width="1.5rem" height="1.5rem" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg>');
        copiedIcon.attr('id', `copied_${inOrOut}_${index}`);
        const copyFailedIcon = $('<svg xmlns="http://www.w3.org/2000/svg" style="margin-right: 1rem" width="1.5rem" height="1.5rem" fill="currentColor" class="bi bi-clipboard-x" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M6.146 7.146a.5.5 0 0 1 .708 0L8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 0 1 0-.708"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/></svg>');
        copyIcon.on("click", async () => {
            const testCase = await fetchTestCase(tcfile, inOrOut);
            if (testCase === null) {
                copyIcon.hide();
                copyFailedIcon.show();
                setTimeout(() => {
                    copyIcon.show();
                    copyFailedIcon.hide();
                }, 1000);
            } else {
                await copyToClipboard(testCase);
                copyIcon.hide();
                copiedIcon.show();
                setTimeout(() => {
                    copyIcon.show();
                    copiedIcon.hide();
                }, 1000);
            }
        });
        const cell = $('<td class="text-right"></td>');
        cell.append(copyIcon);
        cell.append(copiedIcon);
        copiedIcon.hide();
        cell.append(copyFailedIcon);
        copyFailedIcon.hide();

        // add download button
        const downloadIcon = $('<svg xmlns="http://www.w3.org/2000/svg" width="1.5rem" height="1.5rem" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/></svg>');
        downloadIcon.css('cursor', 'pointer');
        downloadIcon.on("click", async () => {
            const fileName = $(this).find('td:first').text();
            await saveToLocal(await fetchTestCase(tcfile, inOrOut), fileName);
        });
        cell.append(downloadIcon);
        cell.insertAfter(lastTdCell);
    });
}

addInputColumnToResultTable = (resultTable) => {
    addInOutColumnToResultTable(resultTable, "in");
}

addOutputColumnToResultTable = (resultTable) => {
    addInOutColumnToResultTable(resultTable, "out");
}

addDebugColumnToResultTable = (resultTable) => {
    const thead = resultTable.find('thead');
    const tbody = resultTable.find('tbody');

    // Add cell to header
    const lastHeadCell = thead.find('th:last');
    const debugHeadCell = $('<th width="10%">Debug</th>');
    debugHeadCell.insertAfter(lastHeadCell);

    const rows = tbody.find('tr');
    rows.each(function (index, row) {
        const tcfile = $(this).find('td:first').text();
        // add download button
        const lastTdCell = $(this).find('td:last');
        const debugIcon = $('<svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 32 32"><path fill="currentColor" d="m29.83 20l.34-2l-5.17-.85v-4.38l5.06-1.36l-.51-1.93l-4.83 1.29A9 9 0 0 0 20 5V2h-2v2.23a8.81 8.81 0 0 0-4 0V2h-2v3a9 9 0 0 0-4.71 5.82L2.46 9.48L2 11.41l5 1.36v4.38L1.84 18l.32 2L7 19.18a8.9 8.9 0 0 0 .82 3.57l-4.53 4.54l1.42 1.42l4.19-4.2a9 9 0 0 0 14.2 0l4.19 4.2l1.42-1.42l-4.54-4.54a8.9 8.9 0 0 0 .83-3.57ZM15 25.92A7 7 0 0 1 9 19v-6h6ZM9.29 11a7 7 0 0 1 13.42 0ZM23 19a7 7 0 0 1-6 6.92V13h6Z"/></svg>');
        debugIcon.css('cursor', 'pointer');
        debugIcon.on("click", () => {
            window.location.href = `https://atcoder.jp/contests/${getContestName()}/custom_test?submissionId=${getSubmissionId()}&testcase=${tcfile}&problem=${getProblemName()}`;
        });
        const cell = $('<td class="text-right"></td>');
        cell.append(debugIcon);
        cell.insertAfter(lastTdCell);
    });
}
