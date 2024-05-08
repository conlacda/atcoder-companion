const SOURCE_PREFIX = "https://raw.githubusercontent.com/conlacda/atcoder-testcases";

const SIZE_IN_BYTES = {
    'ZERO': 0,
    'SMALL': 512 * 1024,
    'BIG': 1000000000
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

    /**
     * Fetch a list of test cases for the current problem.
     * @async
     * @param {string} contest - The contest identifier (ex: abc123).
     * @param {string} problem - The problem identifier (ex: A).
     * @returns {Promise<Array<Testcase>>} A promise that resolves with an array of Testcase objects representing the list of test cases.
     */
    static async fetchList(contest, problem) {
        let list = [];
        const listUrl = `${SOURCE_PREFIX}/${contest}/${contest}/${problem}/list.txt`;
        const response = await fetch(listUrl);
        if (response.status === 200) {
            const content = await response.text();
            const lines = content.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                const [txtfile, inputsize, outputsize] = lines[i].split(',');
                list.push(new Testcase(txtfile, parseInt(inputsize), parseInt(outputsize)));
            }
        }
        return list;
    }

    /**
     * Fetch the content of testcases with size within constant SIZE_IN_BYTES.SMALL
     * @async
     * @param {string} contest - The contest identifier (ex: abc123).
     * @param {string} problem - The problem identifier (ex: A).
     * @returns {Promise<Array<Testcase>>} A promise that resolves with an array of Testcase objects representing the fetched test cases.
     */
    static async fetchAll(contest, problem) {
        let testcases = await this.fetchList(contest, problem);
        // get testcase size from user settings
        const USER_SETTING_KEY = "user_settings";
        const userSettings = JSON.parse(await readLocalStorage(USER_SETTING_KEY, "{}"));
        testcases = testcases.filter((tc) => tc.inputsize <= userSettings.testcaseSize && tc.outputsize <= userSettings.testcaseSize);
        await Promise.all(testcases.map(async tc => {
            const input = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/in/${tc.txtfile}`)
            tc.input = await input.text();
            const output = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/out/${tc.txtfile}`)
            tc.output = await output.text();
        }));
        return testcases;
    }
}
