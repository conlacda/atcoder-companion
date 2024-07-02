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
    if (vueStandings && vueStandings.isVirtual)
        return vueStandings.isVirtual ?? false;

    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/virtual/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

const isExtendedStandingPage = () => {
    if (vueStandings && vueStandings.hasOwnProperty('isExtended'))
        return vueStandings.isExtended ?? false;

    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/extended/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

const contestName = () => {
    if (vueStandings && vueStandings.hasOwnProperty('contestScreenName'))
        return vueStandings.contestScreenName;

    const regex = /contests\/(.*)\/standings/gm;
    const match = regex.exec(window.location.pathname);
    return match[1];
}

(async () => {
    const contest = new Contest(contestName());
    await waitForElm('table'); // Wait until the table is loaded by Vue

    const finalResult = await contest.fetchFinalResultFromAtcoder();
    if (isVirtualStandingPage()) {
        if (finalResult.length > 0) {
            const standings = await contest.fetchStandingFromAtcoder();
            // https://img.atcoder.jp/public/a68b1c6/js/standings.js
            const virtualStandings = (vueStandings && vueStandings.hasOwnProperty('standings')) ? vueStandings.standings : (await contest.fetchVirtualStandingFromAtcoder());
            new VirtualStandingTable(virtualStandings, standings, finalResult);
        } else {
            // Estimate perf on the virtual standing page without the final result from Atcoder
            const performanceArr = await contest.fetchPredictedPerfArr();
            const standings = await contest.fetchStandingFromAtcoder();
            const virtualStandings = (vueStandings && vueStandings.hasOwnProperty('standings')) ? vueStandings.standings : (await contest.fetchVirtualStandingFromAtcoder());
            new PredictedVirtuakStandingTable(virtualStandings, standings, performanceArr);
        }
    } else if (isExtendedStandingPage()) {
        const extendedStandings = vueStandings ? vueStandings.standings : (await contest.fetchExtendedStandingsFromAtcoder());
        new ExtendedStandingTable(extendedStandings, finalResult);
    } else {
        /**
         * Trick: after a contest, in order to check the accuracy of the prediction
         * comment FixedStandingTable then use AlgoPredictedStandingTable to predict.
         * Now the rating changes will be the difference between prediction and reality.
         */
        if (finalResult.length > 0) {
            new FixedStandingTable(finalResult);
        } else {
            // Make prediction
            const performanceArr = await contest.fetchPredictedPerfArr();
            // check if performanceArr was created by backend.
            if (performanceArr.length === 0)
                return;

            const standings = (vueStandings && vueStandings.hasOwnProperty('standings')) ? vueStandings.standings : (await contest.fetchStandingFromAtcoder());
            const contest_type = await contest.getContestType();
            const allPerfHistory = await contest.fetchRoundedPerfHistory();
            if (contest_type === 'algo') {
                new AlgoPredictedStandingTable(allPerfHistory, performanceArr, standings);
            } else if (contest_type === 'heuristic') {
                new HeuristicPredictedStandingTable(allPerfHistory, performanceArr, standings);
            }
        }
    }
})();
