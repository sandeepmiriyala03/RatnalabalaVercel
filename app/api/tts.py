"""
api/tts.py — generates poem audio ON THE FLY, live, when someone clicks
the Listen button. No pre-generated files, no /public/audio folders to
fill, no 1140-file batch job — this replaces that entire approach with a
simple "generate right now, given this text" call.

Supports both engines you were comparing:
  ?source=edge   -> Microsoft Edge neural voice (male: te-IN-MohanNeural,
                     female: te-IN-ShrutiNeural)
  ?source=google -> Google Translate's TTS engine (via gTTS) — one voice
                     only, but often sounds more natural for Telugu

DEPLOY REQUIREMENTS:
  - This file lives at the project ROOT under /api/tts.py (a sibling of
    /app, /public — NOT inside app/api/, which is reserved for your
    Next.js route handlers). Vercel auto-detects .py files in a
    top-level /api folder as separate Python serverless functions,
    alongside your existing Next.js app.
  - A requirements.txt at the project root (see the one provided
    alongside this file) so Vercel installs edge-tts + gTTS for this
    function.

CALLED FROM THE FRONTEND LIKE:
  fetch(`/api/tts?text=${encodeURIComponent(text)}&source=edge&voice=male`)
  -> returns raw MP3 audio bytes directly as the response body.
"""

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import asyncio
import io

import edge_tts
from gtts import gTTS

MAX_TEXT_LENGTH = 2000  # sanity cap — a poem is short; this blocks abuse via giant payloads


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
    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        text = query.get("text", [""])[0].strip()
        source = query.get("source", ["edge"])[0]
        voice_choice = query.get("voice", ["male"])[0]

        if not text:
            self._error(400, "Missing 'text' parameter.")
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
        self.end_headers()
        self.wfile.write(message.encode("utf-8"))