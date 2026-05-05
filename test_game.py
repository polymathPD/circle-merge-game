import sys
sys.stdout.reconfigure(encoding='utf-8')
from playwright.sync_api import sync_playwright

VIEWPORT = {"width": 375, "height": 667}  # iPhone SE
URL = "http://localhost:8000/?local"

def get_game_state(page):
    return page.evaluate("window.__gameState")

def drop_ball(page, x, wait_ms=900):
    page.mouse.move(x, 300)
    page.wait_for_timeout(100)
    page.mouse.down()
    page.wait_for_timeout(80)
    page.mouse.up()
    page.wait_for_timeout(wait_ms)

COMBO_WINDOW_MS = 6000  # CONFIG.COMBO.WINDOW와 동일

def assert_combo_merge_consistency(state, label=""):
    """
    1) combo=N이면 같은 comboDropId의 선행 합체가 N-1개 있어야 한다.
    2) combo>=2인데 comboDropId가 다른 드롭의 합체를 선행으로 삼으면 크로스드롭 버그.
    """
    merge_log = state["mergeLog"]
    bugs = 0

    combo_events = [m for m in merge_log if m["comboCount"] >= 2]
    for evt in combo_events:
        same_drop_prior = [
            m for m in merge_log
            if m["timestamp"] < evt["timestamp"]
            and m.get("comboDropId") == evt.get("comboDropId")
            and evt["timestamp"] - m["timestamp"] <= COMBO_WINDOW_MS
        ]
        needed = evt["comboCount"] - 1
        if len(same_drop_prior) < needed:
            print(f"[{label}] ❌ 크로스드롭 콤보 버그: combo={evt['comboCount']}x "
                  f"dropId={evt.get('comboDropId')} 동일 드롭 선행합체={len(same_drop_prior)}개 (필요 {needed}개) "
                  f"toIndex={evt['toIndex']} score+{evt['scoreAdded']}")
            bugs += 1
        else:
            print(f"[{label}] ✅ 콤보 {evt['comboCount']}x (dropId={evt.get('comboDropId')}, "
                  f"동일드롭 선행합체 {len(same_drop_prior)}개 / 필요 {needed}개)")

    if not combo_events:
        print(f"[{label}] — 콤보 없음")
    return bugs

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=100)
        ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=3, is_mobile=True, has_touch=True)
        page = ctx.new_page()
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.goto(URL)
        page.wait_for_timeout(2500)

        # --- 버전 배지 확인 ---
        badge = page.locator("#version-badge")
        if badge.count() > 0:
            print(f"[버전] ✅ 배지 표시: {badge.inner_text()}")
        else:
            print("[버전] ❌ 배지 없음")

        page.screenshot(path="screenshots/r3_01_version.png")

        # --- __gameState 초기 확인 ---
        state = get_game_state(page)
        if state:
            print(f"[State] ✅ window.__gameState 초기화 확인: score={state['score']}, mergeLog={len(state['mergeLog'])}개")
        else:
            print("[State] ❌ window.__gameState 없음 — game.js 수정 확인 필요")

        # --- 10라운드 반복: 빠른 드롭으로 합체/콤보 유도 ---
        ROUNDS = 10
        total_bugs = 0
        for r in range(1, ROUNDS + 1):
            page.evaluate("window.__gameState.mergeLog = []; window.__gameState.dropLog = [];")

            print(f"\n[라운드 {r}] 빠른 연속 드롭 (25회, 300ms 간격)")
            for i in range(25):
                x = 187 + (10 if i % 3 == 0 else -10 if i % 3 == 1 else 0)
                drop_ball(page, x=x, wait_ms=300)

            page.wait_for_timeout(2000)
            state = get_game_state(page)

            print(f"  score={state['score']}  mergeLog={len(state['mergeLog'])}개  dropLog={len(state['dropLog'])}개")
            for i, m in enumerate(state["mergeLog"]):
                print(f"  merge[{i}]: {m['fromIndex']}→{m['toIndex']} "
                      f"combo={m['comboCount']} dropId={m.get('comboDropId')} score+{m['scoreAdded']}")

            bugs = assert_combo_merge_consistency(state, label=f"라운드{r}")
            total_bugs += bugs
            page.screenshot(path=f"screenshots/r3_round{r}.png")

        print(f"\n{'='*50}")
        print(f"총 버그: {total_bugs}건 / {ROUNDS}라운드")

        # --- 콘솔 에러 확인 ---
        if console_errors:
            print(f"\n[에러] ❌ {console_errors}")
        else:
            print("\n[에러] ✅ 콘솔 에러 없음")

        print("\n=== 테스트 완료. 4초 후 닫힘 ===")
        page.wait_for_timeout(4000)
        browser.close()

if __name__ == "__main__":
    import os; os.makedirs("screenshots", exist_ok=True)
    test()
