from fetch import fetch
from bs4 import BeautifulSoup
from typing import List, Literal
from datetime import datetime, timedelta, timezone
from fetch import fetch
from constants import RESULT_URL, STANDING_URL


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
            return 10000
        # AHC
        return 10000

    def hasFixedResult(self) -> bool:
        res = fetch(RESULT_URL.format(self.short_name), "json")
        return len(res) != 0

    def is_short_contest(self) -> bool:
        return self.duration < 1 * 24 * 60 * 60

    def is_started(self) -> bool:
        return self.start_time < datetime.now().astimezone(timezone.utc)


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
    def new_contests(self) -> List[Contest]:
        # Create jobs for active contests only to reduce the complexity of job scheduling.
        active_contests = self._active_contests()
        new_cnts = []
        for active_contest in active_contests:
            if active_contest.short_name not in self._contest_names:
                new_cnts.append(active_contest)
                self._contest_names.append(active_contest.short_name)
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
