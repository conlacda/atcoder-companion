class StandingTable {
    constructor() {
        this.result = new Map();
        this._table = document.querySelector('table');
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
        document.querySelectorAll('.ext-added').forEach(e => e.remove());

        // Add cells with new data
        for (let i = 0; i < trows.length - 2; i++) {
            const performanceSpan = data[i]?.performance ? Color.performance(data[i].performance) : '-';
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result ext-added"><p>${performanceSpan}</p></td>`);

            const diffSpan = data[i]?.isRated ? Color.diff(data[i].newRating - data[i].oldRating) : '-';
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result ext-added"><p>${diffSpan}</p></td>`);

            const colorChangeSpan = data[i]?.isRated ? Color.colorChange(data[i].oldRating, data[i].newRating): '-';
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result ext-added"><p>${colorChangeSpan}</p></td>`);
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
        if (vueStandings?.currentStandings) {
            return vueStandings.currentStandings.map((user) => {
                return user.UserScreenName;
            });
        }

        const tbody = this._table.querySelector('#standings-tbody');
        const trs = tbody.querySelectorAll('tr');
        const userRows = Array.from(trs);
        return userRows.slice(0, -2).map((trow) => {
            const nameWithAffiliation = trow.querySelectorAll('td')[1].innerText.trim();
            return nameWithAffiliation.split('\n')[0].trim();
        });
    }
}
