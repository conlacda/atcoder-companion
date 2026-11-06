// Runs in the isolated world, where extension messaging is available.
window.addEventListener('message', event => {
    if (event.source !== window || event.origin !== location.origin) return;
    const message = event.data;
    if (message?.type !== 'companion-practice-request' || typeof message.id !== 'string') return;
    chrome.runtime.sendMessage({ type: 'companion-practice-fetch', path: message.path }, response => {
        const error = chrome.runtime.lastError?.message;
        window.postMessage({
            type: 'companion-practice-response', id: message.id,
            ...(error ? { error } : response || { error: 'No response from the extension' })
        }, location.origin);
    });
});
