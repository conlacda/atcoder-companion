const curPath = window.location.pathname;

/**
 * Retrieve the name of the contest from the current path.
 * @example abc123, arc102
 * @returns {string} The name of the contest extracted from the current path.
 */
getContestName = () => {
    const regex = /contests\/(.*)\/submissions/gm;
    const match = regex.exec(curPath);
    return match[1];
};

/**
 * Retrieve the problem name
 * @example A, B, C or D
 * @returns {string} The problem name
 */
getProblemName = () => {
    return $(".table")                // Selecting the "Submission Info" table
        .first()
        .find('tr')               // The second row contains problem name
        .eq(1)
        .find('a')                // <a> contains url of the problem
        .attr('href')
        .at(-1)                   // Last character of url is the problem nam (A, B, C, D)
        .toUpperCase();
};

/**
 * Retrieves the submission ID from the current path.
 * @returns {string} The submission ID extracted from the current path.
 */
getSubmissionId = () => {
    const regex = /contests\/.*\/submissions\/(.*)/gm;
    const match = regex.exec(curPath);
    return match[1];
};