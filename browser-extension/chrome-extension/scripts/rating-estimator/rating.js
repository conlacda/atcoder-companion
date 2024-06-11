/**
 * This file is not mine
 * Original source: https://github.com/koba-e964/atcoder-rating-estimator/blob/gh-pages/atcoder_rating.js
 */
function bigf(n) {
    var num = 1.0;
    var den = 1.0;
    for (var i = 0; i < n; ++i) {
        num *= 0.81;
        den *= 0.9;
    }
    num = (1 - num) * 0.81 / 0.19;
    den = (1 - den) * 0.9 / 0.1;
    return Math.sqrt(num) / den;
}

const finf = bigf(400);
function f(n) {
    return (bigf(n) - finf) / (bigf(1) - finf) * 1200.0;
}

// Returns unpositivized ratings.
// [last, older, oldest_performance]
// arr is the array of Performance (or Rounded Performance) not InnerPerformance
function calc_rating(arr) {
    var n = arr.length;
    var num = 0.0;
    var den = 0.0;
    for (var i = n - 1; i >= 0; --i) {
        num *= 0.9;
        num += 0.9 * Math.pow(2, arr[i] / 800.0);
        den *= 0.9;
        den += 0.9;
    }
    var rating = Math.log2(num / den) * 800.0;
    rating -= f(n);
    return Math.round(positivize_rating(rating));
}

// Takes and returns unpositivized ratings.
function calc_rating_from_last(last, perf, competitionNum) {
    if (competitionNum === 0)
        return 0;

    last += f(competitionNum);
    var wei = 9 - 9 * 0.9 ** competitionNum;
    var num = wei * (2 ** (last / 800.0)) + 2 ** (perf / 800.0);
    var den = 1 + wei;
    var rating = Math.log2(num / den) * 800.0;
    rating -= f(competitionNum + 1);
    return Math.round(positivize_rating(rating)); // Math.ceil??
}

// (-inf, inf) -> (0, inf)
function positivize_rating(r) {
    if (r >= 400.0) {
        return r;
    }
    return 400.0 * Math.exp((r - 400.0) / 400.0);
}

// (0, inf) -> (-inf, inf)
function unpositivize_rating(r) {
    if (r >= 400.0) {
        return r;
    }
    return 400.0 + 400.0 * Math.log(r / 400.0);
}
