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

const isVuePresent = (property = '') => {
    let present = typeof vueStandings !== 'undefined';
    if (property)
        present = present && vueStandings.hasOwnProperty(property);
    return present;
};

const isVirtualStandingPage = () => {
    if (isVuePresent() && vueStandings.isVirtual)
        return vueStandings.isVirtual ?? false;

    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/virtual/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

const isExtendedStandingPage = () => {
    if (isVuePresent('isExtended'))
        return vueStandings.isExtended ?? false;

    const curUrl = window.location.pathname;
    const regex = /contests\/(.*)\/standings\/extended/gm;
    const match = regex.exec(curUrl);
    return match?.length > 0;
}

const getContestName = () => {
    if (isVuePresent('contestScreenName'))
        return vueStandings.contestScreenName;

    const regex = /contests\/(.*)\/standings/gm;
    const match = regex.exec(window.location.pathname);
    return match[1];
}

const getUserSettings = () => {
    const meta = document.querySelector('meta[name="user_settings_ext_added"]');
    return JSON.parse(meta.content);
}

const joinedAsRatedUser = (standings, userScreenName) => {
    for (let i = 0; i < standings.StandingsData.length; i++) {
        if (standings.StandingsData[i].UserScreenName === userScreenName && standings.StandingsData[i].IsRated) {
            return true;
        }
    }
    return false;
}

const getPerfHistory = async (userScreenName, contest_type) => {
    const res = await fetchWithRetry(`https://atcoder.jp/users/${userScreenName}/history/json?contestType=${contest_type}`);
    let userPerfHistory = await res.json();
    userPerfHistory = userPerfHistory.filter(item => item.IsRated);
    const perfs = userPerfHistory.map(item => item.Performance);
    if (contest_type == 'algo')
        return perfs;

    const contests = userPerfHistory.map(item => item.ContestScreenName.split('.')[0]);
    return [perfs, contests];
}

const USER_SETTINGS = {
    PREDICT: {
        ALWAYS: 0,
        PAST_CONTESTS_ONLY: 1,
        DISABLED: 2
    }
};

(async () => {
    const userSettings = getUserSettings();
    if (userSettings.prediction === USER_SETTINGS.PREDICT.DISABLED)
        return;

    const contest = new Contest(getContestName());
    await waitForElm('table');

    const fixedResult = await contest.fetchFinalResultFromAtcoder();
    if (isVirtualStandingPage()) {
        const standings = await contest.fetchStandingFromAtcoder();
        if (fixedResult.length > 0) {
            // https://img.atcoder.jp/public/a68b1c6/js/standings.js
            const virtualStandings = isVuePresent('standings') ? vueStandings.standings : (await contest.fetchVirtualStandingFromAtcoder());
            new VirtualStandingTable(virtualStandings, standings, fixedResult);
        } else {
            // Predict perf on the virtual standing page without the final result from Atcoder
            const rank2Perf = await contest.fetchPredictedPerfArr();
            const virtualStandings = isVuePresent('standings') ? vueStandings.standings : (await contest.fetchVirtualStandingFromAtcoder());
            new PredictedVirtualStandingTable(virtualStandings, standings, rank2Perf);
        }
    } else if (isExtendedStandingPage()) {
        const extendedStandings = isVuePresent('standings') ? vueStandings.standings : (await contest.fetchExtendedStandingsFromAtcoder());
        new ExtendedStandingTable(extendedStandings, fixedResult);
    } else {
        /**
         * Trick: after a contest, in order to check the accuracy of the prediction
         * comment FixedStandingTable then use AlgoPredictedStandingTable to predict.
         * Now the rating changes will be the difference between prediction and reality.
         */
        if (fixedResult.length > 0) {
            const standings = isVuePresent('standings') ? vueStandings.standings : (await contest.fetchStandingFromAtcoder());
            const rank2Perf = await contest.fetchPredictedPerfArr(true);
            new FixedStandingTable(standings, fixedResult, rank2Perf);
        } else {
            if (userSettings.prediction === USER_SETTINGS.PREDICT.PAST_CONTESTS_ONLY)
                return;
            // Make prediction
            const rank2Perf = await contest.fetchPredictedPerfArr();
            // check if rank2Perf has been created by backend.
            if (rank2Perf.length === 0)
                return;

            const standings = isVuePresent('standings') ? vueStandings.standings : (await contest.fetchStandingFromAtcoder());
            const contest_type = await contest.getContestType();
            const roundedPerfHistories = await contest.fetchRoundedPerfHistory();
            if (joinedAsRatedUser(standings, userScreenName) && !(userScreenName in roundedPerfHistories)) {
                roundedPerfHistories[userScreenName] = await getPerfHistory(userScreenName, contest_type);
            }
            if (contest_type === 'algo') {
                new AlgoPredictedStandingTable(roundedPerfHistories, rank2Perf, standings);
            } else if (contest_type === 'heuristic') {
                const heuristicContests = await contest.getHeuristicContestList();
                new HeuristicPredictedStandingTable(roundedPerfHistories, rank2Perf, standings, heuristicContests);
            }
        }
    }
})();
