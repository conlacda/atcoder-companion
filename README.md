# AtCoder Companion
> A browser extension that enhances your AtCoder experience

[![Playwright Tests](https://github.com/conlacda/useful-atcoder/actions/workflows/playwright.yml/badge.svg)](https://github.com/conlacda/useful-atcoder/actions/workflows/playwright.yml) 

[![Atcoder companion in Chrome Web Store](/images/available_chome_webstore.png 'Available in the Chrome Web Store')](https://chromewebstore.google.com/detail/atcoder-companion/bflhekmjlbpdlibcmojpikplaldgceec) [![Atcoder companion in Firefox add-ons](/images/available_firefox_webstore.png 'Available in the Firefox add-ons')](https://addons.mozilla.org/en-US/firefox/addon/atcoder-companion/)


## Features

### Rating prediction
Accurately predicts your rating during an ongoing contest.

![](images/estimate-rating.png)

### Solved problem status
![mark-solved-problems.png](images/mark-solved-problems.png)

### Test cases (for some older contests)
Add more test cases to the problem statement and download all test cases with one click.

![add-test-cases.png](images/add-test-cases.png)

![](images/download-testcases.png)

You can also copy or download individual test cases and use them to debug your code.

![copy-download-debug.png](images/copy-download-debug.png)

### Debug with a custom test
> This feature is available if test cases exist for the contest.

Click one of the ![](images/bug.svg) buttons shown above to open a custom test page. Your submitted code and the test case input and output will be filled in automatically.

![custom-page-source-code.png](images/custom-page-source-code.png)
![custom-page-in-out.png](images/custom-page-in-out.png)

## Reference
* Some of the source code is based on [atcoder-rating-estimator](https://github.com/koba-e964/atcoder-rating-estimator).

## Accuracy limitations
When generating prediction data, the backend calculates performance using an integer rank. In reality, a rank can be rounded to the nearest 0.5 ([documentation, formula 2](https://www.dropbox.com/scl/fo/kwegqfivzi6poaxrzjv5c/AHjoZ-NKH5T-1h5xG__eUbc?dl=0&e=1&preview=rating.pdf&rlkey=mdcoluspeabxfouitvoqdb8cd)). This difference may cause prediction errors.

## Development
### .env
Before running the tests, copy `.env.example` to `.env`, then add your AtCoder account credentials.

### Run GitHub Actions locally
Start the self-hosted GitHub Actions runner. It will listen for events defined in the GitHub Actions workflow file.

```shell
cd actions-runner
./run.cmd
```
