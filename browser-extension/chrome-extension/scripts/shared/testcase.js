const SOURCE_PREFIX = "https://raw.githubusercontent.com/conlacda/atcoder-testcases";

const SIZE_IN_BYTES = {
    'ZERO': 0,
    'SMALL': 512,
    'BIG': 100000000000000
}

// If the size of test cases is larger than 25MB, a dialog should be displayed to warn the user.
const LARGE_SIZE_IN_BYTES = 25 * 1024 * 1024;

const USER_SETTING_KEY = "user_settings";

let testCasesList = [];

/**
 * Fetch a list of test cases for the current problem.
 * @async
 * @param {string} contest - The contest identifier (ex: abc123).
 * @param {string} problem - The problem identifier (ex: A).
 * @returns {Promise<Array<Testcase>>} A promise that resolves with an array of Testcase objects representing the list of test cases.
 */
const fetchTestCasesList = async (contest, problem) => {
    if (testCasesList.length > 0) {
        return testCasesList;
    }

    const listUrl = `${SOURCE_PREFIX}/${contest}/${contest}/${problem}/list.txt`;
    const response = await fetch(listUrl);
    if (response.status === 200) {
        const content = await response.text();
        const lines = content.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const [txtfile, inputsize, outputsize] = lines[i].split(',');
            testCasesList.push(new Testcase(txtfile, parseInt(inputsize), parseInt(outputsize)));
        }
    }

    return testCasesList;
}

/**
 * Fetch the content of testcases with size not greater than userSettings.testcaseSize
 * @async
 * @param {string} contest - The contest identifier (ex: abc123).
 * @param {string} problem - The problem identifier (ex: A).
 * @returns {Promise<Array<Testcase>>} A promise that resolves with an array of Testcase objects representing the fetched test cases.
 */
const fetchTestCasesByUserSettings = async (contest, problem) => {
    let testcases = await fetchTestCasesList(contest, problem);

    // filter test cases by user's settings
    const userSettings = JSON.parse(await readLocalStorage(USER_SETTING_KEY, JSON.stringify(DEFAULT_USER_SETTINGS)));
    testcases = testcases.filter((tc) => tc.inputsize <= userSettings.testcaseSize && tc.outputsize <= userSettings.testcaseSize);

    await Promise.all(testcases.map(async tc => {
        const input = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/in/${tc.txtfile}`)
        tc.input = await input.text();
        const output = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/out/${tc.txtfile}`)
        tc.output = await output.text();
    }));

    return testcases;
}

/**
 * Return the total size of test cases (input and output) that meet the size set in user settings.
 * @async
 * @param {string} contest - The contest identifier.
 * @param {string} problem - The problem identifier.
 * @returns {Promise<number>} The total size of test cases (input and output) in bytes.
 */
const sizeOfTestCasesByUserSettings = async (contest, problem) => {
    const testcases = await fetchTestCasesList(contest, problem);
    const userSettings = JSON.parse(await readLocalStorage(USER_SETTING_KEY, JSON.stringify(DEFAULT_USER_SETTINGS)));

    let sizeInBytes = 0;
    testcases.forEach((tc) => {
        if (tc.inputsize <= userSettings.testcaseSize && tc.outputsize <= userSettings.testcaseSize) {
            sizeInBytes += tc.inputsize + tc.outputsize;
        }
    })

    return sizeInBytes;
}

/**
 * Returns size of all test cases in bytes
 * @param {string} contest - The contest identifier (ex: abc123).
 * @param {string} problem - The problem identifier (ex: A).
 * @returns {Promise<number|string>} A promise that resolves with size of all test cases that reprents in number.
 */
const sizeOfAllTestCases = async (contest, problem) => {
    const testcases = await fetchTestCasesList(contest, problem);
    let sizeInBytes = 0;
    for (let i = 0; i < testcases.length; i++) {
        sizeInBytes += testcases[i].inputsize;
        sizeInBytes += testcases[i].outputsize;
    }

    return sizeInBytes;
}

/**
 * Converts a size in bytes to a human-readable format.
 * @param {number} sizeInBytes - The size to be converted, in bytes.
 * @returns {string} A human-readable representation of the size.
 */
const humanReadable = (sizeInBytes) => {
    const roundToNearestHalf = x => Math.round(x * 2) / 2;

    if (sizeInBytes < 1024) {
        return `${sizeInBytes}B`;
    }

    let sizeInKB = roundToNearestHalf(sizeInBytes / 1024);
    if (sizeInKB < 1024) {
        return `${sizeInKB}KB`;
    }

    return `${roundToNearestHalf(sizeInKB / 1024)}MB`;
}

/**
 * Downloads all test cases for a given contest and problem as a zip file.
 * @param {string} contest - The name or identifier of the contest.
 * @param {string} problem - The name or identifier of the problem within the contest.
 * @returns {Promise<void>}
 */
const downloadAllTestCases = async (contest, problem) => {
    const zip = new JSZip();

    const testcases = await fetchTestCasesList(contest, problem);
    await Promise.all(testcases.map(async tc => {
        const input = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/in/${tc.txtfile}`);
        zip.file(`${contest}-${problem}/in/${tc.txtfile}.txt`, await input.text());
        const output = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/out/${tc.txtfile}`);
        zip.file(`${contest}-${problem}/out/${tc.txtfile}.txt`, await output.text());
    }));

    zip.generateAsync({ type: "blob" })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${contest}-${problem}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error("Error generating zip file:", error);
        });
}

/**
 * Represent a test case.
 * @class
 */
class Testcase {
    /**
     * Create an instance of Testcase.
     * @param {string} txtfile - The raw name of the test case (ex: random_test_12.txt).
     * @param {number} inputsize - The size of the input for the test case in bytes.
     * @param {number} outputsize - The size of the output for the test case in bytes.
     */
    constructor(txtfile, inputsize, outputsize) {
        this.txtfile = txtfile;
        this.inputsize = inputsize;
        this.outputsize = outputsize;
        this.input = '';
        this.output = '';
    }

    /**
     * Get the name of the input. (ex: random_test_12.txt => Random Test Input 12)
     * @readonly
     * @type {string}
     */
    get inputname() {
        return `${this.txtfile} Input`;
    }

    /**
     * Gets the name of the output. (ex: random_test_12.txt => Random Test Output 12)
     * @readonly
     * @type {string}
     */
    get outputname() {
        return `${this.txtfile} Output`;
    }

    isSample() {
        return this.txtfile.includes('sample');
    }
}
