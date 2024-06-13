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

        // https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

const isVirtualStandingPage = () => {
    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/virtual/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

const isExtendedStandingPage = () => {
    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/extended/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

(async () => {
    const regex = /contests\/(.*)\/standings/gm;
    const match = regex.exec(window.location.pathname);
    const contestName = match[1];
    const contest = new Contest(contestName);
    await waitForElm('table'); // Wait until the table is loaded by Vue

    if (isVirtualStandingPage()) {
        const finalResult = await contest.fetchFinalResultFromAtcoder();
        if (finalResult.length > 0) {
            const finalStandings = await contest.fetchStandingFromAtcoder();
            // TODO: we dont actually need to call virtualStandings.
            // convert Elapsed to "H:m" to compare result.
            const virtualStandings = await contest.fetchVirtualStandingFromAtcoder();
            new VirtualStandingTable(virtualStandings, finalStandings, finalResult);
        }
    } else if (isExtendedStandingPage()) {
        // Predict performance only
        // TODO
    } else {
        const finalResult = await contest.fetchFinalResultFromAtcoder();
        if (finalResult.length > 0) {
            new FixedStandingTable(finalResult);
        } else {
            // Make prediction
            const performanceArr = await contest.fetchPredictedPerfArr();
            // check if performanceArr was created by backend.
            if (performanceArr.length === 0)
                return;

            const standings = await contest.fetchStandingFromAtcoder();
            const contest_type = await contest.getContestType();
            if (contest_type === 'algo') {
                const allPerfHistory = await contest.fetchRoundedPerfHistory();
                new AlgoPredictedStandingTable(allPerfHistory, performanceArr, standings);
            } else if (contest_type === 'heuristic') {
                // TODO: also call to fetch history of all participants
                // To predict new rating, the heuristic contest needs perf history
                new HeuristicPredictedStandingTable(performanceArr, standings);
            }
        }
    }
})();
