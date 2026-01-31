from playwright.sync_api import sync_playwright, expect
import time

def verify_chat_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # Wait for chat input (any textarea)
        print("Waiting for chat input...")
        page.wait_for_selector("textarea", timeout=30000)

        # Type a message
        print("Sending message...")
        page.fill("textarea", "Hello bot")
        page.press("textarea", "Enter")

        # Wait for the bot response (the one with "bold statement")
        print("Waiting for response...")
        # We look for the text "bold statement" which is in our new mock response
        try:
            page.wait_for_selector("text=bold statement", timeout=10000)
        except Exception as e:
            print(f"Error waiting for response: {e}")
            page.screenshot(path="/home/jules/verification/error_state.png")
            raise

        # Wait a bit for animations to settle
        time.sleep(2)

        # Take a screenshot
        screenshot_path = "/home/jules/verification/current_state.png"
        page.screenshot(path=screenshot_path, full_page=True)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    verify_chat_ui()
