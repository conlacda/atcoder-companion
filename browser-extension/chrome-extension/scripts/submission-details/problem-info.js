const curPath = window.location.pathname;

/**
 * Retrieve the name of the contest from the current path.
 * @example abc123, arc102
 * @returns {string} The name of the contest extracted from the current path.
 */
const getContestName = () => {
    const regex = /contests\/(.*)\/submissions/gm;
    const match = regex.exec(curPath);
    // In some old contests, ABC & ARC contests share a part of problems. 
    // To download the test cases, we need to convert it to the correct contest that has uploaded test cases.
    const contest = match[1];
    return mappingForTestCase[contest] ?? contest;
};

/**
 * Retrieve the problem ID
 * Do not use the problem's URL to extract the problem ID. See issue #4 & #5 for more details.
 * @example A, B, C or D
 * @returns {string} The problem ID
 */
const getProblemID = () => {
    return document.querySelector('.table')
        .querySelectorAll('tr')[1]
        .querySelector('a')
        .innerText
        .split('-')[0]
        .trim();
};

/**
 * Retrieves the submission ID from the current path.
 * @returns {string} The submission ID extracted from the current path.
 */
const getSubmissionId = () => {
    const regex = /contests\/.*\/submissions\/(.*)/gm;
    const match = regex.exec(curPath);
    return match[1];
};
