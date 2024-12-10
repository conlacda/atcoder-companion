from typing import Literal, Union
import time
import requests
from dotenv import load_dotenv
from os import getenv, path
import re
import pickle

session = requests.Session()
load_dotenv()

def login() -> bool:
    # Try to load previous session from dumped cookie
    if path.exists('cookies/cookie'):
        with open('cookies/cookie', 'rb') as f:
            session.cookies.update(pickle.load(f))
        if logged_in():
            return True

    headers = {"User-Agent": "Mozilla/5.0"}
    # Fetch page to get csrf_token
    res = session.get("https://atcoder.jp/login", headers=headers)
    match = re.findall(r".*csrf_token\".*value=\"(.*)\"", res.text)
    if len(match) == 0:
        return False

    csrf_token = match[0]
    time.sleep(3)
    # Login using the csrf_token
    payload = {
        "username": getenv("ATCODER_USER_NAME"),
        "password": getenv("ATCODER_PASSWORD"),
        "csrf_token": csrf_token,
    }
    res = session.post("https://atcoder.jp/login", headers=headers, data=payload)
    if res.status_code != 200:
        return False
    time.sleep(3)

    # Make sure login successfully
    if logged_in():
        # Dump session to file
        with open('cookies/cookie', 'wb') as f:
            pickle.dump(session.cookies, f)
        return True


    return True

def logged_in() -> bool:
    res = session.get("https://atcoder.jp/")
    if not getenv("ATCODER_USER_NAME") in res.text:
        return False
    return True

for i in range(3):
    ok = login()
    if not ok:
        time.sleep(1)
        if i == 2:
            exit()
    else:
        break

def fetch(
    url: str,
    output_format: Literal["json", "text"] = "json",
    retry: int = 10,
    sleep_time_after_failed: int = 2, # seconds
) -> Union[dict, str]:
    time.sleep(0.6)
    retry_count: int = 0
    while retry_count < retry:
        try:
            res = session.get(url, headers={"User-Agent": "Mozilla/5.0"})
            if res.status_code == 200:
                return res.json() if output_format == "json" else res.content
            else:
                raise Exception(f"Fetch failed with status {res.status_code} - {res.reason}")
        except Exception as e:
            retry_count += 1
            time.sleep(sleep_time_after_failed * int(pow(2, retry_count)))
