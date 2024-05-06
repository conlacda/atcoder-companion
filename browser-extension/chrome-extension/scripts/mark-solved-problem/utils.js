/**
 * Check if the provided HTML contains a next page link.
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
            // TODO: add tooltip for new cell
            // Add hover to status badge + last submission time - 1 hour ago, 3 days ago,... + status for all test cases (1WA + 2AC + 10TLE)
            // Add link to navigate to submission page with filter
        }
        newCell.insertBefore(firstCell);
    }
}

class Submission {
    constructor(tableRow) {
        const tds = tableRow.find('td')
        const isWJOrCE = tds.length === 8;
        this.time = tds.eq(0).text();
        this.task = tds.eq(1).text()[0];
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
