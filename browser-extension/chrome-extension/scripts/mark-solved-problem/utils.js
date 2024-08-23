/**
 * Check if there is the next submission page or not.
 * @param {string} pageContent - The HTML content of the current page.
 * @returns {boolean} Returns true if the HTML contains a next page link, otherwise false.
 */
const hasNextPage = (pageContent) => {
    if ($($.parseHTML(pageContent)).find('table').length === 0)
        return false;

    return !pageContent.includes('<li class="disabled"><a>Next &gt;</a></li>');
}

/**
 * Add a status column to an HTML table based on the provided submission data.
 * @param {Object} result - An object contains submission data.
 * Each element of the array should be an object representing a submission.
 */
const addStatusColumnToTable = (result) => {
    if (jQuery.isEmptyObject(result))
        return;

    const table = $('table:first');

    // Add status column to head
    let headRow = $('thead:first').find('tr:first');
    const firstHeadCell = headRow.find('th').eq(0);
    let statusHeadCell = $('<th></th>');
    statusHeadCell.text('Status');
    statusHeadCell.width("3%");
    statusHeadCell.insertBefore(firstHeadCell);

    // Add status column to tbody
    const tbody = table.find('tbody:first');
    const rows = tbody.find('tr');
    for (let i = 0; i < rows.length; i++) {
        const firstCell = rows.eq(i).find('td:first'); // Get the first cell of the row
        const problem = firstCell.text();
        const newCell = $('<td></td>'); // Create a new cell
        if (result[problem]?.status) {
            newCell.html(BADGE[result[problem]?.status] ?? BADGE['JD'].replace('_STATUS_', result[problem]?.status)); // Add content to the cell
            newCell.css('cursor', 'pointer');
            newCell.children().css("cursor", "pointer");
            newCell.on("click", () => {
                const contest = getContest();
                window.location.href = `/contests/${contest}/submissions/me?f.Task=${contest}_${problem.toLowerCase()}`;
            });
        }
        newCell.insertBefore(firstCell);
    }
}

class Submission {
    constructor(tableRow) {
        const tds = tableRow.find('td')
        const isWJOrCE = tds.length === 8;
        this.time = tds.eq(0).text();
        this.task = tds.eq(1).text().split('-')[0].trim();
        this.user = tds.eq(2).text();
        this.language = tds.eq(3).text();
        this.score = tds.eq(4).text();
        this.code_size = tds.eq(5).text();
        this.status = tds.eq(6).text();
        this.exec_time = isWJOrCE ? 0 : tds.eq(7).text();
        this.memory = isWJOrCE ? 0 : tds.eq(8).text();
        this.detail = isWJOrCE ? tds.eq(7).find('a:first').href : tds.eq(9).find('a:first').href;
    }
}

/**
 * Check if a submission is judging or not
 * @param {string} stats - A submission's status
 * @returns {boolean}
 */
const isJudging = (status) => {
    return status === 'WJ' || status === 'JD' || status.includes('/');
}
