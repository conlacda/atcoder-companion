const curPath = window.location.pathname;

/**
 * Retrieve the name of the contest from the current path.
 * @example abc123, arc102
 * @returns {string} The name of the contest extracted from the current path.
 */
const getContestName = () => {
    const regex = /contests\/(.*)\/submissions/gm;
    const match = regex.exec(curPath);
    return match[1];
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
        .innerText[0]
        .toUpperCase();
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
