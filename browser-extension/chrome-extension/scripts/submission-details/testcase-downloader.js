/**
* Fetch test case
 * @param {string} testcase - The name of the test case file to fetch (example: sample_00.txt).
 * @param {string} [inOrOut="in"] - Indicate whether to fetch an input or output test case file. Defaults to "in".
 * @returns {Promise<?string>} A Promise that resolves with the content of the test case file if successful,
 *                             or null if the fetch operation fails.
 */
fetchTestCase = async (testcase, inOrOut = "in") => {
    const source = `https://raw.githubusercontent.com/conlacda/atcoder-testcase/main/${getContestName()}/${getProblemName()}/${inOrOut}/${testcase}`;
    const res = await fetch(source);
    if (res.status !== 200) {
        return null;
    }
    return await res.text();
}