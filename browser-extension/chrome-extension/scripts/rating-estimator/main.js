/**
 * First, just calculated rating for algorithm contest
 * If have time, implement for heuristic as well
 * 
 * TODO:
 * If contest was over, use API to show rating + performance
 * If contest is running, 
 *  1. crawl user competition history - ignore the difference of P & RP for top (just 1%, so after some contests it will get right)
 *      After each new contest, we will calculate the real performance. 
 *      or get APerf from atcoder predictor (tricky)
 * 2. use formular to calculate - dont need to wait when contest would be running, test with the past contests.
*/

const waitForElm = (selector) => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

(async () => {
    const regex = /contests\/(.*)\/standings/gm;
    const match = regex.exec(window.location.pathname);
    const contestName = match[1];
    const contest = new PastContest(contestName);
    const finalResult = await contest.fetchResult();

    // Wait until the table is loaded by Vue
    await waitForElm('table');
    const standingTable = new StandingTable(finalResult);
})();
