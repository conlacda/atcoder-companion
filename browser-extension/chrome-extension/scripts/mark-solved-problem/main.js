const contest = getContest();
const lastCrawlTimeKey = `${contest}_last_crawl_time`;
const resultKey = `${contest}_result`;

(async () => {
    // Load data from storage
    let lastCrawlTime = await readLocalStorage(lastCrawlTimeKey, '1970-01-02 01:01:01');
    let result = JSON.parse(await readLocalStorage(resultKey, '{}'));
    // Load submission
    const loadSubmissions = async () => {
        let page = 1;
        while (true) {
            // Fetch submission page
            const MY_SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/me?page=${page}`;
            const res = await fetch(MY_SUBMISSION_URL);
            if (res.status !== 200) {
                await sleep(1000);
                continue;
            }
            const pageContent = await res.text();
            // Extract submission result
            const document = $($.parseHTML(pageContent));
            const tbody = document.find('tbody:first');
            if (!tbody) break;

            const trows = tbody.find('tr');
            for (let i = 0; i < trows.length; i++) {
                const submission = new Submission(trows.eq(i));
                // Update crawl time
                if (submission.isRunning()) {
                    lastCrawlTime = submission.time;
                } else if (lastCrawlTime <= submission.time) {
                    lastCrawlTime = submission.time;
                }
                // Update result object
                if (result[submission.task]?.status === 'AC')
                    continue;

                if (submission.status === 'AC')
                    result[submission.task] = submission;

                if (!result.hasOwnProperty(submission.task))
                    result[submission.task] = submission;

                // Break if this submission is old
                if (await readLocalStorage(lastCrawlTimeKey, '1970-01-02 01:01:01') > submission.time) {
                    return;
                }
            }
            // Break if fetch all pages
            if (!hasNextPage(pageContent)) {
                return;
            }
            console.log(hasNextPage(pageContent));
            if (page >= 10) return;
            page++;
        }
    }
    await loadSubmissions();
    addStatusColumnToTable(result);
    // Save crawl result of this session
    await writeLocalStorage(lastCrawlTimeKey, lastCrawlTime);
    await writeLocalStorage(resultKey, JSON.stringify(result));
})();