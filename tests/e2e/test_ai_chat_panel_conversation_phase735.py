"""
E2E regression: AI chat panel preserves conversation_id between LLM requests.
"""

import json
import time


def _wait_for(predicate, timeout: float = 5.0, step: float = 0.1) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if predicate():
            return
        time.sleep(step)
    raise AssertionError("Timed out waiting for condition")


def test_ai_chat_panel_conversation_memory_phase735(
    page,
    e2e_base_url: str,
    e2e_login: str,
    e2e_password: str,
) -> None:
    """LLM chat should reuse returned conversation_id on subsequent requests."""
    page.set_default_timeout(30000)
    requests: list[dict] = []

    def handle_config(route) -> None:
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"llm_enabled": "1"}),
        )

    def handle_chat(route) -> None:
        body = json.loads(route.request.post_data or "{}")
        requests.append(body)
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"result": "ok", "conversation_id": 42}),
        )

    page.route("**/ai/config", handle_config)
    page.route("**/ai/chat", handle_chat)

    page.goto(f"{e2e_base_url}/web/login")
    page.wait_for_load_state("networkidle")
    page.get_by_placeholder("Login").fill(e2e_login)
    page.get_by_placeholder("Password").fill(e2e_password)
    page.get_by_role("button", name="Log in").click()
    page.get_by_text("ERP Platform").first.wait_for(state="visible", timeout=10000)

    page.get_by_role("button", name="Open AI Assistant").click()
    query = page.locator("#chat-query")
    query.wait_for(state="visible", timeout=10000)
    _wait_for(lambda: "Ask anything" in (query.get_attribute("placeholder") or ""))

    requests.clear()

    query.fill("hello")
    query.press("Enter")
    _wait_for(lambda: len(requests) >= 1)

    query.fill("again")
    query.press("Enter")
    _wait_for(lambda: len(requests) >= 2)

    assert requests[0]["conversation_id"] is None
    assert requests[1]["conversation_id"] == 42
