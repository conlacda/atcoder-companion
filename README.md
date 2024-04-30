# An extension to enhance the experience for atcoder

[![Playwright Tests](https://github.com/conlacda/useful-atcoder/actions/workflows/playwright.yml/badge.svg)](https://github.com/conlacda/useful-atcoder/actions/workflows/playwright.yml)

## Features I think I should implement
* [x] Add test cases to a problem statement
* [x] Mark solved problems
* [x] Debug with custom test page
* [x] Add copy, download and debug button to the submission page.
* [] Predict rating during a contest
* [] Add cronjob to download test cases
* [] Add setup page

## Improvement
* Upload to Chrome store, firefox
* Write tests to make sure it works
* Follow [best practices to claim badge](https://support.google.com/chrome_webstore/answer/1050673?hl=en&visit_id=638494791511429235-3837272215&p=cws_badges&rd=1#cws_badges&zippy=%2Cunderstand-chrome-web-store-badges)

## Reference
* [Chrome extension samples](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/alarms)

## Develop
### .env
Before running test, create .env as .env.example file then fill your atcoder account.

### Run github action
Turn self-hosted github action locally. It will listen for events defined at github action .yml file
```shell
cd actions-runner
./run.cmd
```
