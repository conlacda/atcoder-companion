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
    document.querySelectorAll('.ext-added').forEach(e => e.remove());
    if (Object.keys(result).length === 0)
        return;

    const table = $('table:first');

    // Add status column to head
    let headRow = $('thead:first').find('tr:first');
    const firstHeadCell = headRow.find('th').eq(0);
    let statusHeadCell = $('<th class="ext-added">Status</th>').width("3%");
    statusHeadCell.insertBefore(firstHeadCell);

    // Add status column to tbody
    const tbody = table.find('tbody:first');
    const rows = tbody.find('tr');
    for (let i = 0; i < rows.length; i++) {
        const firstCell = rows.eq(i).find('td:first'); // Get the first cell of the row
        const problem = firstCell.text();
        const newCell = $('<td class="ext-added"></td>'); // Create a new cell
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
    constructor() { }

    static fromHtmlDom(tableRow) {
        const res = new Submission();
        const tds = tableRow.find('td')
        const isWJOrCE = tds.length === 8;
        res.time = tds.eq(0).text();
        res.task = tds.eq(1).text().split('-')[0].trim();
        res.user = tds.eq(2).text();
        res.language = tds.eq(3).text();
        res.score = tds.eq(4).text();
        res.code_size = tds.eq(5).text();
        res.status = tds.eq(6).text();
        res.exec_time = isWJOrCE ? 0 : tds.eq(7).text();
        res.memory = isWJOrCE ? 0 : tds.eq(8).text();
        res.detail = isWJOrCE ? tds.eq(7).find('a:first').href : tds.eq(9).find('a:first').href;
        return res;
    }
    static fromJson(o) {
        const res = new Submission();
        res.time = o.time;
        res.task = o.task;
        res.user = o.user;
        res.language = o.language;
        res.score = o.score;
        res.code_size = o.code_size;
        res.status = o.status;
        res.exec_time = o.exec_time;
        res.memory = o.memory;
        res.detail = o.detail;
        return res;
    }
    isJudging() {
        return this.status === 'WJ' ||
            this.status === 'JD' ||
            this.status.includes('/');
    }
    isAccepted() {
        return this.status === 'AC';
    }
}

/**
 * Get the stored submission result from local storage
 * @returns object of {problem: submission}
 */
const getSubmissionResult = async (contest) => {
    const submissionStatusKey = `${contest}_submission_status`;
    let submissionResult = await readLocalStorage(submissionStatusKey, {});
    let res = {};
    for (const [task, submission] of Object.entries(submissionResult)) {
        const so = Submission.fromJson(submission);
        if (!so.isJudging())
            res[task] = so;
    }
    return res;
}

const getLatestSubmissionStatus = async (contest) => {
    const lastUpdateKey = `${contest}_last_update`;
    const lastUpdate = await readLocalStorage(lastUpdateKey, '2000-01-01 01:01:01');
    let currentSessionLastUpdate = lastUpdate;
    let submissionResult = await getSubmissionResult(contest);
    // Fetch data from my submission page
    let page = 0;
    let isLastPage = false;
    while (true) {
        // Fetch submission page
        const MY_SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/me?page=${++page}`;
        let res = await fetchWithRetry(MY_SUBMISSION_URL);
        const pageContent = await res.text();
        // Extract submission result
        const document = $($.parseHTML(pageContent));
        const tbody = document.find('tbody:first');
        if (!tbody) break;

        const trows = tbody.find('tr');
        for (let i = 0; i < trows.length; i++) {
            const submission = Submission.fromHtmlDom(trows.eq(i));

            if (submission.time < lastUpdate) {
                isLastPage = true;
                break;
            }

            if (submissionResult[submission.task]?.isAccepted()) {
                continue;
            }

            if (submission.time > currentSessionLastUpdate) {
                currentSessionLastUpdate = submission.time;
            }

            if (submission.isJudging()) {
                currentSessionLastUpdate = submission.time;
            }

            // Update result object
            if (!submissionResult.hasOwnProperty(submission.task)) {
                submissionResult[submission.task] = submission;
            } else if (PRIORITY_LEVEL[submission.status] > PRIORITY_LEVEL[submissionResult[submission.task].status]) {
                submissionResult[submission.task] = submission;
            } else if (PRIORITY_LEVEL[submission.status] === PRIORITY_LEVEL[submissionResult[submission.task].status]) {
                if (submissionResult[submission.task].time < submission.time) {
                    submissionResult[submission.task].time = submission;
                    submissionResult[submission.task] = submission;
                }
            }
        }
        // Break if all pages are fetched
        if (!hasNextPage(pageContent)) isLastPage = true;
        if (isLastPage) break;
    }

    await writeLocalStorage(`${contest}_submission_status`, submissionResult);
    await writeLocalStorage(lastUpdateKey, currentSessionLastUpdate);

    return submissionResult;
};
