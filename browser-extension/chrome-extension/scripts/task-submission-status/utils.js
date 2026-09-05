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

const DEFAULT_LAST_UPDATE = '2000-01-01 01:01:01';

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
        const problemName = firstCell.find('a').attr('href').split('/').at(-1);
        const problem = firstCell.text();
        const newCell = $('<td class="ext-added"></td>'); // Create a new cell
        if (result[problem]?.status) {
            newCell.html(BADGE[result[problem]?.status] ?? BADGE['JD'].replace('_STATUS_', result[problem]?.status)); // Add content to the cell
            newCell.css('cursor', 'pointer');
            newCell.children().css("cursor", "pointer");
            newCell.on("click", () => {
                const contest = getContest();
                window.location.href = `/contests/${contest}/submissions/me?f.Task=${problemName}`;
            });
        }
        newCell.insertBefore(firstCell);
    }
}

class Submission {
    constructor() { }

    static fromHtml(tableRow) {
        const res = new Submission();
        const tds = tableRow.find('td')
        const isWJOrCE = tds.length === 8;
        res.time = tds.eq(0).text();
        res.task = tds.eq(1).text().split('-')[0].trim();
        res.user = tds.eq(2).text().trim();
        res.language = tds.eq(3).text();
        res.score = tds.eq(4).text();
        res.code_size = tds.eq(5).text();
        res.status = tds.eq(6).text();
        res.exec_time = isWJOrCE ? 0 : tds.eq(7).text();
        res.memory = isWJOrCE ? 0 : tds.eq(8).text();
        res.detail = isWJOrCE ? tds.eq(7).find('a:first').attr('href') : tds.eq(9).find('a:first').attr('href');
        return res;
    }

    static fromJson(o) {
        const res = new Submission();
        res.time = o.time;
        res.task = o.task;
        res.user = o.user.trim();
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
            /^\d+\s*\/\s*\d+$/.test(this.status);
    }

    isAccepted() {
        return this.status === 'AC';
    }

    getPriority() {
        if (this.isAccepted())
            return 2;
        if (this.isJudging())
            return 1;
        return 0;
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

const fetchSubmissionPage = async (contest, page) => {
    const url = `https://atcoder.jp/contests/${contest}/submissions/me?page=${page}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
    }

    if (new URL(res.url).pathname.startsWith('/login')) {
        throw new Error(`Failed to fetch ${url}: login required`);
    }

    const pageContent = await res.text();
    const document = $($.parseHTML(pageContent));
    const tbody = document.find('tbody:first');
    if (tbody.length === 0)
        return { pageContent, rows: null };

    return { pageContent, rows: tbody.find('tr') };
}

const getSavedUser = (submissionResult) => {
    const firstSubmission = Object.values(submissionResult)[0];
    return firstSubmission?.user ?? null;
}

/**
 * Update the best known submission for a task.
 * AC is never replaced. Otherwise, higher priority status wins; if priorities are equal, newer submission wins.
 *
 * @param {Object} submissionResult - Current submission result, keyed by task name.
 * @param {Submission} submission - New submission to merge into the result.
 */
const updateSubmissionResult = (submissionResult, submission) => {
    const currentSubmission = submissionResult[submission.task];
    if (!currentSubmission) {
        submissionResult[submission.task] = submission;
        return;
    }

    if (currentSubmission.isAccepted())
        return;

    const currentPriority = currentSubmission.getPriority();
    const newPriority = submission.getPriority();
    if (newPriority > currentPriority) {
        submissionResult[submission.task] = submission;
        return;
    }

    if (newPriority === currentPriority && currentSubmission.time < submission.time) {
        submissionResult[submission.task] = submission;
    }
}

// TODO: update the structure of submissionResult to {data: {A: Submission, B: Submission}, lastUpdate: ..}
const getLatestSubmissionStatus = async (contest) => {
    const lastUpdateKey = `${contest}_last_update`;
    let lastUpdate = await readLocalStorage(lastUpdateKey, DEFAULT_LAST_UPDATE);
    let submissionResult = await getSubmissionResult(contest);
    let savedUser = getSavedUser(submissionResult);
    if (savedUser === null) {
        lastUpdate = DEFAULT_LAST_UPDATE;
    }
    let currentSessionLastUpdate = lastUpdate;

    let page = 0;
    let isLastPageToCheck = false;
    while (true) {
        const submissionPage = await fetchSubmissionPage(contest, ++page);

        // If the first page has no submissions, clear any cached data from the previous account.
        const hasNoSubmissions = submissionPage.rows === null ||
            submissionPage.rows.length === 0;
        if (page === 1 && hasNoSubmissions) {
            submissionResult = {};
            currentSessionLastUpdate = DEFAULT_LAST_UPDATE;
            break;
        }

        if (submissionPage.rows === null)
            break;

        for (let i = 0; i < submissionPage.rows.length; i++) {
            const submission = Submission.fromHtml(submissionPage.rows.eq(i));

            if (savedUser === null)
                savedUser = submission.user;

            if (submission.user !== savedUser) {
                submissionResult = {};
                savedUser = submission.user;
                lastUpdate = DEFAULT_LAST_UPDATE;
                currentSessionLastUpdate = DEFAULT_LAST_UPDATE;
            }

            if (submission.time < lastUpdate) {
                isLastPageToCheck = true;
                break;
            }

            if (submission.time > currentSessionLastUpdate) {
                currentSessionLastUpdate = submission.time;
            }

            if (submission.isJudging()) {
                currentSessionLastUpdate = submission.time;
            }

            updateSubmissionResult(submissionResult, submission);
        }

        if (!hasNextPage(submissionPage.pageContent)) isLastPageToCheck = true;
        if (isLastPageToCheck) break;
    }

    await writeLocalStorage(`${contest}_submission_status`, submissionResult);
    await writeLocalStorage(lastUpdateKey, currentSessionLastUpdate);

    return submissionResult;
};
