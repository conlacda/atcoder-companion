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
    // Initial contest object
    const regex = /contests\/(.*)\/standings/gm;
    const match = regex.exec(window.location.pathname);
    const contestName = match[1];
    const contest = new Contest(contestName);

    const finalResult = await contest.fetchFinalResultFromAtcoder();
    await waitForElm('table'); // Wait until the table is loaded by Vue
    if (finalResult.length === 0) { // TODO: change to > 0 after testing
        new FixedStandingTable(finalResult);
    } else {
        const performanceArr = await contest.fetchPredictedPerfArr();
        const standings = await contest.fetchStanding();
        if (performanceArr.length > 0) {
            new PredictedStandingTable(performanceArr, standings);
        }
    }
})();
