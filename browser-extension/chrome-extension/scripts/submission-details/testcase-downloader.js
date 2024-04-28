/**
* Fetch test case
 * @param {string} contest - The name of the contest (abc123, arc102, ...).
 * @returns {Promise<?string>} A Promise that resolves with the content of the test case file if successful,
 *                             or null if the fetch operation fails.
 */
fetchTestCase = async (testcase, inOrOut = "in") => {
    const source = `https://raw.githubusercontent.com/conlacda/atcoder-testcase/main/${getContestName()}/${getProblemName()}/${inOrOut}/${testcase}`;
    const res = await fetch(source);
    if (res.status != 200) {
        return null;
    }
    return await res.text();
}