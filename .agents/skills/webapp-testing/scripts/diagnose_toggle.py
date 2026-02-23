from playwright.sync_api import sync_playwright

console_messages = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture all console messages
    page.on("console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_messages.append(f"[pageerror] {err}"))

    page.goto("http://localhost:3456/agents")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(2000)  # extra wait for hydration

    # Screenshot
    page.screenshot(path="/tmp/topbar_debug.png", full_page=False)
    print("Screenshot saved to /tmp/topbar_debug.png")

    # Console messages
    print("\n=== CONSOLE MESSAGES ===")
    if console_messages:
        for m in console_messages:
            print(m)
    else:
        print("(none)")

    # Search for theme toggle in DOM
    print("\n=== THEME TOGGLE SEARCH ===")

    # Try aria-label
    btn = page.locator('button[aria-label="Modo oscuro"], button[aria-label="Modo claro"]')
    count = btn.count()
    print(f"Buttons with aria-label 'Modo oscuro/claro': {count}")
    if count > 0:
        print("  HTML:", btn.first.evaluate("el => el.outerHTML"))

    # Look for h-8 w-8 divs in topbar
    header = page.locator("header")
    if header.count() > 0:
        print("\nHeader HTML:")
        print(header.first.evaluate("el => el.innerHTML"))

    # All buttons in header
    header_buttons = page.locator("header button")
    print(f"\nButtons inside header: {header_buttons.count()}")
    for i in range(header_buttons.count()):
        btn_el = header_buttons.nth(i)
        label = btn_el.get_attribute("aria-label") or "(no aria-label)"
        html = btn_el.evaluate("el => el.outerHTML")
        print(f"  [{i}] aria-label={label}")
        print(f"       HTML: {html[:200]}")

    # Check for h-8 w-8 divs in header area
    placeholder_divs = page.locator("header div.h-8.w-8")
    print(f"\nPlaceholder divs (h-8 w-8) in header: {placeholder_divs.count()}")

    browser.close()
