// Although background runs nothing, it is necessary to turn the service worker on.
// https://playwright.dev/docs/chrome-extensions
// Playwright depends on the service worker to determine the extension ID.
// Therefore, in order to test the popup, this file is needed.
