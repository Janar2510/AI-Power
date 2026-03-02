"""AI controller - /ai/chat (jsonrpc) and /ai/tools (http)."""

# from core.http.controller import route
# from werkzeug.wrappers import Response
#
#
# class AIController:
#     @route("/ai/chat", type="jsonrpc", auth="user")
#     def chat(self, request):
#         """Handle AI chat - all tool calls execute as requesting user."""
#         pass
#
#     @route("/ai/tools", auth="user", methods=["GET"])
#     def tools(self, request):
#         """List available AI tools."""
#         return Response("[]", mimetype="application/json")
