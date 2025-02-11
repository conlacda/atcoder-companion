import schedule
import time
from typing import List
from contest import ContestManager, Contest
from datetime import timedelta
from util import commit_to_github

def create_jobs_from_contests_list():
    contest_manager = ContestManager()
    active_contests: List[Contest] = contest_manager.new_contests()
    print(f"There are {len(active_contests)} new active contests")
    for contest in active_contests:
        contest.dump_contest_type()
        # Update the participants's performance after the contest has finished
        schedule.every(3).hours.do(update_users_perf_based_on_final_result, contest=contest)
        generate_performance_files(contest) # run intermediately

        if contest.type == "heuristic":
            # Update aperf every 5 minutes
            interval_in_minutes = 2 if contest.is_short_contest() else 10
            schedule.every(interval_in_minutes).minutes.until(
                timedelta(seconds=contest.duration) # contest.start_time + timedelta(seconds=contest.duration)
            ).do(generate_performance_files, contest=contest)

        elif contest.type == "algo":
            # Update aperf every 5 minutes until the contest ends from now.
            schedule.every(5).minutes.until(
                timedelta(seconds=contest.duration) # contest.start_time + timedelta(seconds=contest.duration)
            ).do(generate_performance_files, contest=contest)

    upcoming_contests: List[Contest] = contest_manager.upcoming_contests(timedelta_hours=2)
    # Get the performance history of participants 1 hour before the contest starts
    print(f"{len(upcoming_contests)} upcoming contest(s) - {list(map(lambda ct: ct.short_name, upcoming_contests))}")
    for contest in upcoming_contests:
        if not contest.is_rated:
            continue

        schedule.every(3).minutes.until(timedelta(minutes=100)).do(
            generate_performance_files, contest=contest, commit=False
        )

    print(f"Current jobs list: {schedule.get_jobs()}")


def generate_performance_files(contest: Contest, commit: bool = True) -> None:
    print(f"Generating data/{contest.short_name}_avg_perf.json file")
    aperfs = contest.get_average_inner_performance_of_all_participants()
    if len(aperfs) == 0:
        return

    contest.calculate_performance_in_contest(aperfs)
    contest.dump_rounded_performance_history_of_all()
    if commit:
        commit_to_github(f"Calculate the prediction data for {contest.short_name}")


def update_users_perf_based_on_final_result(
    contest: Contest,
) -> None | schedule.CancelJob:
    """
    """
    if contest.update_competition_history_if_fixed_result_available():
        commit_to_github(f"Update perfs after contest {contest.short_name}")
        return schedule.CancelJob


if __name__ == "__main__":
    schedule.every(2).minutes.do(create_jobs_from_contests_list)
    while True:
        schedule.run_pending()
        time.sleep(1)
