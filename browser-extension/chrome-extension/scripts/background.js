chrome.runtime.onInstalled.addListener((details) => {
    if (details.previousVersion <= '0.3.2' && details.reason === 'update') {
        chrome.storage.local.clear();
    }
});
