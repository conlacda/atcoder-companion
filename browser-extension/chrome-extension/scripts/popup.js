const readLocalStorage = async (key, defaultVal) => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get([key], function (result) {
            resolve(result[key] ?? defaultVal);
        });
    });
};

const writeLocalStorage = async (key, value) => {
    const obj = {};
    obj[key] = value;
    return chrome.storage.local.set(obj);
};

const DEFAULT_USER_SETTINGS = {
    testcaseSize: 0 // 512
};

(async () => {
    const USER_SETTING_KEY = "user_settings";
    let userSettings = JSON.parse(await readLocalStorage(USER_SETTING_KEY, JSON.stringify(DEFAULT_USER_SETTINGS)));
    
    const saveSettingsBtn = document.getElementById('save-settings');
    saveSettingsBtn.onclick = async () => {
        userSettings.testcaseSize = parseInt(document.querySelector('input[name="testcase-size"]:checked').value);
        await writeLocalStorage(USER_SETTING_KEY, JSON.stringify(userSettings));
        saveSettingsBtn.textContent = `Save settings \u{2705}`;
        setTimeout(() => {
            saveSettingsBtn.textContent = 'Save settings';
        }, 300); 
    }

    const sizes = [0, 512, 100000000000000];
    for (let i = 0; i < sizes.length; i++) {
        document.getElementById(`testcase-size-${sizes[i]}`).checked = (sizes[i] === userSettings.testcaseSize);
    }
})();
