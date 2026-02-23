from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3456/dashboard")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)

    # Enable dark mode
    page.evaluate("() => { document.documentElement.classList.add('dark'); }")
    page.wait_for_timeout(500)

    page.screenshot(path="/tmp/dark_fixed.png", full_page=True)
    print("Dark mode screenshot saved to /tmp/dark_fixed.png")

    browser.close()
