const [contest, problem] = getProblemInfo();
const copyButtonSize = getSize($('span[data-toggle="tooltip"]:visible').first());

async function appendTestcases() {
    const taskStatement = document.getElementById('task-statement');
    const testcases = await fetchTestcases(contest, problem);
    testcases.forEach((tc) => {
        if (tc.isSample()) return;
        const inputElement = `
            <hr>
            <div class="part">
                <section style="position:relative">
                    <div class="tooltip fade top in" role="tooltip" style="display: none; position: absolute; top: ${-copyButtonSize.height}px" id="tooltip_copy_input_${tc.txtfile}">
                        <div class="tooltip-arrow" style="left: 50%"></div>
                        <div class="tooltip-inner">Copied!</div>
                    </div>
                    <h3>${tc.inputname}
                        <span class="btn btn-default btn-sm btn-copy ml-1" id="copy_input_${tc.txtfile}">
                            Copy
                        </span>
                    </h3>
                    <div class="div-btn-copy">
                        <div class="tooltip fade top in" role="tooltip" style="display: none; position: absolute; bottom: 0; right: -6px" id="tooltip_pre_input_${tc.txtfile}">
                            <div class="tooltip-arrow" style="left: 50%"></div>
                            <div class="tooltip-inner">Copied!</div>
                        </div>
                        <span class="btn-copy btn-pre" id="copy_input_2_${tc.txtfile}">
                            Copy
                        </span>
                    </div>
                    <pre>${tc.input}</pre>
                </section>
            </div>`;

        taskStatement.insertAdjacentHTML('beforeend', inputElement);
        // set position for Copied! tooltip
        const copyInputButton = document.getElementById(`copy_input_${tc.txtfile}`);
        // Add event to copy button
        copyInputButton.onclick = async () => {
            const copiedInputTooltip = document.getElementById(`tooltip_copy_input_${tc.txtfile}`);
            copiedInputTooltip.style.left = `${copyInputButton.offsetLeft - 5}px`;
            copiedInputTooltip.style.display = '';
            await copyToClipboard(tc.input);
            setTimeout(() => {
                copiedInputTooltip.style.display = 'none';
            }, 700);
        };
        // binding event for the second copy button
        const preInputTooltip = document.getElementById(`tooltip_pre_input_${tc.txtfile}`);
        const copyInputButton2 = document.getElementById(`copy_input_2_${tc.txtfile}`);
        copyInputButton2.onclick = async () => {
            await copyToClipboard(tc.input);
            preInputTooltip.style.display = '';
            setTimeout(() => {
                preInputTooltip.style.display = 'none';
            }, 700);
        }

        const outputElement = `
            <div class="part">
                <section style="position:relative">
                    <div class="tooltip fade top in" role="tooltip" style="display: none; position: absolute; top: ${-copyButtonSize.height}px" id="tooltip_copy_output_${tc.txtfile}">
                        <div class="tooltip-arrow" style="left: 50%"></div>
                        <div class="tooltip-inner">Copied!</div>
                    </div>
                    <h3>${tc.outputname}
                        <span class="btn btn-default btn-sm btn-copy ml-1" id="copy_output_${tc.txtfile}">
                            Copy
                        </span>
                    </h3>
                    <div class="div-btn-copy">
                        <div class="tooltip fade top in" role="tooltip" style="display: none; position: absolute; bottom: 0; right: -6px" id="tooltip_pre_output_${tc.txtfile}">
                            <div class="tooltip-arrow" style="left: 50%"></div>
                            <div class="tooltip-inner">Copied!</div>
                        </div>
                        <span class="btn-copy btn-pre" id="copy_output_2_${tc.txtfile}">
                            Copy
                        </span>
                    </div>
                    <pre>${tc.output}</pre>
                </section>
            </div>`;
        taskStatement.insertAdjacentHTML('beforeend', outputElement);
        // set position for Copied! tooltip
        const copiedOutputTooltip = document.getElementById(`tooltip_copy_output_${tc.txtfile}`);
        const copyOutputButton = document.getElementById(`copy_output_${tc.txtfile}`);
        copiedOutputTooltip.style.left = `${copyOutputButton.offsetLeft - 5}px`;
        copiedOutputTooltip.style.display = 'none';
        // Add event to copy button
        copyOutputButton.onclick = async () => {
            copiedOutputTooltip.style.display = '';
            await copyToClipboard(tc.output);
            setTimeout(() => {
                copiedOutputTooltip.style.display = 'none';
            }, 500);
        };
        // binding event for the second copy button
        const preOutputTooltip = document.getElementById(`tooltip_pre_output_${tc.txtfile}`);
        const copyOutputButton2 = document.getElementById(`copy_output_2_${tc.txtfile}`);
        copyOutputButton2.onclick = async () => {
            await copyToClipboard(tc.output);
            preOutputTooltip.style.display = '';
            setTimeout(() => {
                preOutputTooltip.style.display = 'none';
            }, 700);
        }
    })
}

await appendTestcases();