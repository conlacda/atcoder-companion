from typing import Literal

COMPETITION_HISTORY_URL: dict[str, str] = {
    "algo": "https://atcoder.jp/users/{}/history/json",
    "heuristic": "https://atcoder.jp/users/{}/history/json?contestType=heuristic",
}

CONTEST_TYPE = Literal["algo", "heuristic"]

PERF_BY_RANKING: dict[str, str] = {
    "algo": "data/{}_ranking_to_perf.json",
    "heuristic": "data/{}_ranking_to_perf.json"
}

ALL_PARTICIPANTS_ROUNDED_PERF_HISTORY = "data/{}_rounded_perf_history.json"

STANDING_URL = "https://atcoder.jp/contests/{}/standings/json"

RESULT_URL = "https://atcoder.jp/contests/{}/results/json"

CONTEST_TYPE_DUMP = "data/{}_contest_type.json"

HEURISTIC_CONTEST_LIST = "data/heuristic_contests.json"

COMPETITION_HISTORY = "competition-history/{contest_type}/{username}.json"
