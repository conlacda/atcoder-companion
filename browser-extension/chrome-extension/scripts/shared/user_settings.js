/**
 * Default user settings used as a fallback when no custom settings are stored.
 *
 * @constant
 * @type {UserSettings}
 */
const DEFAULT_USER_SETTINGS = {
    testcaseSize: 0,
    prediction: 0,
    showDownloadTestcasesButton: 1
};

/**
 * Retrieves user settings from local storage and merges them with default settings.
 * The returned object always contains all fields defined in {@link UserSettings}.
 *
 * @async
 * @returns {Promise<UserSettings>} A promise that resolves to a user settings object
 * containing all default settings fields.
 */
const getUserSettings = async() => {
    let userSettings = JSON.parse(await readLocalStorage(USER_SETTING_KEY, JSON.stringify({})));
    return {...DEFAULT_USER_SETTINGS, ...userSettings};
}

// Dump the user settings into HTML
// so that any scripts on the page can read them from the HTML element,
 // regardless of the world in which the script runs.
(async () => {
    const meta = document.createElement('meta');
    meta.name = 'user_settings_ext_added';
    meta.content = JSON.stringify(await getUserSettings());
    document.head.appendChild(meta);
})();
