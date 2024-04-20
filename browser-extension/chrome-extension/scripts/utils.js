function getProblemInfo() {
    const curPath = window.location.pathname;
    const regex = /contests\/.*\/tasks\/(.*)_(.*)/;
    const match = regex.exec(curPath);
    const contest = match[1];
    const problem = match[2].toUpperCase();
    return [contest, problem];
}

function getContest() {
    const curPath = window.location.pathname;
    const regex = /contests\/(.*)\/tasks/gm;
    const match = regex.exec(curPath);
    const contestName = match[1];
    return contestName;
}
