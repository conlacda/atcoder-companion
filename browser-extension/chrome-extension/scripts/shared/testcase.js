const SOURCE_PREFIX = "https://raw.githubusercontent.com/conlacda/atcoder-testcases";
const SMALL_FILE_SIZE = 512 * 1024; // bytes

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
        const [_, testname, num] = this.txtfile.split('.')[0].split('_');
        return `${testname.charAt(0).toUpperCase() + testname.slice(1)} Input ${parseInt(num)}`;
    }

    /**
     * Gets the name of the output. (ex: random_test_12.txt => Random Test Output 12)
     * @readonly
     * @type {string}
     */
    get outputname() {
        const [_, testname, num] = this.txtfile.split('.')[0].split('_');
        return `${testname.charAt(0).toUpperCase() + testname.slice(1)} Output ${parseInt(num)}`;
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
                list.push(new Testcase(txtfile, inputsize, outputsize));
            }
        }
        return list;
    }

    /**
     * Fetch the content of testcases with size within constant SMALL_FILE_SIZE
     * @async
     * @param {string} contest - The contest identifier (ex: abc123).
     * @param {string} problem - The problem identifier (ex: A).
     * @returns {Promise<Array<Testcase>>} A promise that resolves with an array of Testcase objects representing the fetched test cases.
     */
    static async fetchAll(contest, problem) {
        let testcases = await this.fetchList(contest, problem);
        // Keep only small testcases
        testcases = testcases.filter((tc) => tc.inputsize <= SMALL_FILE_SIZE && tc.outputsize <= SMALL_FILE_SIZE);
        await Promise.all(testcases.map(async tc => {
            const input = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/in/${tc.txtfile}`)
            tc.input = await input.text();
            const output = await fetch(`${SOURCE_PREFIX}/${contest}/${contest}/${problem}/out/${tc.txtfile}`)
            tc.output = await output.text();
        }));
        return testcases;
    }
}
