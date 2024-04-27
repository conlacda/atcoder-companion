const contest = getContest();
const lastSubmissionKey = `${contest}_last_submission`;
const resultKey = `${contest}_result`;

var latestSubmissionTime;
var result = {};
/**
 * Retrieve data from the previous session.
 */
async function setup() {
    latestSubmissionTime = await readLocalStorage(lastSubmissionKey, '1970-01-02 01:01:01');
    result = JSON.parse(await readLocalStorage(resultKey) ?? '{}');
}

/**
 * Check if the provided HTML contains a next page link.
 * @param {string} pageContent - The HTML content of the current page.
 * @returns {boolean} Returns true if the HTML contains a next page link, otherwise false.
 */
function hasNextPage(pageContent) {
    return !pageContent.includes('<li class="disabled"><a>Next &gt;</a></li>');
}

async function hasNewSubmission(htmlDom) {
    const tbody = htmlDom.querySelector('tbody');
    const rows = tbody?.getElementsByTagName('tr');
    const lastRowSubmissionTime = rows[rows.length - 1].querySelector('td').innerText;
    return (await readLocalStorage(lastSubmissionKey, '1970-01-02 01:01:01')) < lastRowSubmissionTime;
}

function saveCrawlResult() {
    writeLocalStorage(lastSubmissionKey, latestSubmissionTime);
    writeLocalStorage(resultKey, JSON.stringify(result));
}

/**
 * Extract data from a table row (tr) and returns an object containing the extracted values.
 * @param {HTMLTableRowElement} tr - The table row element to extract data from.
 * @returns {Object} An object containing extracted data with the following properties:
 * - time {Date} - The time of the task.
 * - task {string} - The task name or identifier.
 * - user {string} - The user associated with the task.
 * - language {string} - The programming language used for the task.
 * - score {string} - The score of the task.
 * - code_size {string} - The size of the code submitted for the task.
 * - status {string} - The status of the task.
 * - exec_time {string} - The execution time of the task.
 * - memory {string} - The memory usage of the task.
 * - detail {string} - The URL link to detailed information about the task.
 */
function extractSubmissionFromRow(tr) {
    isCE = tr.querySelectorAll('td').length == 8;
    const submission = {
        time: tr.querySelectorAll('td')[0].innerText,
        task: tr.querySelectorAll('td')[1].innerText[0],
        user: tr.querySelectorAll('td')[2].innerText,
        language: tr.querySelectorAll('td')[3].innerText,
        score: tr.querySelectorAll('td')[4].innerText,
        code_size: tr.querySelectorAll('td')[5].innerText,
        status: tr.querySelectorAll('td')[6].innerText,
        exec_time: isCE ? 0 : tr.querySelectorAll('td')[7].innerText,
        memory: isCE ? 0 : tr.querySelectorAll('td')[8].innerText,
        detail: isCE ? tr.querySelectorAll('td')[7].querySelector('a').href : tr.querySelectorAll('td')[9].querySelector('a').href
    }
    if (latestSubmissionTime < submission.time) latestSubmissionTime = submission.time;
    return submission;
}

/**
 * Add a status column to an HTML table based on the provided submission data.
 * @param {Array} result - An array of submission data.
 * Each element of the array should be an object representing a submission.
 */
function addStatusColumnToTable(result) {
    const table = document.querySelector('table');

    // Add status column to head
    let headRow = document.querySelector('thead').querySelector('tr');
    const firstHeadCell = headRow.querySelectorAll('th')[0];
    let statusHeadCell = document.createElement('th');
    statusHeadCell.textContent = 'Status';
    statusHeadCell.width = "3%";
    headRow.insertBefore(statusHeadCell, firstHeadCell);

    // Add status column to tbody
    const tbody = table.querySelector('tbody');
    const rows = tbody.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const firstCell = rows[i].getElementsByTagName('td')[0]; // Get the first cell of the row
        const problem = firstCell.innerText;
        const newCell = document.createElement('td'); // Create a new cell
        if (result[problem]?.status) {
            newCell.innerHTML = BADGE[result[problem]?.status]; // Add content to the cell
            // TODO: add tooltip for new cell
            // Add hover to status badge + last submission time - 1 hour ago, 3 days ago,... + status for all test cases (1WA + 2AC + 10TLE)
            // Add link to navigate to submission page with filter
        }
        rows[i].insertBefore(newCell, firstCell); // Insert the new cell before the first cell of the row
    }
}

/**
 * Load submissions from submission pages.
 * @async
 * @returns {Promise<void>} Fetch submission pages to extract submissions info from them.
 */
async function loadSubmissions() {
    let page = 1;
    while (true) {
        // Fetch submission pages
        const MY_SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/me?page=${page}`;
        const res = await fetch(MY_SUBMISSION_URL);
        if (res.status != 200) {
            sleep(1000);
            continue;
        }
        const pageContent = await res.text();
        // Get submission results of loggin user
        const parser = new DOMParser();
        const htmlDom = parser.parseFromString(pageContent, 'text/html');
        const tbody = htmlDom.querySelector('tbody');
        if (!tbody) {
            return;
        }
        const trows = tbody.querySelectorAll('tr');
        for (let i = 0; i < trows.length; i++) {
            const submission = extractSubmissionFromRow(trows[i]);
            if (result[submission.task]?.status == 'AC')
                continue;
            if (!result.hasOwnProperty(submission.task) || result[submission.task].time <= submission.time) {
                result[submission.task] = submission;
            }
        }
        // Break if fetch all pages
        if (!(await hasNewSubmission(htmlDom)))
            break;
        if (!hasNextPage(pageContent))
            break;
        page++;
    }
    addStatusColumnToTable(result);
    return result;
}

setup().then(() => {
    loadSubmissions().then(() => {
        saveCrawlResult();
    });
});