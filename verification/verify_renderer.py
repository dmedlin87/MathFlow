
from playwright.sync_api import sync_playwright

def verify_math_renderer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto('http://localhost:5173')
            page.wait_for_selector('h1', timeout=5000)
            page.screenshot(path='verification/math_renderer.png', full_page=True)
            print('Screenshot saved to verification/math_renderer.png')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_math_renderer()
