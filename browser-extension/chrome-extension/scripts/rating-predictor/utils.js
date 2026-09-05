const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
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
