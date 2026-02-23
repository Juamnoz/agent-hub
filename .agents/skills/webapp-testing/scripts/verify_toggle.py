from playwright.sync_api import sync_playwright
import time

console_errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
    page.on("pageerror", lambda err: console_errors.append(f"[pageerror] {err}"))

    page.goto("http://localhost:3456/agents")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)

    page.screenshot(path="/tmp/after_fix.png", full_page=False)

    print("=== ERRORS / WARNINGS ===")
    if console_errors:
        for m in console_errors:
            print(m)
    else:
        print("✅ No errors or warnings")

    print("\n=== THEME TOGGLE ===")
    btn = page.locator('button[aria-label="Modo oscuro"], button[aria-label="Modo claro"]')
    count = btn.count()
    print(f"Toggle button found: {count}")
    if count > 0:
        label = btn.first.get_attribute("aria-label")
        visible = btn.first.is_visible()
        print(f"  aria-label: {label}")
        print(f"  visible: {visible}")

    print("\n=== CLICKING TOGGLE ===")
    if count > 0:
        btn.first.click()
        page.wait_for_timeout(500)
        page.screenshot(path="/tmp/after_dark.png", full_page=False)
        html_class = page.evaluate("() => document.documentElement.className")
        print(f"  <html> class after click: '{html_class}'")
        btn2 = page.locator('button[aria-label="Modo oscuro"], button[aria-label="Modo claro"]')
        print(f"  Toggle label after click: {btn2.first.get_attribute('aria-label')}")

    browser.close()

print("\nScreenshots: /tmp/after_fix.png, /tmp/after_dark.png")
