from playwright.sync_api import sync_playwright
import time

def verify_session_summary():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            print("Loading app...")
            page.goto("http://localhost:5173")

            page.wait_for_selector('text=Skill:')
            print("App loaded.")

            print("Clicking DEV MODE...")
            page.get_by_role("button", name="DEV MODE").click()

            # Session limit is 5
            for i in range(5):
                print(f"Solving problem {i+1}...")

                # Click Auto Solve
                # Use force=True because sometimes overlay might interfere, though unlikely here
                page.get_by_role("button", name="Auto Solve").click()

                # Wait for feedback to appear (Correct! 🎉)
                page.wait_for_selector('text=Correct! 🎉', timeout=5000)

                # Wait for "Next Problem" button
                next_btn = page.get_by_role("button", name="Next Problem")
                next_btn.wait_for(state="visible")

                # Small stability wait
                page.wait_for_timeout(500)

                # Check if we should click "Next Problem" or "End Session"
                # On the last problem (5th), clicking Next might not happen if logic immediately shows summary?
                # Code says: handleNext checks if sessionStats.total >= 5.
                # So we DO click Next Problem even on the last one to trigger the check.

                if i < 4:
                    next_btn.click()
                    # Wait for problem to change (e.g., feedback disappears)
                    page.wait_for_selector('text=Correct! 🎉', state="hidden")
                else:
                    # Last problem. Clicking Next Problem should trigger summary.
                    print("Clicking Next Problem to finish session...")
                    next_btn.click()

            print("Waiting for modal...")
            # 4. Verify Session Summary Modal
            modal = page.locator('div[role="dialog"][aria-modal="true"]')
            modal.wait_for(state="visible", timeout=10000)
            print("Modal visible.")

            # 5. Check Focus
            page.wait_for_timeout(500) # Give focus a moment
            is_focused = page.evaluate("document.activeElement.textContent.includes('Start New Session')")
            print(f"Is Start New Session focused? {is_focused}")

            if not is_focused:
                 print(f"Active Element text: {page.evaluate('document.activeElement.textContent')}")

            # 6. Take Screenshot
            page.screenshot(path="verification/session_summary_focused.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_session_summary()
