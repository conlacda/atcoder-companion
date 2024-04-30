/**
 * Retrieve information about the current problem from the URL path.
 * @returns {Array<string>} An array containing contest name and problem code extracted from the URL path.
 *                           - The first element is the contest name.
 *                           - The second element is the problem code in uppercase.
 */
getProblemInfo = () => {
    const curPath = window.location.pathname;
    const regex = /contests\/.*\/tasks\/(.*)_(.*)/;
    const match = regex.exec(curPath);
    const contest = match[1];
    const problem = match[2].toUpperCase();
    return [contest, problem];
}

/**
 * Retrieve the name of the current contest from the URL path.
 * @returns {string} The name of the contest extracted from the URL path.
 */
getContest = () => {
    const curPath = window.location.pathname;
    const regex = /contests\/(.*)\/tasks/gm;
    const match = regex.exec(curPath);
    const contestName = match[1];
    return contestName;
}

/**
 * Retrieves the number of tasks in a table.
 * @returns {number} The number of tasks.
 */
getTaskNum = () => {
    const tbody = document.querySelector('tbody');
    return tbody.querySelectorAll('tr').length;
}

/**
 * Sleep in miliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise<void>} - A Promise that resolves after the specified time
 */
sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if test cases for a given contest and problem are published.
 * @param {string} contest - The name of the contest ex: abc123.
 * @param {string} problem - The name of the problem ex: A.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
 *                              whether the test cases are published (true) or not (false).
 */
isTestCasePublished = async (contest, problem) => {
    const SOURCE_PREFIX = "https://raw.githubusercontent.com/conlacda/atcoder-testcase/main";
    const listUrl = `${SOURCE_PREFIX}/${contest}/${problem}/list.txt`;
    const res = await fetch(listUrl);
    return res.status === 200;
}

/**
 * Copies the provided text to the clipboard using the Clipboard API.
 * @param {string} clipboard - The text to be copied to the clipboard.
 * @returns {Promise<void>} A Promise that resolves when the text is successfully copied to the clipboard.
 */
copyToClipboard = async (clipboard) => {
    await navigator.clipboard.writeText(clipboard);
}

// save file content to local
saveToLocal = async (content, fileName = "testcase.txt") => {
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
}
