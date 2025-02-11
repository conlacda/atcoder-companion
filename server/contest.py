from functools import cache
import math
import os
from tqdm import tqdm
from fetch import fetch
from bs4 import BeautifulSoup
from typing import List, Literal
from datetime import datetime, timedelta, timezone
from fetch import fetch
from constants import (
    ALL_PARTICIPANTS_ROUNDED_PERF_HISTORY,
    HEURISTIC_CONTEST_LIST,
    PERF_BY_RANKING,
    RESULT_URL,
    STANDING_URL,
)
from util import commit_to_github
from constants import CONTEST_TYPE_DUMP
import json


class Contest:
    type: Literal["algo", "heuristic"]
    start_time: datetime
    long_name: str
    duration: int  # seconds
    link: str

    def __init__(
        self, start_time: str, name: str, link: str, duration_str: str, rate_range: str
    ):
        name = name.replace("\n", " ").replace("\r", "").strip()
        self.type = "algo" if name[0] == "Ⓐ" else "heuristic"
        self.long_name = name[2:]
        self.link = link

        self.start_time = datetime.strptime(
            start_time, "%Y-%m-%d %H:%M:%S%z"
        ).astimezone(timezone.utc)

        # duration_str = "240:00" -> seconds
        [hour, minute] = duration_str.split(":")
        self.duration = int(hour) * 60 * 60 + int(minute) * 60

        self.rate_range = rate_range

    def __str__(self) -> str:
        return f"{self.type} Constest {self.long_name} start from {self.start_time} to {self.end_time} within duration {self.duration} seconds hosted at: {self.link}"

    @property
    def end_time(self) -> datetime:
        return self.start_time + timedelta(seconds=self.duration)

    @property
    def short_name(self) -> str:
        return self.link.replace("contests", "").replace("/", "")

    def __eq__(self, other):
        return self.short_name == other.short_name

    def get_standings(self):
        return fetch(STANDING_URL.format(self.short_name), "json")

    def get_participants(self, only_rated: bool = False) -> List[str]:
        data = self.get_standings()
        # In a heuristic contest, IsRated is always true, but a user who has not committed is considered as unrated user.
        if self.type == "heuristic":
            for user in data.get("StandingsData"):
                if user["IsRated"] and user["TotalResult"]["Count"] == 0:
                    user["IsRated"] = False

        if only_rated:
            return sorted(
                [
                    user.get("UserScreenName")
                    for user in data.get("StandingsData")
                    if user.get("IsRated")
                ]
            )
        return sorted(
            [user.get("UserScreenName") for user in data.get("StandingsData")]
        )

    @property
    def is_rated(self) -> bool:
        return self.rate_range in [
            "- 1999",
            "1200 - 2399",
            "1600 - 2799",
            "2000 -",
            "All",
        ]

    @property
    def new_comer_aperf(self) -> int:
        # ABC
        if self.rate_range == "- 1999":
            return 800
        # ARC
        if self.rate_range == "1200 - 2399" or self.rate_range == "1600 - 2799":
            return 1000
        # AGC
        if self.rate_range == "2000 -":
            return 1200
        # The default performance for new comers of AHC is 1000
        return 1000

    @property
    def max_perf(self) -> int:
        # ABC
        if self.rate_range == "- 1999":
            return 2400
        # ARC Div 2
        if self.rate_range == "1200 - 2399":
            return 2800
        if self.rate_range == "1600 - 2799":
            return 3200
        # AGC
        if self.rate_range == "2000 -":
            return 4500
        # AHC
        return 4500

    def update_competition_history_if_fixed_result_available(self) -> bool:
        from user import User

        res = fetch(RESULT_URL.format(self.short_name), "json")
        if len(res) == 0:
            return False

        print(f"Updating competition history of {self.short_name}")
        for item in tqdm(res):
            user = User(item.get("UserScreenName"))
            user.removeIfHistoryObsolete(item["Competitions"] - 1, self.type)
            competion_history = user.competition_history(self.type)

            if item.get("IsRated"):
                rounded_performance = item.get("Performance")
                if rounded_performance == self.max_perf:
                    user.competition_history(self.type, refresh=True)
                else:
                    inner_performance = rounded_performance
                    contestShortName = item["ContestScreenName"].split(".")[0]
                    existed = contestShortName in competion_history.get(
                        "ContestShortName", []
                    )
                    if existed:
                        continue

                    competion_history["InnerPerformance"].append(inner_performance)
                    competion_history["RoundedPerformance"].append(rounded_performance)
                    endTime = datetime.fromisoformat(item.get("EndTime")).astimezone(
                        timezone.utc
                    )
                    competion_history["ContestEndTime"].append(endTime)
                    competion_history["Weight"].append(self.weight)
                    competion_history["ContestShortName"].append(contestShortName)
                    user.save_performance_history(competion_history, self.type)
        return True

    def is_short_contest(self) -> bool:
        return self.duration < 1 * 24 * 60 * 60

    @property
    def weight(self) -> float:
        if (
            self.type == "heuristic"
            and self.start_time > datetime(2025, 1, 1).astimezone(timezone.utc)
            and self.is_short_contest()
        ):
            return 0.5
        return 1

    def is_started(self) -> bool:
        return self.start_time < datetime.now().astimezone(timezone.utc)

    def dump_contest_type(self):
        with open(CONTEST_TYPE_DUMP.format(self.short_name), "w") as f:
            json.dump({"type": self.type}, f, indent=4)

        commit_to_github(f"Create {CONTEST_TYPE_DUMP.format(self.short_name)}")

    def get_average_inner_performance_of_all_participants(self):
        from user import User

        standings = self.get_standings()
        # In case, fetch the contest standings failed
        if standings is None:
            return []

        participants: List[str] = self.get_participants(only_rated=True)
        print(f"{len(participants)} rated users joined {self.short_name}")
        return [
            User(username).average_inner_performance(self)
            for username in tqdm(participants)
        ]

    def calculate_performance_in_contest(
        self, average_innerperformance: List[float], save_to_file: bool = True
    ):
        print(f"Calculating the performance in contest - {self.short_name}")
        perf_in_contest: List[int] = []
        n = len(average_innerperformance)

        @cache
        def perf2Rank(perf):
            ans = 0
            for aperf in average_innerperformance:
                ans += 1 / (1 + pow(6.0, (perf - aperf) / 400.0))
            ans += 0.5
            return ans

        # Rank of the top users will be rounded down to contest.max_perf
        # So they have the same performance of contest.max_perf
        top_rank = math.floor(perf2Rank(self.max_perf))
        for _ in range(1, top_rank + 1):
            perf_in_contest.append(self.max_perf)

        # Calculate rating for the rest
        cur_perf = self.max_perf
        for rank in tqdm(range(top_rank + 1, n + 1)):
            while perf2Rank(cur_perf) < rank:
                cur_perf -= 1

            diff1 = abs(perf2Rank(cur_perf) - rank)
            diff2 = abs(perf2Rank(cur_perf + 1) - rank)
            nearer_perf = cur_perf if (diff1 < diff2) else cur_perf + 1
            perf_in_contest.append(nearer_perf)

        if save_to_file:
            with open(PERF_BY_RANKING[self.type].format(self.short_name), "w") as f:
                json.dump(perf_in_contest, f)

        return perf_in_contest

    def dump_rounded_performance_history_of_all(self) -> None:
        print(
            f"Creating {ALL_PARTICIPANTS_ROUNDED_PERF_HISTORY.format(self.short_name)} file"
        )
        if self.type == "algo":
            self.dump_all_algo()
        else:
            self.dump_all_heuristic()

    def dump_all_algo(self):
        from user import User

        participants: List[str] = self.get_participants(only_rated=True)
        data: dict[str, List[int]] = {}
        print(f"Generating competition history of all participants {self.short_name}")
        for participant in tqdm(participants):
            perfs = User(participant).competition_history(self.type)
            data[participant] = perfs.get("RoundedPerformance")

        with open(
            ALL_PARTICIPANTS_ROUNDED_PERF_HISTORY.format(self.short_name), "w"
        ) as f:
            json.dump(data, f)

    def dump_all_heuristic(self):
        from user import User

        participants: List[str] = self.get_participants(only_rated=True)
        data: dict[str, List[int]] = {}
        print(f"Generating competition history of all participants {self.short_name}")
        for participant in tqdm(participants):
            perfs = User(participant).competition_history(self.type)
            data[participant] = [
                perfs.get("RoundedPerformance"),
                perfs.get("ContestShortName"),
            ]

        with open(
            ALL_PARTICIPANTS_ROUNDED_PERF_HISTORY.format(self.short_name), "w"
        ) as f:
            json.dump(data, f)


class ContestManager:
    _contest_names: List[str] = []
    _resolved_upcoming_contest_names: List[str] = []

    def __init__(self):
        pass

    def upcoming_contests(self, timedelta_hours=1) -> List[Contest]:
        """
        Retrieve upcoming contests that are within a specified time delta from now.
        """
        contests: List[Contest] = []
        for contest in self._upcoming_contests():
            timediff = contest.start_time - datetime.now().astimezone(timezone.utc)
            if (timediff <= timedelta(hours=timedelta_hours)) and (
                contest.short_name not in self._resolved_upcoming_contest_names
            ):
                contests.append(contest)
                self._resolved_upcoming_contest_names.append(contest.short_name)
        return contests

    # get new contests after the previous session
    def new_contests(self, is_rated: bool = True) -> List[Contest]:
        # Create jobs for active contests only to reduce the complexity of job scheduling.
        active_contests = self._active_contests()
        new_cnts: List[Contest] = []
        for active_contest in active_contests:
            if active_contest.short_name not in self._contest_names:
                new_cnts.append(active_contest)
                self._contest_names.append(active_contest.short_name)

        for contest in new_cnts:
            if contest.type == "heuristic":
                self.add_contest_to_list(contest)

        if is_rated:
            new_cnts = list(filter(lambda contest: contest.is_rated, new_cnts))

        return new_cnts

    def _get_contests(
        self, title: Literal["Active Contests", "Upcoming Contests"]
    ) -> List[Contest]:
        source = fetch("https://atcoder.jp/contests/", "text")
        soup = BeautifulSoup(source, features="html.parser")
        constests_h3 = soup.find("h3", string=title)

        if constests_h3 is None:
            return []

        div = constests_h3.find_next_sibling("div")
        upcoming_contest_table = div.find("table")
        rows = upcoming_contest_table.find("tbody").find_all("tr")

        contests: List[Contest] = []
        for row in rows:
            tds = row.find_all("td")
            contest = Contest(
                tds[0].get_text(),
                tds[1].get_text(),
                tds[1].find("a").get("href"),
                tds[2].get_text(),
                tds[3].get_text().strip(),
            )
            contests.append(contest)
        return contests

    def _active_contests(self) -> List[Contest]:
        return self._get_contests("Active Contests")

    def _upcoming_contests(self) -> List[Contest]:
        return self._get_contests("Upcoming Contests")

    def add_contest_to_list(self, contest: Contest) -> None:
        contests = []
        if os.path.exists(HEURISTIC_CONTEST_LIST):
            with open(HEURISTIC_CONTEST_LIST, "r") as f:
                contests = json.load(f)

        contest_json = {
            "type": contest.type,
            "start_time": contest.start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "short_name": contest.short_name,
            "duration": contest.duration,
            "link": contest.link,
            "is_short": contest.is_short_contest(),
            "weight": contest.weight,
        }
        if contest_json not in contests:
            contests.append(contest_json)

        self.save_contest_list(contests)

    def contest_list(self) -> List:
        if not os.path.exists(HEURISTIC_CONTEST_LIST):
            self.fetch_all_heuristic_contest_list()

        with open(HEURISTIC_CONTEST_LIST, "r") as f:
            return json.load(f)

    def fetch_all_heuristic_contest_list(self):
        NUMBER_OF_PAGES = 2
        for page in range(1, NUMBER_OF_PAGES + 1):
            source = fetch(
                f"https://atcoder.jp/contests/archive?category=0&page={page}&ratedType=4",
                "text",
            )
            soup = BeautifulSoup(source, features="html.parser")
            table = soup.find("table")
            rows = table.find("tbody").find_all("tr")
            for row in rows:
                tds = row.find_all("td")
                contest = Contest(
                    tds[0].get_text(),
                    tds[1].get_text(),
                    tds[1].find("a").get("href"),
                    tds[2].get_text(),
                    tds[3].get_text().strip(),
                )
                self.add_contest_to_list(contest)

    def save_contest_list(self, contests):
        with open(HEURISTIC_CONTEST_LIST, "w") as f:
            json.dump(contests, f, indent=4)

    def find_contest(self, contest_name: str) -> dict | None:
        contests = self.contest_list()
        for contest in contests:
            if contest["short_name"] == contest_name:
                return contest
        raise Exception(f"ERROR: contest {contest_name} not found")
