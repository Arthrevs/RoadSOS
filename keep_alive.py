import requests
import time
import datetime
import os

URL = "https://roadsos-pl3k.onrender.com/health"
INTERVAL_SECONDS = 10 * 60  # 10 minutes
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keep_alive.log")


def log(message: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] {message}"
    print(entry)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry + "\n")


def ping():
    try:
        response = requests.get(URL, timeout=30)
        log(f"OK  — {response.status_code} ({response.elapsed.total_seconds():.2f}s)")
    except requests.RequestException as e:
        log(f"ERR — {e}")


def main():
    log(f"Keep-alive started. Pinging {URL} every {INTERVAL_SECONDS // 60} min.")
    while True:
        ping()
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
