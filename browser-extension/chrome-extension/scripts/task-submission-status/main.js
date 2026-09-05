/**
 * Match URLs like:
 * - https://atcoder.jp/contests/<contest>/tasks
 * - https://atcoder.jp/contests/<contest>/tasks/
 * - https://atcoder.jp/contests/<contest>/tasks?lang=en
 *
 * Do not match URLs like:
 * - https://atcoder.jp/contests/<contest>/tasks_print
 * - https://atcoder.jp/contests/<contest>/tasks/<task_name>
 */
const isContestTaskListPage = () => {
    return /^\/contests\/[^/]+\/tasks\/?$/.test(window.location.pathname);
}

(async () => {
    if (!isContestTaskListPage()) {
        return;
    }

    const contest = getContest();
    try {
        while (true) {
            const result = await getLatestSubmissionStatus(contest);
            addStatusColumnToTable(result);
            const hasJudgingSubmission = Object.values(result).some(submission => submission.isJudging());
            if (!hasJudgingSubmission) {
                break;
            }
            await sleep(5000);
        }
    } catch (error) {
        console.error('Failed to update submission statuses:', error);
    }
})();
