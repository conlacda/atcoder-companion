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
                const allPerfHistory = await contest.fetchAllPerformanceHistory();
                new AlgoPredictedStandingTable(allPerfHistory, performanceArr, standings);
            } else if (contest_type === 'heuristic') {
                // TODO: also call to fetch history of all participants
                // To predict new rating, the heuristic contest needs perf history
                new HeuristicPredictedStandingTable(performanceArr, standings);
            }
        }
    }
})();
/**
 * Trạng thái đang làm dở:
 * đang check xem là loại contest là algo hay heuristic
 * Do ko thể check được trực tiếp nên là mình sẽ dùng python để gen ra ngay sau khi capture được contest
 * Sau đó tại file contest.js mình sẽ call API để gọi tới lấy ra contest
 *      Đoạn này đơn giản là nếu abc, ahc, arc, agc thì làm như bình thường ko cần call API
 *      nếu tên đặc biệt như wtf, panasonic, ... thì sẽ call API để lấy
 * Sau khi lấy được contest type + isVirtual hay ko thì mk sẽ thêm code vào virtual_standing_table 
 * cũng như code sang cho heuristic
 * 
 * Check: do thời gian xử lý ban đầu khá là lâu, nếu mà người dùng yêu cầu dữ liệu tại lúc đó thì có khi làm 
 * dữ liệu bị cache -> khi xong rồi dữ liệu cũng ko được tải về nữa
 */
