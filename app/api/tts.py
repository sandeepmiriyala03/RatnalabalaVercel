"""
api/tts.py — generates poem audio ON THE FLY, live, when someone clicks
the Listen button. No pre-generated files, no /public/audio folders to
fill, no batch job.

Uses POST with a JSON body (not GET with a query string) specifically
because Telugu text explodes in size once URL-encoded — each Telugu
character is 3 UTF-8 bytes, and percent-encoding turns each byte into
"%XX" (3 ASCII chars), so a single Telugu letter can become 9 characters
of URL. A full poem quickly exceeds URL-length limits enforced upstream
by Vercel's infrastructure, causing a 400 before this code even runs. A
POST body has no such limit.

Supports both engines you were comparing:
  source: "edge"   -> Microsoft Edge neural voice
                       (voice: "male" -> te-IN-MohanNeural,
                        voice: "female" -> te-IN-ShrutiNeural)
  source: "google" -> Google Translate's TTS engine (via gTTS) — one
                       voice only, "voice" is ignored for this source

DEPLOY REQUIREMENTS:
  - Lives at the project ROOT under /api/tts.py (sibling of /app,
    /public — NOT inside app/api/, which is reserved for Next.js route
    handlers).
  - requirements.txt at the project root (edge-tts, gTTS).
  - vercel.json declaring the python3.12 runtime for this file.

CALLED FROM THE FRONTEND LIKE:
  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source: 'edge', voice: 'male' }),
  })
  -> returns raw MP3 audio bytes directly as the response body.
"""

from http.server import BaseHTTPRequestHandler
import asyncio
import io
import json

import edge_tts
from gtts import gTTS

MAX_TEXT_LENGTH = 5000  # sanity cap to block abuse via giant payloads


async def generate_edge(text: str, voice_choice: str) -> bytes:
    voice = "te-IN-MohanNeural" if voice_choice == "male" else "te-IN-ShrutiNeural"
    communicate = edge_tts.Communicate(text, voice)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    return buf.getvalue()


def generate_gtts(text: str) -> bytes:
    tts = gTTS(text=text, lang="te")
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    return buf.getvalue()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            payload = json.loads(raw_body.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            self._error(400, "Invalid JSON body.")
            return

        text = str(payload.get("text", "")).strip()
        source = payload.get("source", "edge")
        voice_choice = payload.get("voice", "male")

        if not text:
            self._error(400, "Missing 'text' field in request body.")
            return

        if len(text) > MAX_TEXT_LENGTH:
            self._error(400, f"Text too long (max {MAX_TEXT_LENGTH} characters).")
            return

        try:
            if source == "google":
                audio_bytes = generate_gtts(text)
            else:
                audio_bytes = asyncio.run(generate_edge(text, voice_choice))
        except Exception as e:
            self._error(500, f"TTS generation failed: {e}")
            return

        if not audio_bytes:
            self._error(500, "TTS generation returned no audio.")
            return

        self.send_response(200)
        self.send_header("Content-Type", "audio/mpeg")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(audio_bytes)

    def _error(self, code: int, message: str):
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(message.encode("utf-8"))