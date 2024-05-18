class StandingTable {
    constructor(finalResult) {
        this._table = document.querySelector('table');
        this.finalResult = finalResult;
        this.columnNum = this._table.querySelector('thead').querySelectorAll('th').length;

        // Initially add 3 columns to table
        this.addHeaderCells();
        this.fillDataToColumns();

        this.observeFirstColumnChanged();
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
        const displayingRankOrders = this.getDisplayingRanks();
        console.log(displayingRankOrders);
        const data = displayingRankOrders.map((rank) => {
            return this.finalResult[rank - 1];
        });
        console.log(data);
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
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${Color.performance(data[i].Performance)}</p></td>`);

            let diff = data[i].IsRated ? Color.diff(data[i].NewRating - data[i].OldRating): '-';
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${diff}</p></td>`);
            
            let colorChange = '-';
            if (data[i].IsRated) {
                colorChange = Color.colorChange(data[i].OldRating, data[i].NewRating);
            }
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result"><p>${colorChange}</p></td>`);
        }

        // Footer
        for (let i = trows.length - 2; i < trows.length; i++) {
            if (trows[i].querySelectorAll('td').length === this.columnNum - 2) {
                for (let _ = 0; _ < 3; _++) {
                    trows[i].insertAdjacentHTML('beforeend', '<td class="standings-result"><p>-</p></td>');
                }
            }

        }
    }

    /**
     * Add columns for performance, diff, color change
     */
    addHeaderCells() {
        // Add header
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

    /**
     * The displayed ranks array is the first column of the standings table.
     */
    getDisplayingRanks() {
        const tbody = this._table.querySelector('#standings-tbody');
        const trs = tbody.querySelectorAll('tr');
        return [...trs].map((trow) => {
            const text = trow.querySelector('td').innerText;
            const regex = /\((\d+)\)/;
            const match = regex.exec(text);
            return (match ? match[1] : text);
        }).filter((item) => {
            return !isNaN(parseInt(item));
        });
    }
}
