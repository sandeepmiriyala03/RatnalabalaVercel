"""
api/font_agent.py

═══════════════════════════════════════════════════════════════
SIMPLE AGENTIC AI FEATURE: Autonomous Font Decision Agent
═══════════════════════════════════════════════════════════════

WHAT MAKES THIS "AGENTIC":
  A normal font picker (your FontControlsTelugu.tsx dropdown) requires
  a PERSON to decide and click. This endpoint instead makes the
  decision itself, based on context signals sent from the frontend —
  content type, screen size — and returns a font choice with a reason.
  The Next.js side doesn't ask the user anything; it just calls this
  once and applies whatever comes back. That's the core agentic idea
  in miniature: perceive context → decide → act, without a human
  picking from a menu each time.

  This version uses simple rule-based logic (no LLM call) so it's
  fast, free, and has zero external dependencies beyond what's
  already in requirements.txt. The DECISION LOGIC section below is
  intentionally isolated so it can be swapped for an LLM call later
  (e.g. "ask Claude which font best fits this content") without
  touching anything else in the file.

ENDPOINT:
  GET /api/font_agent?content_type=sloka&width=390

  content_type: "sloka" | "ui" | "heading"  (what's being displayed)
  width:        viewport width in px (optional, defaults to desktop)

RESPONSE:
  {
    "fontFamily": "Mandali-Regular",
    "fontSizeMultiplier": 0.95,
    "reason": "UI text on a narrow phone screen — chose a clean,
               high-legibility font at slightly reduced size."
  }
"""



import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ═══════════════════════════════════════════════════════════════
# DECISION LOGIC — the "agent" itself. Swap this function for an
# LLM call later without touching anything else in the file:
#
#   def decide_font(content_type, width):
#       response = model.invoke(f"Given content_type={content_type}, "
#                                f"width={width}, which Telugu font...")
#       return parse_llm_response(response)
# ═══════════════════════════════════════════════════════════════

# Fonts chosen for UI legibility at small sizes.
UI_FONTS = ["Mandali-Regular", "NTR"]

# Fonts chosen for their traditional/calligraphic character — good for
# sloka/verse display where reading is slower and deliberate.
SLOKA_FONTS = ["Annamayya", "SreeKrushnadevaraya", "Gurajada"]

# Bold, high-impact fonts for headings/titles.
HEADING_FONTS = ["Chathura-ExtraBold", "Suranna-Bold"]


def decide_font(content_type: str, width: int) -> dict:
    is_narrow = width < 600

    if content_type == "sloka":
        font = SLOKA_FONTS[0]
        size_multiplier = 0.95 if is_narrow else 1.1
        reason = (
            "Sloka/verse content — chose a traditional, calligraphic font "
            f"{'at reduced size for narrow screen' if is_narrow else 'at slightly larger size for readability'}."
        )

    elif content_type == "heading":
        font = HEADING_FONTS[0]
        size_multiplier = 1.0 if is_narrow else 1.2
        reason = "Heading/title text — chose a bold, high-impact font."

    else:  # "ui" or anything unrecognized — safest default
        font = UI_FONTS[0]
        size_multiplier = 0.9 if is_narrow else 1.0
        reason = (
            "General UI text — chose a font designed for legibility "
            f"{'at small phone sizes' if is_narrow else 'at standard desktop size'}."
        )

    return {
        "fontFamily": font,
        "fontSizeMultiplier": size_multiplier,
        "reason": reason,
    }


# ═══════════════════════════════════════════════════════════════
# HANDLER — Vercel native runtime pattern (same as api/gita.py,
# api/fonts.py — no Flask/FastAPI)
# ═══════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)

        content_type = query.get("content_type", ["ui"])[0]
        try:
            width = int(query.get("width", ["1024"])[0])
        except ValueError:
            width = 1024

        decision = decide_font(content_type, width)
        self._send_json(200, decision)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Local-only test runner ──
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8001
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/font_agent?content_type=sloka&width=390")
    print(f"Try: http://localhost:{port}/api/font_agent?content_type=ui&width=1440")
    server = HTTPServer(("localhost", port), handler)
    server.serve_forever()