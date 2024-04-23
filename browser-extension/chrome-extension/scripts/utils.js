/**
 * Retrieve information about the current problem from the URL path.
 * @returns {Array<string>} An array containing contest name and problem code extracted from the URL path.
 *                           - The first element is the contest name.
 *                           - The second element is the problem code in uppercase.
 */
function getProblemInfo() {
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
function getContest() {
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
function getTaskNum() {
    const tbody = document.querySelector('tbody');
    return tbody.querySelectorAll('tr').length;
}

/**
 * Read data from the local storage.
 * @async
 * @param {string} key - The key to identify the data in the local storage.
 * @returns {Promise<any>} A promise that resolves with the value associated with the given key,
 * or rejects if the key is not found.
 */
async function readLocalStorage(key, defaultVal) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            resolve(result[key] ?? defaultVal);
        });
    });
};

/**
 * Write data from the local storage.
 * @async
 * @param {string} key - The key of object.
 * @param {string} value - The value corresponds to the key.
 * @returns {Promise<any>} A promise that resolves with the value associated with the given key,
 * or rejects if the key is not found.
 */
async function writeLocalStorage(key, value) {
    const obj = {};
    obj[key] = value;
    return chrome.storage.local.set(obj);
}

/**
 * Clear the local storage if its size exceeds the maximum allowed size.
 * @async
 * @returns {Promise<void>} A Promiset that clear chrome.storage.local if it reaches the storage limit.
 */
async function clearLocalStorageIfFull() {
    const localStorageSize = chrome.storage.local.getBytesInUse();
    const MAX_STORAGE_SIZE = 1024 * 1024; // 1MB
    if (localStorageSize > MAX_STORAGE_SIZE) {
        await chrome.storage.local.clear();
    }
}
