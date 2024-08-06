const DEFAULT_USER_SETTINGS = {
    testcaseSize: SIZE_IN_BYTES.ZERO,
    prediction: 0
};

(async () => {
    const userSettings = await readLocalStorage(USER_SETTING_KEY, JSON.stringify(DEFAULT_USER_SETTINGS));
    const meta = document.createElement('meta');
    meta.name = 'user_settings_ext_added';
    meta.content = userSettings;
    document.head.appendChild(meta);
})();
