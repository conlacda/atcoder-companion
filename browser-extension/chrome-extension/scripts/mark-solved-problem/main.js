// TODO: use storage to reduce the number of requests
(async () => {
    const contest = getContest();
    const result = {};
    const loadSubmissions = async () => {
        let page = 1;
        while (true) {
            // Fetch submisison page
            const MY_SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/me?page=${page}`;
            let res;
            // Use try catch to avoid the 429 error that makes the page redirected.
            try {
                res = await fetch(MY_SUBMISSION_URL);
                if (res.status !== 200) {
                    await sleep(1000);
                    continue;
                }
            } catch (e) {
                console.log(e);
            }
            const pageContent = await res.text();
            // Extract submission result
            const document = $($.parseHTML(pageContent));
            const tbody = document.find('tbody:first');
            if (!tbody) break;

            const trows = tbody.find('tr');
            for (let i = 0; i < trows.length; i++) {
                const submission = new Submission(trows.eq(i));
                // Update result object
                if (!result.hasOwnProperty(submission.task)) {
                    result[submission.task] = submission;
                } else {
                    if (PRIORITY_LEVEL[submission.status] > PRIORITY_LEVEL[result[submission.task].status]) {
                        result[submission.task] = submission;
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
    addStatusColumnToTable(result);
})();
