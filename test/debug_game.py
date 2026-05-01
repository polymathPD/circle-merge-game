"""
게임 자동 디버그 스크립트
사용법: python test/debug_game.py [--headless] [--screenshot] [--interact]

--headless   : 브라우저 창 없이 실행 (기본: 창 표시)
--screenshot : 스크린샷 저장 (test/screenshots/)
--interact   : 자동 게임 인터랙션 (원 드롭 시뮬레이션)
"""
import sys
import time
import os
import argparse
import threading
import http.server
import socketserver

# Windows 터미널 UTF-8 출력
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.join(os.path.dirname(__file__), '..')
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), 'screenshots')
PORT = 3001


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, *args):
        pass


def start_server():
    with socketserver.TCPServer(('', PORT), SilentHandler) as httpd:
        httpd.serve_forever()


def run(headless=True, take_screenshot=False, interact=False, duration=0):
    from playwright.sync_api import sync_playwright

    os.makedirs(SCREENSHOT_DIR, exist_ok=True)

    t = threading.Thread(target=start_server, daemon=True)
    t.start()
    time.sleep(0.5)
    print(f"[OK] 서버 시작 (포트 {PORT})")

    # iPhone 13 mini: 375x812, 3x DPI, 터치 지원
    IPHONE_MINI = {
        "viewport": {"width": 375, "height": 812},
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True,
        "user_agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        ),
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(**IPHONE_MINI)
        page = context.new_page()

        logs = []

        def on_console(msg):
            entry = f"[{msg.type}] {msg.text}"
            logs.append(entry)
            print(entry)

        page.on("console", on_console)

        def on_error(err):
            print(f"[PAGE ERROR] {err}")

        page.on("pageerror", on_error)

        def on_response(response):
            if response.status >= 400:
                print(f"[HTTP {response.status}] {response.url}")

        page.on("response", on_response)

        url = f"http://localhost:{PORT}?local=true"
        print(f"[INFO] 게임 열기: {url}")
        page.goto(url)

        try:
            page.wait_for_selector("#game-canvas", timeout=10000)
            print("[OK] 게임 캔버스 로드됨")
        except Exception:
            print("[FAIL] 게임 캔버스 로드 실패")
            if take_screenshot:
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, "load_fail.png"))
            browser.close()
            return

        time.sleep(2)

        if take_screenshot:
            path = os.path.join(SCREENSHOT_DIR, "initial.png")
            page.screenshot(path=path)
            print(f"[SCREENSHOT] {path}")

        if interact:
            print("[INFO] 게임 인터랙션 시뮬레이션 시작...")
            canvas = page.locator("#game-canvas")
            box = canvas.bounding_box()
            if box:
                cx = box["x"] + box["width"] / 2
                cy = box["y"] + box["height"] * 0.3

                for i in range(5):
                    x_offset = (i - 2) * 50
                    page.mouse.click(cx + x_offset, cy)
                    print(f"  클릭 {i+1}: ({cx + x_offset:.0f}, {cy:.0f})")
                    time.sleep(1.2)

                time.sleep(2)

                if take_screenshot:
                    path = os.path.join(SCREENSHOT_DIR, "after_drops.png")
                    page.screenshot(path=path)
                    print(f"[SCREENSHOT] {path}")

        if not headless:
            if duration:
                print(f"[INFO] {duration}초 후 자동 종료...")
                time.sleep(duration)
            else:
                print("브라우저가 열려있습니다. Ctrl+C 로 종료하세요.")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    pass

        browser.close()

    print("\n=== 콘솔 로그 요약 ===")
    errors = [l for l in logs if "[error]" in l.lower()]
    if errors:
        print(f"에러 {len(errors)}개:")
        for e in errors:
            print(f"  {e}")
    else:
        print("에러 없음")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--headless', action='store_true', help='헤드리스 모드')
    parser.add_argument('--screenshot', action='store_true', help='스크린샷 저장')
    parser.add_argument('--interact', action='store_true', help='자동 인터랙션')
    parser.add_argument('--duration', type=int, default=0, help='브라우저 열어두는 시간(초), 0=수동종료')
    args = parser.parse_args()

    run(headless=args.headless, take_screenshot=args.screenshot, interact=args.interact, duration=args.duration)
