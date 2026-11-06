chrome.runtime.onInstalled.addListener((details) => {
    if (details.previousVersion <= '0.3.2' && details.reason === 'update') {
        chrome.storage.local.clear();
    }
});

// Only these public, read-only API endpoints are exposed to standings pages.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'companion-practice-fetch') return;
    if (!/^https:\/\/atcoder\.jp\/contests\/[^/]+\/standings\/?(?:\?.*)?$/.test(sender.url || '')) return;
    const path = message.path;
    if (typeof path !== 'string' || !/^(resources\/contests\.json|atcoder-api\/v3\/users_and_time\?users=[A-Za-z0-9_]+(?:,[A-Za-z0-9_]+)*&problems=[A-Za-z0-9_]+(?:,[A-Za-z0-9_]+){0,9}&from=\d+&to=\d+)$/.test(path)) {
        sendResponse({ error: 'Invalid practice API request' });
        return;
    }
    fetch(`https://kenkoooo.com/atcoder/${path}`, {
        credentials: 'omit', redirect: 'error', signal: AbortSignal.timeout(20000)
    }).then(async response => {
        if (!response.ok) throw new Error(`Practice API: ${response.status}`);
        sendResponse({ data: await response.json() });
    }).catch(error => sendResponse({ error: error.message }));
    return true; // Keep the response channel open for the asynchronous fetch.
});
