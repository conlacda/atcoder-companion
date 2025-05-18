chrome.runtime.onInstalled.addListener((details) => {
    if (details.previousVersion <= '0.3.1' && details.reason === 'update') {
        chrome.storage.local.clear();
    }
});

chrome.runtime.setUninstallURL('https://github.com/conlacda/atcoder-companion/issues/new?title=Please%20report%20your%20issue,%20and%20then%20I%20will%20spend%20time%20to%20fix%20it%20(%E3%83%90%E3%82%B0%E3%82%92%E7%99%BA%E8%A6%8B%E3%81%95%E3%82%8C%E3%81%9F%E5%A0%B4%E5%90%88%E3%81%AF%E3%80%81%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B%E3%81%84%E3%81%9F%E3%81%A0%E3%81%91%E3%82%8B%E3%81%A8%E5%8A%A9%E3%81%8B%E3%82%8A%E3%81%BE%E3%81%99%E3%80%82)');
