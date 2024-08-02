class StandingTable {
    constructor() {
        this.perfRatingData = new Map();
        this._table = document.querySelector('table');
        this.observer = new MutationObserver(() => this.fillDataToColumns());
        this.listenStandingsChange();
    }

    /**
     * Add data to the columns of performnace, diff, color change
     */
    fillDataToColumns() {
        this.observer.disconnect();

        const displayingUsers = this.getDisplayingUserList();
        const data = displayingUsers.map((userScreenName) => {
            return this.perfRatingData.get(userScreenName);
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

            let colorChangeSpan = '-';
            if (data[i]?.isRated)
                colorChangeSpan = (data[i].oldRating === data[i].newRating) ? Color.rating(data[i].newRating) : Color.colorChange(data[i].oldRating, data[i].newRating);
            trows[i].insertAdjacentHTML('beforeend', `<td class="standings-result ext-added"><p>${colorChangeSpan}</p></td>`);
        }

        // Add header & footer cells
        this.addHeaderAndFooter();

        this.observer.observe(this._table, { childList: true, subtree: true });
    }

    /**
     * Add columns for performance, diff, color change
     */
    addHeaderAndFooter() {
        // Header
        const tr = this._table.querySelector('thead').querySelector('tr');
        tr.appendChild(Object.assign(document.createElement('th'), {
            innerText: '⚡',
            title: 'Performance',
            className: 'ext-added',
        }));
        tr.appendChild(Object.assign(document.createElement('th'), {
            innerText: '🔺',
            title: 'Diff',
            className: 'ext-added',
        }));
        tr.appendChild(Object.assign(document.createElement('th'), {
            innerText: '🌈',
            title: 'Color change',
            className: 'ext-added',
        }));

        // Footer
        const trows = this._table.querySelector('tbody').querySelectorAll('tr');
        for (let i = trows.length - 2; i < trows.length; i++) {
            for (let _ = 0; _ < 3; _++) {
                trows[i].insertAdjacentHTML('beforeend', '<td class="standings-result ext-added"><p>-</p></td>');
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

    /**
     * Listen the standings data changes when users click the refresh button
     */
    listenStandingsChange() {
        // Intercept XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        const standingTable = this;
        XMLHttpRequest.prototype.open = function (...args) {
            const xhr = this;
            xhr.addEventListener('load', () => {
                if (this.responseURL.endsWith(`contests/${contestName()}/standings/json`) && this.status === 200) {
                    standingTable.standings = JSON.parse(this.responseText);
                    standingTable.calPerfAndRating();
                    standingTable.fillDataToColumns();
                }
            });
            return originalXhrOpen.apply(this, args);
        };
    }
}
