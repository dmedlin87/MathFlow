import time
from playwright.sync_api import Page, expect, sync_playwright

def verify_mc_loading(page: Page):
    try:
        page.goto("http://localhost:5173", timeout=10000)
    except Exception:
        print("Initial navigation failed, retrying...")
        time.sleep(2)
        page.goto("http://localhost:5173")

    expect(page.get_by_text("MathFlow")).to_be_visible()

    # Enable Dev Mode
    page.get_by_role("button", name="DEV MODE").click()

    max_retries = 20
    found_mc = False

    for i in range(max_retries):
        # Handle Session Complete
        if page.get_by_text("Session Complete!").is_visible():
            print("Session Complete detected, restarting...")
            page.get_by_role("button", name="Start New Session").click()
            time.sleep(1)

        # Wait for problem to be active (Check Answer button visible)
        try:
            expect(page.get_by_role("button", name="Check Answer")).to_be_visible(timeout=3000)
        except:
             if page.get_by_text("Session Complete!").is_visible():
                 continue
             if page.get_by_role("button", name="Try Again").is_visible():
                 pass
             else:
                 # Maybe Next Problem is visible?
                 if page.get_by_role("button", name="Next Problem").is_visible():
                      page.get_by_role("button", name="Next Problem").click()
                      continue

        # Check for MC by class 'text-left' on buttons
        choices = page.locator("button.text-left")

        if choices.count() >= 2:
            print(f"Found MC question on attempt {i+1}")
            found_mc = True
            break

        print(f"Not MC (attempt {i+1}), auto-solving...")

        # If we are already in feedback state
        if page.get_by_role("button", name="Next Problem").is_visible():
             page.get_by_role("button", name="Next Problem").click()
             continue

        # Use Auto Solve
        auto_solve_btn = page.get_by_role("button", name="Auto Solve")
        if auto_solve_btn.is_visible():
            auto_solve_btn.click()

            # Wait for Next Problem button
            try:
                page.get_by_role("button", name="Next Problem").wait_for(state="visible", timeout=3000)
                page.get_by_role("button", name="Next Problem").click()
                time.sleep(0.5)
            except:
                pass
        else:
            print("Auto solve not visible?")
            break

    if not found_mc:
        print("Could not find a multiple choice question.")
        page.screenshot(path="verification/failed_to_find_mc.png")
        return

    # MC found
    print("Selecting option...")
    choices.first.click()

    submit_btn = page.get_by_role("button", name="Check Answer")
    expect(submit_btn).to_be_enabled()

    print("Clicking submit...")
    submit_btn.click()

    try:
        expect(page.locator("text=Checking...")).to_be_visible(timeout=2000)
        page.screenshot(path="verification/verification.png")
        print("Captured loading state!")
    except Exception as e:
        print(f"Missed loading state: {e}")
        page.screenshot(path="verification/verification_missed.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_mc_loading(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
