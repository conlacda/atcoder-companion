import json
import schedule
import time
from typing import List
from constants import CONTEST_TYPE_DUMP
from contest import ContestManager, Contest
from datetime import timedelta
from util import commit_to_github
from performance import (
    dump_rounded_perf_history_all_participants,
    dump_contest_perfs,
    get_avg_inner_perf_all_participants,
    update_rated_participants_perf,
)


def create_jobs_from_contests_list():
    contest_manager = ContestManager()
    active_contests: List[Contest] = contest_manager.new_contests()
    for contest in active_contests:
        if not contest.is_rated:
            continue

        schedule.every(1).seconds.do(dump_contest_type, contest=contest)
        # Update the participants's performance after the contest has finished
        schedule.every(3).hours.do(
            update_users_perf_based_on_final_result, contest=contest
        )

        generate_data(contest)  # run intermediately
        interval_in_minutes = 5
        if contest.type == "heuristic" and not contest.is_short_contest():
            interval_in_minutes = 10

        schedule.every(interval_in_minutes).minutes.until(
            timedelta(seconds=contest.duration)
        ).do(generate_data, contest=contest)

    upcoming_contests = contest_manager.upcoming_contests(timedelta_hours=1)

    # Get the performance history of participants 1 hour before the contest starts
    for contest in upcoming_contests:
        if not contest.is_rated:
            continue

        schedule.every(8).minutes.until(timedelta(minutes=50)).do(
            generate_data, contest=contest, commit=False
        )


def generate_data(contest: Contest, commit: bool = True) -> None:
    """
    Generate the average array of all participants (InnerPerformance)
    Calculate the performance array based on rank in contest
    Dump the competition history of all participants into a file (Performance)
    """
    aperfs = get_avg_inner_perf_all_participants(contest)
    if len(aperfs) == 0:
        return

    dump_contest_perfs(contest, aperfs)
    dump_rounded_perf_history_all_participants(contest)
    if commit:
        commit_to_github(f"Calculate the prediction data for {contest.short_name}")


def update_users_perf_based_on_final_result(
    contest: Contest,
) -> None | schedule.CancelJob:
    """
    Update the performance history of all rated participants by appending the performance in contest
    """
    if contest.hasFixedResult():
        update_rated_participants_perf(contest)
        commit_to_github(f"Update perfs after contest {contest.short_name}")
        return schedule.CancelJob


def dump_contest_type(contest: Contest) -> None:
    """
    Dump the contest type into a file then commit to github
    Some contests have unusual names, such as "wtf19"
    So sometimes we can not determine the type of contests based on their names
    """
    with open(CONTEST_TYPE_DUMP.format(contest.short_name), "w") as f:
        json.dump({"type": contest.type}, f, indent=4)

    commit_to_github(f"Create contest type {contest.short_name}")
    return schedule.CancelJob


if __name__ == "__main__":
    schedule.every(2).minutes.do(create_jobs_from_contests_list)
    while True:
        schedule.run_pending()
        time.sleep(1)
