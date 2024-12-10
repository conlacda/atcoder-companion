import subprocess
from os import getenv

def commit_to_github(message: str = "auto commit") -> None:
    if getenv("DEBUG") == '0':
        subprocess.run(["git", "add", "."])
        subprocess.run(["git", "commit", "-m", message])
        subprocess.run(["git", "push"])
