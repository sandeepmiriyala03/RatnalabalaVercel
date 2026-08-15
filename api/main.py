"""
api/main/index.py

NOTE: moved from flat api/main.py into its own folder (api/main/) so
it can have its OWN requirements.txt (gradio_client) without applying
that dependency to every other flat function in api/ — same isolation
pattern used for api/sametalu_agent/. URL stays /api/main either way
(folder + index.py routes identically to a flat file).

Handles THREE things in one function (keeps total function count down,
same reasoning as the original fonts.py + font_agent.py merge):

  GET  /api/main?endpoint=fonts                          → font catalog
  GET  /api/main?endpoint=font_agent&content_type=...     → font decision agent
  POST /api/main?endpoint=svara   body: {text, voice}     → Svara TTS audio (audio/mpeg or audio/wav)

Svara TTS calls kenpath/svara-tts-v1's free Hugging Face Space
(https://huggingface.co/spaces/kenpath/svara-tts) via the official
gradio_client Python library — moved here from route.ts's
@gradio/client so the Next.js side no longer needs that npm dependency
at all; it just POSTs to this endpoint like any other API call.

IMPORTANT — same caveat as the JS version: the predict() parameter
names below (language, gender, text_input, ...) are a best-effort
match to the Space's visible UI labels. Before trusting this in
production, visit https://kenpath-svara-tts.hf.space, click "Use via
API" at the bottom, and confirm/adjust the parameter names below.
"""

import json
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from gradio_client import Client

# ═══════════════════════════════════════════════════════════════
# FONTS ENDPOINT
# ═══════════════════════════════════════════════════════════════

FONT_CATALOG = [
    {"label": "గురజాడ", "value": "Gurajada"},
    {"label": "ఎన్‌టిఆర్", "value": "NTR"},
    {"label": "రమణీయ", "value": "Ramaneeya"},
    {"label": "వేటూరి", "value": "Veturi"},
    {"label": "సిరివెన్నెల", "value": "Sirivennela"},
    {"label": "చతుర (Thin)", "value": "Chathura-Thin"},
    {"label": "చతుర (Light)", "value": "Chathura-Light"},
    {"label": "చతుర (Regular)", "value": "Chathura-Regular"},
    {"label": "చతుర (Bold)", "value": "Chathura-Bold"},
    {"label": "చతుర (ExtraBold)", "value": "Chathura-ExtraBold"},
    {"label": "రామరాజ", "value": "Ramaraja"},
    {"label": "రవి ప్రకాష్", "value": "RaviPrakash"},
    {"label": "తెనాలి రామకృష్ణ", "value": "TenaliRamakrishna"},
    {"label": "తిమ్మన", "value": "Timmana"},
    {"label": "టానా", "value": "TANA"},
    {"label": "గిడుగు", "value": "Gidugu"},
    {"label": "గిడుగు (ఇటాలిక్)", "value": "Gidugu-Italic"},
    {"label": "లక్కిరెడ్డి", "value": "LakkiReddy"},
    {"label": "నందకం", "value": "Nandakam"},
    {"label": "నందకం (ఇటాలిక్)", "value": "Nandakam-Italic"},
    {"label": "పెద్దన", "value": "Peddana"},
    {"label": "పురుషోత్తమ", "value": "Purushothamaa"},
    {"label": "పురుషోత్తమ (ఇటాలిక్)", "value": "Purushothamaa-Italic"},
    {"label": "రామభద్ర", "value": "Ramabhadra"},
    {"label": "రామభద్ర (ఇటాలిక్)", "value": "Ramabhadra-Italic"},
    {"label": "శ్రీ కృష్ణదేవరాయ", "value": "SreeKrushnadevaraya"},
    {"label": "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", "value": "SreeKrushnadevaraya-Italic"},
    {"label": "సురన్న (Regular)", "value": "Suranna-Regular"},
    {"label": "సురన్న (Bold)", "value": "Suranna-Bold"},
    {"label": "సురన్న (Italic)", "value": "Suranna-Italic"},
    {"label": "సురన్న (Bold Italic)", "value": "Suranna-BoldItalic"},
    {"label": "సురవరం", "value": "Suravaram"},
    {"label": "సురవరం (ఇటాలిక్)", "value": "Suravaram-Italic"},
    {"label": "పొన్నల", "value": "Ponnala-Regular"},
    {"label": "అన్నమయ్య", "value": "Annamayya"},
    {"label": "అన్నమయ్య (Bold)", "value": "Annamayya-Bold"},
    {"label": "అన్నమయ్య (Italic)", "value": "Annamayya-Italic"},
    {"label": "అన్నమయ్య (Bold Italic)", "value": "Annamayya-BoldItalic"},
    {"label": "ధూర్జటి", "value": "Dhurjati"},
    {"label": "ధూర్జటి (ఇటాలిక్)", "value": "Dhurjati-Italic"},
    {"label": "జిమ్స్", "value": "JIMS"},
    {"label": "జిమ్స్ (ఇటాలిక్)", "value": "JIMS-Italic"},
    {"label": "కనకదుర్గ", "value": "KanakaDurga"},
    {"label": "కనకదుర్గ (ఇటాలిక్)", "value": "KanakaDurga-Italic"},
    {"label": "మండలి (Regular)", "value": "Mandali-Regular"},
    {"label": "మండలి (Bold)", "value": "Mandali-Bold"},
    {"label": "మండలి (Italic)", "value": "Mandali-Italic"},
    {"label": "మండలి (Bold Italic)", "value": "Mandali-BoldItalic"},
    {"label": "పొట్టి శ్రీరాములు", "value": "PottiSreeramulu"},
    {"label": "తిరొ సుందర తెలుగు", "value": "TiroSundaraTelugu-Regular"},
]


def handle_fonts():
    return 200, FONT_CATALOG


# ═══════════════════════════════════════════════════════════════
# FONT AGENT ENDPOINT
# ═══════════════════════════════════════════════════════════════

UI_FONTS = ["Mandali-Regular", "NTR"]
SLOKA_FONTS = ["Annamayya", "SreeKrushnadevaraya", "Gurajada"]
HEADING_FONTS = ["Chathura-ExtraBold", "Suranna-Bold"]


def decide_font(content_type: str, width: int) -> dict:
    is_narrow = width < 600

    if content_type == "sloka":
        font = SLOKA_FONTS[0]
        size_multiplier = 0.95 if is_narrow else 1.1
        size_note = "చిన్న స్క్రీన్ కోసం తగ్గించిన సైజ్‌లో" if is_narrow else "చదవడానికి వీలుగా కొంచెం పెద్ద సైజ్‌లో"
        reason = f"శ్లోకం/పద్య కంటెంట్ — సంప్రదాయ, కళాత్మక ఫాంట్‌ను {size_note} ఎంచుకున్నాను."
    elif content_type == "heading":
        font = HEADING_FONTS[0]
        size_multiplier = 1.0 if is_narrow else 1.2
        reason = "శీర్షిక/టైటిల్ టెక్స్ట్ — బోల్డ్, ప్రభావవంతమైన ఫాంట్‌ను ఎంచుకున్నాను."
    else:
        font = UI_FONTS[0]
        size_multiplier = 0.9 if is_narrow else 1.0
        size_note = "చిన్న ఫోన్ సైజ్‌లలో" if is_narrow else "సాధారణ డెస్క్‌టాప్ సైజ్‌లో"
        reason = f"సాధారణ UI టెక్స్ట్ — {size_note} స్పష్టంగా కనిపించేలా రూపొందించిన ఫాంట్‌ను ఎంచుకున్నాను."

    return {"fontFamily": font, "fontSizeMultiplier": size_multiplier, "reason": reason}


def handle_font_agent(query: dict):
    content_type = query.get("content_type", ["ui"])[0]
    try:
        width = int(query.get("width", ["1024"])[0])
    except ValueError:
        width = 1024

    return 200, decide_font(content_type, width)


# ═══════════════════════════════════════════════════════════════
# SVARA TTS ENDPOINT — POST only
# ═══════════════════════════════════════════════════════════════

_svara_client: Client | None = None


def get_svara_client() -> Client:
    global _svara_client
    if _svara_client is None:
        # gradio_client picks up HF_TOKEN from the environment automatically
        # if set — helps avoid rate limits on the free Zero-GPU Space tier.
        _svara_client = Client("kenpath/svara-tts")
    return _svara_client


def handle_svara_tts(text: str, voice_choice: str) -> tuple[bytes, str]:
    """Generate Telugu speech using the Svara Hugging Face Gradio Space."""

    client = get_svara_client()
    gender = "Female" if voice_choice == "female" else "Male"

    # Current Svara Space endpoint is /generate_speech (not /predict).
    result = client.predict(
        language="Telugu (తెలుగు)",
        gender=gender,
        text=text,
        temperature=0.7,
        top_p=0.8,
        repetition_penalty=1.1,
        max_new_tokens=1200,
        api_name="/generate_speech",
    )

    print("Svara raw result:", repr(result))

    if isinstance(result, str) and os.path.exists(result):
        with open(result, "rb") as f:
            return f.read(), "audio/wav"

    if isinstance(result, dict):
        audio_path = result.get("path") or result.get("value") or result.get("name")
        if audio_path and os.path.exists(audio_path):
            with open(audio_path, "rb") as f:
                return f.read(), "audio/wav"

    raise RuntimeError(f"Svara Space returned an unsupported audio result: {result!r}")



# ═══════════════════════════════════════════════════════════════
# HANDLER
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

    def _send_audio(self, audio_bytes: bytes, content_type: str):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(audio_bytes)))
        self.end_headers()
        self.wfile.write(audio_bytes)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        if endpoint == "fonts":
            status, payload = handle_fonts()
        elif endpoint == "font_agent":
            status, payload = handle_font_agent(query)
        else:
            status, payload = 400, {
                "error": "Missing or invalid ?endpoint= param. Use 'fonts' or 'font_agent'."
            }

        self._send_json(status, payload)

    def do_POST(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        if endpoint != "svara":
            self._send_json(400, {"error": "POST only supports ?endpoint=svara"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            payload = json.loads(body) if body else {}
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        text = (payload.get("text") or "").strip()
        voice_choice = payload.get("voice", "male")

        if not text:
            self._send_json(400, {"error": "Missing 'text' field."})
            return

        try:
            audio_bytes, content_type = handle_svara_tts(text, voice_choice)
            self._send_audio(audio_bytes, content_type)
        except Exception as e:
            print(f"[Svara TTS] generation failed: {e}")
            self._send_json(502, {"error": f"Svara TTS generation failed: {e}"})

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Local-only test runner ──
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8004
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/main?endpoint=fonts")
    print(f"Try: http://localhost:{port}/api/main?endpoint=font_agent&content_type=sloka&width=390")
    print(f"POST http://localhost:{port}/api/main?endpoint=svara  body: {{\"text\": \"...\", \"voice\": \"male\"}}")
    HTTPServer(("localhost", port), handler).serve_forever()