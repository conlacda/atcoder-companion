(async () => {
    const contest = getContest();
    while (true) {
        const result = await getLatestSubmissionStatus(contest);
        addStatusColumnToTable(result);
        const hasJudgingSubmission = Object.values(result).some(submission => submission.isJudging());
        if (!hasJudgingSubmission) {
            break;
        }
        await sleep(5000);
    }
})();

