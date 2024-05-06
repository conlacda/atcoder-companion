// Get contest, submission, testcase name
const contest = /\/contests\/(.*)\/custom_test/gm.exec(window.location.pathname)[1];
const urlParams = new URLSearchParams(window.location.search);
const submissionId = urlParams.get('submissionId');
const testCase = urlParams.get('testcase');
const problem = urlParams.get('problem');

// Get the submission's code
(async () => {
    const SUBMISSION_URL = `https://atcoder.jp/contests/${contest}/submissions/${submissionId}`;
    let res = await fetch(SUBMISSION_URL);
    if (res.status !== 200) return;
    let document = $(await res.text());
    const submissionSourceCode = document.find('pre#submission-code').text();
    // Set simple mode for editor
    const toggleEditorButton = $('.btn-toggle-editor');
    if (!toggleEditorButton.hasClass('active')) {
        toggleEditorButton.click();
    }
    // Put source code to editor
    $('#plain-textarea').val(submissionSourceCode);
    toggleEditorButton.click();

    // Get testcase then put to "Standard input"
    const TC_INPUT_URL = `https://raw.githubusercontent.com/conlacda/atcoder-testcases/${contest}/${contest}/${problem}/in/${testCase}`;
    res = await fetch(TC_INPUT_URL);
    if (res.status !== 200) return;
    const inputTextArea = $("#input");
    inputTextArea.val(await res.text());
    // Add Standard output
    const TC_OUTPUT_URL = `https://raw.githubusercontent.com/conlacda/atcoder-testcases/${contest}/${contest}/${problem}/out/${testCase}`;
    res = await fetch(TC_OUTPUT_URL);
    if (res.status !== 200) return;
    const standardInputDiv = inputTextArea.parent().parent();
    const expectedOutputDiv = $(`<div class="form-group"><label class="control-label col-sm-3 col-md-2">Expected Output</label><div class="col-sm-8"><textarea id="expected-output" rows="5" class="form-control customtest-textarea" readonly="readonly"></textarea><p><span class="gray">* There can be multiple outputs that are accepted as correct, depending on each problem.</span></p></div></div>`);
    standardInputDiv.after(expectedOutputDiv);
    $("#expected-output").val(await res.text());
})();
