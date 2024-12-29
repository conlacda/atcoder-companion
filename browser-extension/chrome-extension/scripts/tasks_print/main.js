const isVisible = (element) => {
    return element.offsetWidth > 0 &&
        element.offsetHeight > 0 &&
        window.getComputedStyle(element).visibility !== 'hidden'
        && window.getComputedStyle(element).display !== 'none';
}

let index = 0;
while (true) {
    const taskStatement = document.getElementById('task-statement');
    if (taskStatement) {
        taskStatement.id = `task-statement-${index}`;
        index++;
    } else break;
}

for (let i = 0; i < index; i++) {
    const taskStatement = document.getElementById(`task-statement-${i}`);
    const divsAfterIODiv = taskStatement.querySelectorAll('div.io-style ~ div.part');
    const ioDivs = Array.from(divsAfterIODiv).filter(isVisible);

    for (const div of ioDivs) {
        const button = (new DOMParser()).parseFromString(`<span class="btn btn-default btn-sm btn-copy ml-1" tabindex="0">Copy</span>`, "text/html").body.firstChild;
        var h3Element = div.querySelector('h3');
        h3Element.insertAdjacentElement('beforeend', button);
        const pre = h3Element.nextElementSibling;
        button.addEventListener('click', function () {
            copyToClipboard(pre.textContent).then(() => {
                button.textContent = 'Copied';
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.blur();
                }, 500);
            });
        });
    }
}
