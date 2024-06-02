class PredictedStandingTable extends StandingTable {
    constructor(performanceArr, standings) {
        super();
        this.result = this.loadData(performanceArr, standings);
        this.fillDataToColumns();
        this.observeFirstColumnChanged();
    }

    loadData(performanceArr, standings) {
        let predictedResult = new Map(); // map of {username: DataObject{}}
        let ratedRanking = 0;
        for (let i = 0; i < standings["StandingsData"].length; i++) {
            const isRated = standings["StandingsData"][i].IsRated;
            const competitionNum = standings["StandingsData"][i].Competitions;
            const oldRating = standings["StandingsData"][i].OldRating;
            const performance = this.positivize_performance(performanceArr[ratedRanking] ?? 0); // prevents out of bound error when new users joined after the last generated time
            const newRating = isRated ? this.predictNewRating(oldRating, performance, competitionNum) : oldRating;
            const userScreenName = standings["StandingsData"][i].UserScreenName;
            predictedResult.set(userScreenName, {
                performance: performance,
                userScreenName: userScreenName,
                oldRating: oldRating,
                newRating: newRating,
                isRated: isRated,
                competitionNum: competitionNum
            });
            if (isRated)
                ratedRanking++;
        }
        return predictedResult;
    }

    // Reference: https://github.com/koba-e964/atcoder-rating-estimator
    predictNewRating(oldRating, performance, competitionNum) {
        const bigf = (n) => {
            let num = 1.0;
            let den = 1.0;
            for (let i = 0; i < n; ++i) {
                num *= 0.81;
                den *= 0.9;
            }
            num = (1 - num) * 0.81 / 0.19;
            den = (1 - den) * 0.9 / 0.1;
            return Math.sqrt(num) / den;
        }
        const f = (n) => {
            var finf = bigf(400);
            return (bigf(n) - finf) / (bigf(1) - finf) * 1200.0;
        }
        // (-inf, inf) -> (0, inf)
        const positivize_rating = (r) => {
            return (r < 400.0) ? 400.0 * Math.exp((r - 400.0) / 400.0) : r;
        }
        
        if (competitionNum === 0)
            return 0;

        oldRating += f(competitionNum);
        var wei = 9 - 9 * 0.9 ** competitionNum;
        var num = wei * (2 ** (oldRating / 800.0)) + 2 ** (performance / 800.0);
        var den = 1 + wei;
        var rating = Math.log2(num / den) * 800.0;
        rating -= f(competitionNum + 1);
        return Math.ceil(positivize_rating(rating));
    }
}
