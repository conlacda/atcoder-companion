(async () => {
    const contest = getContest();
    const lastUpdateKey = `${contest}_last_update`;
    let last_update = await readLocalStorage(lastUpdateKey, '2000-01-01 01:01:01');
    let currentSessionLastUpdate = last_update;
    
    const submissionStatusKey = `${contest}_submission_status`;
    let submissionStt = await readLocalStorage(submissionStatusKey, {});
    const loadSubmissions = async () => {
        let page = 1;
        while (true) {
            // Fetch submission page
            const MY_SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/me?page=${page}`;
            let res = await fetchWithRetry(MY_SUBMISSION_URL);
            const pageContent = await res.text();
            // Extract submission result
            const document = $($.parseHTML(pageContent));
            const tbody = document.find('tbody:first');
            if (!tbody) break;

            const trows = tbody.find('tr');
            for (let i = 0; i < trows.length; i++) {
                const submission = new Submission(trows.eq(i));
                // Update last update
                if (submission.time < last_update)
                    return;
                
                if (submission.time > currentSessionLastUpdate) {
                    currentSessionLastUpdate = submission.time;
                }
                
                if (Submission.isJudging(submission.status)) {
                    currentSessionLastUpdate = submission.time;
                }
                
                // Update result object
                if (!submissionStt.hasOwnProperty(submission.task)) {
                    submissionStt[submission.task] = submission;
                } else {
                    if (PRIORITY_LEVEL[submission.status] > PRIORITY_LEVEL[submissionStt[submission.task].status]) {
                        submissionStt[submission.task] = submission;
                    }
                }
            }
            // Break if fetch all pages
            if (!hasNextPage(pageContent)) {
                return;
            }
            page++;
        }
    }
    await loadSubmissions();
    addStatusColumnToTable(submissionStt);
    // Discard WJ, JD then store to local storge. WJ, JD just are for showing in the current session not persistent.
    for (const [task, submission] of Object.entries(submissionStt)) {
        if (Submission.isJudging(submission.status))
            delete submissionStt[task];
    }
    await writeLocalStorage(lastUpdateKey, currentSessionLastUpdate);
    await writeLocalStorage(submissionStatusKey, submissionStt);
})();
