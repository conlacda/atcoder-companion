/**
 * Constants
 */
const USER_SETTING_KEY = "user_settings";

/**
 * Retrieve information about the current problem from the URL path.
 * @returns {{string, string}} An object containing contest name and problem code extracted from the URL path.
 */
const getProblemInfo = () => {
    const curPath = window.location.pathname;
    const regex = /contests\/.*\/tasks\/(.*)_(.*)/;
    const match = regex.exec(curPath);
    const contest = match[1];
    const title = document.querySelector('span.h2').innerText;
    const problemID = title.includes('-') ? title.split('-')[0].trim() : match[2].toUpperCase();
    return { contest, problemID };
}

/**
 * Retrieve the name of the current contest from the URL path.
 * @returns {string} The name of the contest extracted from the URL path.
 */
const getContest = () => {
    const curPath = window.location.pathname;
    const regex = /contests\/(.*)\/tasks/gm;
    const match = regex.exec(curPath);
    const contestName = match[1];
    return contestName;
}

/**
 * Sleep in miliseconds
 * @param {number} ms - The number of milliseconds to sleep
 * @returns {Promise<void>} - A Promise that resolves after the specified time
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Copies the provided text to the clipboard using the Clipboard API.
 * @param {string} clipboard - The text to be copied to the clipboard.
 * @returns {Promise<void>} A Promise that resolves when the text is successfully copied to the clipboard.
 */
const copyToClipboard = async (clipboard) => {
    await navigator.clipboard.writeText(clipboard);
}

// save file content to local
const saveToLocal = async (content, fileName = "testcase.txt") => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
}

// Read data by key from local storage
// If key does not exist, defaultVal should be returned
const readLocalStorage = async (key, defaultVal) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            resolve(result[key] ?? defaultVal);
        });
    });
}

// Write data by {key: val} to local storage
const writeLocalStorage = async (key, value) => {
    const obj = {};
    obj[key] = value;
    return chrome.storage.local.set(obj);
}

const fetchWithRetry = async (url, options = {}, retryNum = 10) => {
    let delayMs = 500;

    await sleep(delayMs);
    for (let attempt = 0; attempt < retryNum; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            }

            const shouldRetry =
                response.status === 408
                || response.status === 429
                || response.status >= 500;

            if (!shouldRetry) {
                return response;
            }

            if (attempt === retryNum - 1) {
                return response;
            }
        } catch (error) {
            if (attempt === retryNum - 1) {
                throw error;
            }
        }

        await sleep(delayMs);
        delayMs += 1000;
    }
}
