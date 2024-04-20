const [contest, problem] = getProblemInfo();

async function appendTestcase() {
    const taskStatement = document.getElementById('task-statement');
    const testcases = await fetchTestcases(contest, problem);
    testcases.forEach((tc) => {
        const inputElement = `
            <div class="part">
                <section>
                    <h3>${tc.printOutInputName}
                        <span class="btn btn-default btn-sm btn-copy ml-1" tabindex="0" data-toggle="tooltip" data-trigger="manual" title="" data-target="pre-sample10" data-original-title="Copied!">
                            Copy
                        </span>
                    </h3>
                    <div class="div-btn-copy">
                        <span class="btn-copy btn-pre" tabindex="0" data-toggle="tooltip" data-trigger="manual" title="" data-target="pre-sample10" data-original-title="Copied!">
                            Copy
                        </span>
                    </div>
                    <pre id="pre-sample10">${tc.input}</pre>
                </section>
            </div>`;
        const outputElement = `
            <div class="part">
                <section>
                    <h3>${tc.printOutOutputName}
                        <span class="btn btn-default btn-sm btn-copy ml-1" tabindex="0" data-toggle="tooltip" data-trigger="manual" title="" data-target="pre-sample11" data-original-title="Copied!">
                            Copy
                        </span>
                    </h3>
                    <div class="div-btn-copy">
                        <span class="btn-copy btn-pre" tabindex="0" data-toggle="tooltip" data-trigger="manual" title="" data-target="pre-sample11" data-original-title="Copied!">
                            Copy
                        </span>
                    </div>
                    <pre id="pre-sample11">${tc.output}</pre>
                </section>
            </div>`;

        taskStatement.insertAdjacentHTML('beforeend', inputElement);
        taskStatement.insertAdjacentHTML('beforeend', outputElement);
    })
}

appendTestcase();
