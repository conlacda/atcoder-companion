class StandingTable {
    result = new Map()

    constructor() {
        this._table = document.querySelector('table');
        this.columnNum = this._table.querySelector('thead').querySelectorAll('th').length;
    }

    observeFirstColumnChanged() {
        const observer = new MutationObserver((mutations, observer) => {
            observer.disconnect();
            this.fillDataToColumns();
            observer.observe(this._table, { childList: true, subtree: true });
        });
        observer.observe(this._table, { childList: true, subtree: true });
    }

    /**
     * Add data to the columns of performnace, diff, color change
     */
    fillDataToColumns() {
        const displayingUsers = this.getDisplayingUserList();
        const data = displayingUsers.map((userScreenName) => {
            return this.result.get(userScreenName);
        });
        const trows = this._table.querySelector('tbody').querySelectorAll('tr');

        // Remove old cells
        for (let i = 0; i < trows.length - 2; i++) {
            let tds = trows[i].querySelectorAll('td');
            for (let j = tds.length - 1; j >= this.columnNum; j--) {
                tds[j]?.remove();
            }
        }

        // Add cells with new data
        for (let i = 0; i < trows.length - 2; i++) {
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${Color.performance(data[i]?.performance ?? 0)}</p></td>`);

            let diff;
            diff = data[i].isRated ? Color.diff(data[i].newRating - data[i].oldRating) : '-';
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${diff}</p></td>`);

            let colorChange = '-';
            if (data[i].isRated) {
                colorChange = Color.colorChange(data[i].oldRating, data[i].newRating);
            }
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${colorChange}</p></td>`);
        }
    }

    addHeaderAndFooter() {
        this.addHeaderCells();
        this.addFooterCells();
    }
    /**
     * Add columns for performance, diff, color change
     */
    addHeaderCells() {
        const tr = this._table.querySelector('thead').querySelector('tr');
        const performanceTh = document.createElement('th');
        performanceTh.innerText = '⚡';
        performanceTh.setAttribute('title', 'Performance');
        const diffTh = document.createElement('th');
        diffTh.innerText = '🔺';
        diffTh.setAttribute('title', 'Diff')
        const lvlChangeTh = document.createElement('th');
        lvlChangeTh.innerText = '🌈';
        lvlChangeTh.setAttribute('title', 'Color change');
        tr.appendChild(performanceTh);
        tr.appendChild(diffTh);
        tr.appendChild(lvlChangeTh);
    }

    addFooterCells() {
        const trows = this._table.querySelector('tbody').querySelectorAll('tr');
        for (let i = trows.length - 2; i < trows.length; i++) {
            for (let _ = 0; _ < 3; _++) {
                trows[i].insertAdjacentHTML('beforeend', '<td class="standings-result"><p>-</p></td>');
            }
        }
    }

    /**
     * The displaying rank array is the first column of the standings table.
     */
    getDisplayingUserList() {
        const tbody = this._table.querySelector('#standings-tbody');
        const trs = tbody.querySelectorAll('tr');
        const userRows = Array.from(trs);
        return userRows.slice(0, -2).map((trow) => {
            const nameWithAffiliation = trow.querySelectorAll('td')[1].innerText.trim();
            return nameWithAffiliation.split('\n')[0].trim();
        });
    }
}
