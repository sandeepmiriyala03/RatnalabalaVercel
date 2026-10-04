import asyncio
import base64
import io
import json
import os
import re
import time
import traceback
import psycopg

from datetime import datetime
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from psycopg.rows import dict_row

import httpx
import sys

# ⚠️ Vercel లో api/ folder Python path లో ఉండకపోవచ్చు — పక్క files (_router, _activity,
# _aksharamala …) దొరకాలంటే ముందు ఇది తప్పనిసరి. లేకపోతే మొత్తం API 500 తో ఆగిపోతుంది.
_API_DIR = str(Path(__file__).resolve().parent)
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

# 6 Python functions → 1: /api/aksharamala, /api/gita, ... ఈ main.py నుండే నడుస్తాయి
try:
    from _router import delegate
except Exception as _router_error:  # router విఫలమైనా fonts, poems ఆగకూడదు
    print(f"[Ratnalabala] router unavailable: {type(_router_error).__name__}: {_router_error}")

    def delegate(handler_self, method: str) -> bool:
        return False

# వినియోగదారుల కార్యకలాపాల ఏజెంట్ (api/_activity.py) — విఫలమైనా మిగతా API నడుస్తుంది
try:
    from _activity import activity_summary, save_activity
except Exception as _activity_error:
    print(f"[Ratnalabala] activity agent unavailable: {type(_activity_error).__name__}: {_activity_error}")

    def save_activity(raw: bytes):
        return 503, {"saved": 0, "error": "activity agent unavailable"}

    def activity_summary(query, admin_key):
        return 503, {"error": "activity agent unavailable"}

# ═══════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════

# PostgreSQL connection string is read from an environment variable.
# Keep the real database password OUT of source code.
#
# Local / Vercel environment variable:
#   NEON_DATABASE_URL=postgresql://...
#
# This is the Python equivalent of reading a connection string
# from IConfiguration / appsettings in ASP.NET Core.
RATNALABALA_DATABASE_URL = os.environ.get(
    "NEON_DATABASE_URL",
    ""
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# ═══════════════════════════════════════════════════════════════
# భావాలమాల AI — RAG CONFIGURATION (ఒకే చోట)
# ═══════════════════════════════════════════════════════════════
# ⚠️ BGE-M3 (sentence-transformers + torch, ~2–3 GB) LOCAL లో మాత్రమే.
#    requirements-local.txt లో ఉంది, requirements.txt లో కాదు.
#    ఇక్కడ పైన import చేయకూడదు — Vercel లో మొత్తం API ఆగిపోతుంది.

BHAVALAMALA_SOURCE_TABLE = "gnanamala"
BHAVALAMALA_EMBEDDING_MODEL = "BAAI/bge-m3"
BHAVALAMALA_EMBEDDING_DIM = 1024
BHAVALAMALA_CHAT_MODEL = os.environ.get("GROQ_CHAT_MODEL", "openai/gpt-oss-120b")
BHAVALAMALA_DEFAULT_TOP_K = 5
BHAVALAMALA_MAX_TOP_K = 10
BHAVALAMALA_MAX_QUESTION_LENGTH = 1000
# దీనికంటే తక్కువ similarity ఉన్నవి "సంబంధం లేనివి" — Groq కి పంపము, మూలాలుగా చూపము
BHAVALAMALA_MIN_SIMILARITY = float(os.environ.get("BHAVALAMALA_MIN_SIMILARITY", "0.45"))
BHAVALAMALA_DAILY_LIMIT = 100

# Production (Vercel) లో BGE-M3 — అదే model, బయటి సేవ ద్వారా (ఏదీ లేకపోతే local మాత్రమే):
#   1) EMBEDDINGS_API_URL + EMBEDDINGS_API_KEY → OpenAI-compatible (ఉదా: DeepInfra BAAI/bge-m3)
#   2) HF_TOKEN → Hugging Face Inference (hf-inference, BAAI/bge-m3)
EMBEDDINGS_API_URL = os.environ.get("EMBEDDINGS_API_URL", "")  # ఉదా: https://api.deepinfra.com/v1/openai/embeddings
EMBEDDINGS_API_KEY = os.environ.get("EMBEDDINGS_API_KEY", "")
HF_EMBEDDING_URL = f"https://router.huggingface.co/hf-inference/models/{BHAVALAMALA_EMBEDDING_MODEL}/pipeline/feature-extraction"

BHAVALAMALA_NOT_FOUND = "క్షమించండి, ఈ ప్రశ్నకు భావాలమాలలో సంబంధిత సమాచారం కనిపించలేదు."
BHAVALAMALA_LOCAL_ONLY = "భావాలమాల AI ప్రస్తుతం local పరీక్షలో మాత్రమే అందుబాటులో ఉంది. త్వరలో అందరికీ."


SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")
SARVAM_MODEL = "bulbul:v2"
SARVAM_SPEAKERS = {"sarvam-te-female": "anushka", "sarvam-te-male": "abhilash"}

SVARA_SPACE_BASE = "https://kenpath-svara-tts.hf.space"
SVARA_API_NAME = "generate_speech"
_HF_TOKEN = os.environ.get("HF_TOKEN", "")

MAX_CHUNK_CHARS = 500

# api/main.py -> parent (api/) -> parent (project root) -> content/
POEMS_ROOT = Path(__file__).resolve().parent.parent / "content"


def log(message: str):
    print(f"[Ratnalabala] {message}")

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
    {"label": "నాట్స్", "value": "NATS"},
    {"label": "నాట్స్ (ఇటాలిక్)", "value": "NATS-Italic"},
    {"label": "బి వి సత్యమూర్తి", "value": "BVSatyamurty"},
    {"label": "మల్లన్న", "value": "Mallanna"},
    {"label": "మల్లన్న (ఇటాలిక్)", "value": "Mallanna-Italic"},
    {"label": "పి వి నరసింహారావు", "value": "PVNR"},
    {"label": "శీల వీర్రాజు", "value": "SeelaVeerraju"},
    {"label": "ఎస్ పి బాలసుబ్రహ్మణ్యం", "value": "SPBalasubrahmanyam"},
    {"label": "శ్యామల రమణ", "value": "Syamala Ramana"},
]

FONT_VALUES = {f["value"] for f in FONT_CATALOG}

# Must match DEFAULT_FONT in FontControlsTelugu.tsx
DEFAULT_FONT = "Dhurjati"


# అన్ని పరికరాలకూ (ఫోన్, ట్యాబ్లెట్, కంప్యూటర్) ఒకే పూర్తి జాబితా — 59 fonts
FONT_COUNT = len(FONT_CATALOG)

# Fonts అరుదుగా మారతాయి: Vercel CDN దగ్గర దాచి ఉంచితే ప్రతి పరికరానికి వెంటనే వస్తాయి.
# (Function cold start / నెమ్మది నెట్‌వర్క్ వల్ల ఫోన్‌లో "8 fonts మాత్రమే" fallback రాకుండా)
FONTS_CACHE_HEADER = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"

# అన్ని పద్యాలు ఒకే జవాబులో (జ్ఞానమాల) — Vercel CDN దగ్గర 1 గంట, తర్వాత నేపథ్యంలో తాజాపరచడం.
# Database లో మార్పులు గరిష్ఠంగా 1 గంటలో కనిపిస్తాయి.
POEMS_ALL_CACHE_HEADER = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"


def handle_fonts():
    """పూర్తి font జాబితా — పరికరం ఏదైనా, ఎప్పుడూ అన్నీ (FONT_COUNT)."""
    # A copy, so no request can ever change the shared list
    return 200, [dict(f) for f in FONT_CATALOG]


# ── FONT AGENT ──────────────────────────────────────────────────
# Keep these rules in sync with localDecideFont() in
# FontControlsTelugu.tsx (the browser uses it when this API is down).

CONTENT_TYPES = {"sloka", "ui", "heading"}

# First font in each list that exists in the catalog is used
PREFERRED_FONTS = {
    "sloka": ["Annamayya", "SreeKrushnadevaraya", "Gurajada"],
    "ui": ["Mandali-Regular", "NTR"],
    "heading": ["Chathura-ExtraBold", "Suranna-Bold"],
}

# Size multipliers per device. Telugu letters (conjuncts, vowel signs)
# get hard to read when small, so phones never go below 1.0 for
# reading content.
SIZE_BY_DEVICE = {
    "sloka":   {"phone": 1.0,  "tablet": 1.05, "desktop": 1.1},
    "ui":      {"phone": 1.0,  "tablet": 1.0,  "desktop": 1.0},
    "heading": {"phone": 1.05, "tablet": 1.1,  "desktop": 1.2},
}

DEVICE_TE = {"phone": "ఫోన్", "tablet": "ట్యాబ్లెట్", "desktop": "కంప్యూటర్"}

CONTENT_TE = {
    "sloka": "పద్య/శ్లోక కంటెంట్ — సంప్రదాయ, కళాత్మక ఫాంట్",
    "ui": "సాధారణ పేజీ — స్పష్టంగా చదవగలిగే ఫాంట్",
    "heading": "శీర్షికలు — బోల్డ్, ప్రభావవంతమైన ఫాంట్",
}


def device_for_width(width: int) -> str:
    if width < 600:
        return "phone"
    if width < 1024:
        return "tablet"
    return "desktop"


def pick_font(content_type: str) -> str:
    for font in PREFERRED_FONTS[content_type]:
        if font in FONT_VALUES:
            return font
    return DEFAULT_FONT


def decide_font(content_type: str, width: int) -> dict:
    if content_type not in CONTENT_TYPES:
        content_type = "ui"
    width = max(240, min(width, 7680))  # ignore nonsense widths
    device = device_for_width(width)

    font = pick_font(content_type)
    size = SIZE_BY_DEVICE[content_type][device]
    reason = f"{CONTENT_TE[content_type]}, {DEVICE_TE[device]} స్క్రీన్‌కు తగిన సైజ్ ({round(size * 100)}%)."

    # సూచించినవి ముందు, మిగతా అన్నీ తర్వాత — ఏ పరికరంలోనైనా 59 fonts ఎంచుకోవచ్చు
    recommended = [f for f in PREFERRED_FONTS[content_type] if f in FONT_VALUES]
    ordered = [f for f in FONT_CATALOG if f["value"] in recommended]
    ordered.sort(key=lambda f: recommended.index(f["value"]))
    ordered += [dict(f) for f in FONT_CATALOG if f["value"] not in recommended]

    return {
        "fontFamily": font,
        "fontSizeMultiplier": size,
        "device": device,
        "contentType": content_type,
        "reason": reason,
        "recommended": recommended,
        "fonts": ordered,
        "fontCount": len(ordered),
    }


def _first(query: dict, key: str, default: str) -> str:
    """parse_qs gives lists; accept plain strings too."""
    value = query.get(key, default)
    if isinstance(value, list):
        value = value[0] if value else default
    return str(value).strip() or default


def handle_font_agent(query: dict):
    content_type = _first(query, "content_type", "ui").lower()
    try:
        width = int(float(_first(query, "width", "1024")))
    except ValueError:
        width = 1024
    return 200, decide_font(content_type, width)


# ═══════════════════════════════════════════════════════════════
# SVARA TTS
# ═══════════════════════════════════════════════════════════════

def _svara_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if _HF_TOKEN:
        headers["Authorization"] = f"Bearer {_HF_TOKEN}"
    return headers


def _call_svara_once(text: str, gender: str) -> tuple[bytes, str]:
    """One attempt at the full Svara call (POST -> SSE stream -> audio
    download). Raises on any failure; the caller (handle_svara_tts)
    wraps this in a retry loop."""
    payload = {
        "data": [
            "Telugu (తెలుగు)", gender, text, 0.7, 0.8, 1.1, 1200,
        ]
    }
    call_url = f"{SVARA_SPACE_BASE}/gradio_api/call/{SVARA_API_NAME}"

    with httpx.Client(timeout=90, headers=_svara_headers()) as client:
        post_res = client.post(call_url, json=payload)
        post_res.raise_for_status()
        event_id = post_res.json()["event_id"]
        log(f"[Svara TTS] event_id={event_id!r}, streaming for result...")

        result_data = None
        current_event = None
        with client.stream("GET", f"{call_url}/{event_id}") as stream:
            for line in stream.iter_lines():
                if not line:
                    continue
                if line.startswith("event:"):
                    current_event = line[len("event:"):].strip()
                    continue
                if not line.startswith("data:"):
                    continue
                data_str = line[len("data:"):].strip()
                if current_event == "heartbeat":
                    continue
                if current_event == "error":
                    # Permanent — the Space itself reported a real error
                    # for this request, not a transient availability
                    # issue. Retrying the exact same call won't help.
                    raise ValueError(f"Svara Space reported an error: {data_str[:300]}")
                try:
                    parsed = json.loads(data_str)
                except json.JSONDecodeError:
                    continue
                if parsed is None:
                    continue
                result_data = parsed
                if current_event == "complete" or current_event is None:
                    break

    if not result_data:
        # Transient — most likely the Space was cold-starting and never
        # got to "complete" within this attempt's window. Worth retrying.
        raise RuntimeError(
            "Svara Space closed the stream without sending a 'complete' event "
            "(likely cold-starting)."
        )

    audio_info = result_data[0] if isinstance(result_data, list) else result_data
    audio_path = None
    if isinstance(audio_info, dict):
        audio_path = audio_info.get("url") or audio_info.get("path") or audio_info.get("name")
    elif isinstance(audio_info, str):
        audio_path = audio_info
    if not audio_path:
        raise ValueError(f"Svara Space returned an unsupported audio result: {result_data!r}")

    audio_url = audio_path if audio_path.startswith("http") else f"{SVARA_SPACE_BASE}/gradio_api/file={audio_path}"
    with httpx.Client(timeout=45, headers=_svara_headers()) as client:
        audio_res = client.get(audio_url)
        audio_res.raise_for_status()
        return audio_res.content, "audio/wav"


def handle_svara_tts(text: str, voice_choice: str) -> tuple[bytes, str]:
    normalized = (voice_choice or "").strip().lower()
    gender = "Female" if normalized in ("female", "f", "woman") else "Male"
    log(f"[Svara TTS] received voice_choice={voice_choice!r} -> gender={gender}")

    MAX_ATTEMPTS = 3
    RETRY_DELAYS_SECONDS = [3, 5]  # one fewer than MAX_ATTEMPTS

    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return _call_svara_once(text, gender)
        except ValueError:
            # Permanent failure (real error from the Space, or an
            # unparseable result shape) — don't waste retries on it.
            raise
        except (httpx.TimeoutException, httpx.TransportError, httpx.HTTPStatusError, RuntimeError) as e:
            last_error = e
            if attempt < MAX_ATTEMPTS:
                delay = RETRY_DELAYS_SECONDS[attempt - 1]
                log(
                    f"[Svara TTS] attempt {attempt}/{MAX_ATTEMPTS} failed "
                    f"({e}), retrying in {delay}s..."
                )
                time.sleep(delay)
                continue
            break

    raise RuntimeError(
        f"Svara Space did not respond successfully after {MAX_ATTEMPTS} attempts "
        f"— it may be asleep/overloaded. Last error: {last_error}"
    )


# ═══════════════════════════════════════════════════════════════
# NEWS TTS — sanitizer + chunking + Sarvam/Edge dual engine
# ═══════════════════════════════════════════════════════════════

_ALLOWED_RE = re.compile(r"[^\u0C00-\u0C7F0-9₹%\-.?,!\u0964\u0965\s]")
_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_telugu(text: str) -> str:
    text = _ALLOWED_RE.sub(" ", text)
    return _WHITESPACE_RE.sub(" ", text).strip()


def chunk_text(text: str, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    sentences = re.split(r"(?<=[.?!\u0964\u0965])\s+|\n+", text)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip()
            continue
        if current:
            chunks.append(current)
            current = ""
        if len(sentence) > max_chars:
            for i in range(0, len(sentence), max_chars):
                chunks.append(sentence[i: i + max_chars])
        else:
            current = sentence
    if current:
        chunks.append(current)
    return chunks or ([text] if text else [])


async def synth_sarvam(text: str, voice: str, speed: float) -> bytes:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not configured on the server.")
    speaker = SARVAM_SPEAKERS[voice]
    pace = max(0.3, min(3.0, speed))
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            SARVAM_API_URL,
            headers={"api-subscription-key": SARVAM_API_KEY},
            json={
                "inputs": [text], "target_language_code": "te-IN", "model": SARVAM_MODEL,
                "speaker": speaker, "speech_sample_rate": 22050,
                "enable_preprocessing": True, "pace": pace,
            },
        )
        if res.status_code >= 400:
            raise RuntimeError(f"Sarvam API {res.status_code}: {res.text[:300]}")
        data = res.json()
        return base64.b64decode(data["audios"][0])


async def synth_edge(text: str, voice: str, speed: float) -> bytes:
    import edge_tts
    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"{'+' if rate_pct >= 0 else ''}{rate_pct}%"
    communicator = edge_tts.Communicate(text, voice=voice, rate=rate_str)
    buf = io.BytesIO()
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    audio_bytes = buf.getvalue()
    if not audio_bytes:
        raise RuntimeError(f"Edge TTS returned no audio for voice '{voice}'.")
    return audio_bytes


async def synth_chunk(text: str, voice: str, speed: float) -> bytes:
    if voice.startswith("sarvam-"):
        return await synth_sarvam(text, voice, speed)
    return await synth_edge(text, voice, speed)


async def _run_tts_pipeline_async(clean_text: str, voice: str, speed: float) -> bytes:
    chunks = chunk_text(clean_text)
    parts = await asyncio.gather(*(synth_chunk(c, voice, speed) for c in chunks))
    return b"".join(parts)


def handle_tts(text: str, voice: str, speed: float) -> tuple[bytes, str, str]:
    clean = sanitize_telugu(text)
    if not clean:
        raise ValueError("టెక్స్ట్ ఖాళీగా ఉంది లేదా తెలుగు అక్షరాలు కనిపించలేదు.")
    valid_voices = {"sarvam-te-female", "sarvam-te-male", "te-IN-ShrutiNeural", "te-IN-MohanNeural"}
    if voice not in valid_voices:
        raise ValueError(f"చెల్లని వాయిస్: {voice}")
    speed = max(0.5, min(2.0, speed))
    audio_bytes = asyncio.run(_run_tts_pipeline_async(clean, voice, speed))
    if voice.startswith("sarvam-"):
        return audio_bytes, "audio/wav", "wav"
    return audio_bytes, "audio/mpeg", "mp3"


# ═══════════════════════════════════════════════════════════════
# NEWS ARTICLE EXTRACTION
# ═══════════════════════════════════════════════════════════════

def extract_redbeenews_paragraphs(soup) -> list | None:
    all_p = soup.find_all("p")
    anchor_index = None
    for i, p in enumerate(all_p):
        if "రెడ్ బీ న్యూస్" in p.get_text():
            anchor_index = i
            break
    if anchor_index is None:
        return None
    body_paragraphs = []
    for p in all_p[anchor_index:]:
        text = p.get_text(" ", strip=True)
        if not text:
            continue
        if "related news" in text.lower():
            break
        if len(text) > 10:
            body_paragraphs.append(text)
    return body_paragraphs or None


def _check_news_url(url: str) -> None:
    """Only public http(s) web pages — never localhost / internal addresses."""
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ("http", "https") or not host:
        raise ValueError("సరైన వెబ్ లింక్ ఇవ్వండి (http:// లేదా https:// తో మొదలయ్యేది).")
    if (
        host in ("localhost", "0.0.0.0")
        or host.endswith(".local")
        or host.endswith(".internal")
        or re.match(r"^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)", host)
        or host.startswith("[")
    ):
        raise ValueError("ఈ లింక్‌ను తెరవలేము. వార్తా వెబ్‌సైట్ లింక్ ఇవ్వండి.")


def handle_extract_news(url: str) -> str:
    from bs4 import BeautifulSoup

    _check_news_url(url)

    browser_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "te-IN,te;q=0.9,en-IN;q=0.8,en;q=0.7",
    }

    MAX_ATTEMPTS = 5
    RETRY_DELAYS_SECONDS = [2, 3, 4, 4]

    res = None
    last_error: httpx.HTTPStatusError | None = None

    with httpx.Client(timeout=15, follow_redirects=True, headers=browser_headers) as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                res = client.get(url)
                res.raise_for_status()
                last_error = None
                break
            except httpx.HTTPStatusError as e:
                last_error = e
                if e.response.status_code in (403, 429) and attempt < MAX_ATTEMPTS:
                    delay = RETRY_DELAYS_SECONDS[attempt - 1]
                    log(f"[extract-news] {url} got {e.response.status_code} on attempt {attempt}/{MAX_ATTEMPTS}, retrying in {delay}s...")
                    time.sleep(delay)
                    continue
                break

    if last_error is not None:
        if last_error.response.status_code in (403, 429):
            raise ValueError(
                "ఈ వెబ్‌సైట్ బాట్ డిటెక్షన్‌తో ఆటోమేటిక్ రిక్వెస్ట్‌లను బ్లాక్ చేస్తోంది "
                f"({MAX_ATTEMPTS} ప్రయత్నాల తర్వాత కూడా) — ఇది ఈ సైట్ యొక్క పరిమితి, "
                "మా కోడ్‌లో బగ్ కాదు. దయచేసి ఆర్టికల్ టెక్స్ట్‌ను నేరుగా కాపీ-పేస్ట్ చేయండి "
                "లేదా కొద్దిసేపు తర్వాత మళ్లీ ప్రయత్నించండి."
            )
        raise last_error

    soup = BeautifulSoup(res.text, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
        tag.decompose()

    paragraphs: list | None = None
    if "redbeenews.com" in urlparse(url).netloc:
        redbee_paragraphs = extract_redbeenews_paragraphs(soup)
        if redbee_paragraphs:
            paragraphs = redbee_paragraphs

    if paragraphs is None:
        CONTENT_SELECTORS = [
            "article", '[itemprop="articleBody"]',
            ".story-content", ".storycontent", ".story_content",
            ".article-content", ".articlebodycontent", ".article-body",
            ".content-body", ".entry-content", ".post-content",
            ".detail-content", ".full-details", ".art-content",
            ".fullstory", ".storyPage", ".story-details",
        ]
        candidates = None
        for selector in CONTENT_SELECTORS:
            container = soup.select_one(selector)
            if container:
                found = container.find_all("p")
                if found:
                    candidates = found
                    break

        if candidates is None:
            all_p = soup.find_all("p")
            best_run: list = []
            current_run: list = []
            for p in all_p:
                text = p.get_text(" ", strip=True)
                if len(text) > 40:
                    current_run.append(p)
                    if len(current_run) > len(best_run):
                        best_run = current_run
                else:
                    current_run = []
            candidates = best_run

        paragraphs = [p.get_text(" ", strip=True) for p in candidates]
        paragraphs = [p for p in paragraphs if len(p) > 40]

    text = sanitize_telugu("\n\n".join(paragraphs))
    if not text:
        raise ValueError("ఈ లింక్ నుండి తెలుగు ఆర్టికల్ టెక్స్ట్ దొరకలేదు.")
    return text


# ═══════════════════════════════════════════════════════════════
# POETRY - POSTGRESQL
# ═══════════════════════════════════════════════════════════════

def _normalize_poem_text(text: str) -> str:
    """Trim every line and normalise newlines so the same poem compares
    equal even if it went through JSON / a browser / \\r\\n on the way."""
    return "\n".join(
        line.strip() for line in (text or "").replace("\r\n", "\n").split("\n")
    ).strip()


def pick_poem_row(rows: list[dict], content: str = "") -> dict | None:
    """Several poets can have a poem with the same title. The row whose
    text matches `content` wins; otherwise fall back to the first row."""
    if not rows:
        return None
    if len(rows) == 1:
        return rows[0]
    wanted = _normalize_poem_text(content)
    for row in rows:
        if _normalize_poem_text(row["content"]) == wanted:
            return row
    return rows[0]


class Poems:
    """
    Generic PostgreSQL poem access.

    Usage:
        Poems.get(1)  -> poems for poet_id 1
        Poems.get(2)  -> poems for poet_id 2
        Poems.find_by_title("గర్వం")  -> one poem (used by poem-ai)
    """

    @staticmethod
    def get(poet_id: int) -> list[dict]:

        if not RATNALABALA_DATABASE_URL:
            raise RuntimeError(
                "NEON_DATABASE_URL is not configured."
            )

        query = """
            SELECT
                p.poem_id,
                p.title,
                p.content,
                p.special_line,
                p.poet_id,
                pt.poet_name,
                p.created_by,
                p.created_date,
                p.modified_by,
                p.modified_date,
                p.is_active
            FROM poems p
            INNER JOIN poets pt
                ON p.poet_id = pt.poet_id
            WHERE p.poet_id = %s
              AND p.is_active = TRUE
              AND pt.is_active = TRUE
            ORDER BY p.poem_id;
        """

        with psycopg.connect(
            RATNALABALA_DATABASE_URL,
            row_factory=dict_row
        ) as conn:

            with conn.cursor() as cursor:
                cursor.execute(query, (poet_id,))
                rows = cursor.fetchall()

        return [dict(row) for row in rows]

    @staticmethod
    def get_all() -> list[dict]:
        """అన్ని కవుల అన్ని పద్యాలు — ఒకే query, ఒకే connection (13 బదులు)."""
        if not RATNALABALA_DATABASE_URL:
            raise RuntimeError("NEON_DATABASE_URL is not configured.")

        query = """
            SELECT
                p.poem_id,
                p.title,
                p.content,
                p.special_line,
                p.poet_id,
                pt.poet_name
            FROM poems p
            INNER JOIN poets pt
                ON p.poet_id = pt.poet_id
            WHERE p.is_active = TRUE
              AND pt.is_active = TRUE
            ORDER BY p.poet_id, p.poem_id;
        """

        with psycopg.connect(RATNALABALA_DATABASE_URL, row_factory=dict_row) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                return [dict(row) for row in cursor.fetchall()]

    @staticmethod
    def find_by_title(title: str, content: str = "") -> dict | None:
        """Used by poem-ai for poems that live in the database (no .md
        file). The answer is grounded in the DATABASE text, never in text
        sent by the browser — `content` is only used to tell apart poems
        that share a title across different poets."""

        if not RATNALABALA_DATABASE_URL:
            raise RuntimeError(
                "NEON_DATABASE_URL is not configured."
            )

        query = """
            SELECT
                p.poem_id,
                p.title,
                p.content,
                pt.poet_name,
                p.special_line
            FROM poems p
            INNER JOIN poets pt
                ON p.poet_id = pt.poet_id
            WHERE p.title = %s
              AND p.is_active = TRUE
              AND pt.is_active = TRUE
            ORDER BY p.poem_id;
        """

        with psycopg.connect(
            RATNALABALA_DATABASE_URL,
            row_factory=dict_row
        ) as conn:

            with conn.cursor() as cursor:
                cursor.execute(query, ((title or "").strip(),))
                rows = [dict(row) for row in cursor.fetchall()]

        return pick_poem_row(rows, content)


# ═══════════════════════════════════════════════════════════════
# POETRY (markdown files under content/)
# ═══════════════════════════════════════════════════════════════

def parse_poem_markdown(file_path: Path) -> dict:
    text = file_path.read_text(encoding="utf-8")
    title, author, content = "", "", text.strip()

    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) == 3:
            frontmatter = parts[1]
            content = parts[2].strip()
            for line in frontmatter.splitlines():
                line = line.strip()
                if line.startswith("title:"):
                    title = line[len("title:"):].strip().strip('"').strip("'")
                elif line.startswith("author:"):
                    author = line[len("author:"):].strip().strip('"').strip("'")

    if not title:
        title = file_path.stem

    return {"title": title, "author": author, "text": content, "filename": file_path.name}


def safe_collection_path(collection: str) -> Path:
    collection = (collection or "").strip()
    if not collection:
        raise ValueError("Collection is required.")
    root = POEMS_ROOT.resolve()
    collection_path = (root / collection).resolve()
    if root not in collection_path.parents:
        raise ValueError("Invalid collection path.")
    return collection_path


def safe_poem_path(collection: str, filename: str) -> Path:
    collection_path = safe_collection_path(collection)
    filename = (filename or "").strip()
    if not filename:
        raise ValueError("Filename is required.")
    if not filename.lower().endswith(".md"):
        raise ValueError("Only .md poem files are supported.")
    poem_path = (collection_path / filename).resolve()
    root = POEMS_ROOT.resolve()
    if root not in poem_path.parents:
        raise ValueError("Invalid poem path.")
    return poem_path


def get_poems(collection: str) -> list[dict]:
    collection_path = safe_collection_path(collection)
    if not collection_path.exists():
        raise FileNotFoundError(f"Collection '{collection}' not found.")
    if not collection_path.is_dir():
        raise FileNotFoundError(f"Collection '{collection}' is not a directory.")

    poems = []
    for file_path in sorted(collection_path.glob("*.md")):
        try:
            poem = parse_poem_markdown(file_path)
            if poem["title"] and poem["text"]:
                poems.append(poem)
        except Exception as e:
            log(f"Failed to read {file_path.name}: {e}")
    return poems


def get_poem(collection: str, filename: str) -> dict:
    poem_path = safe_poem_path(collection, filename)
    if not poem_path.exists():
        raise FileNotFoundError(f"Poem '{filename}' not found.")
    if not poem_path.is_file():
        raise FileNotFoundError(f"Poem '{filename}' is not a file.")
    return parse_poem_markdown(poem_path)


def strip_markdown(text: str) -> str:
    """Safety net beneath the prompt-level instruction above — strips
    common markdown syntax from an LLM answer that's going to be
    displayed as plain text (no markdown renderer on the frontend).
    Even with an explicit "don't use markdown" instruction, models
    sometimes slip into **bold**/- bullets/# headers out of habit, so
    this cleans it up server-side rather than trusting the prompt
    alone. Deliberately conservative: strips the SYMBOLS, keeps the
    actual words, so meaning is never lost even if a pattern doesn't
    match exactly.
    """
    # Bold/italic markers: **text** / *text* -> text
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", text)
    # Leading bullet markers at the start of a line: "- ", "* ", "• "
    text = re.sub(r"(?m)^[ \t]*[-*•][ \t]+", "", text)
    # Markdown headers: "### text" -> "text"
    text = re.sub(r"(?m)^#{1,6}[ \t]+", "", text)
    return text.strip()


# ═══════════════════════════════════════════════════════════════
# BAML — SHARED LLM CLIENT
# ═══════════════════════════════════════════════════════════════
#
# The generated client is imported inside the request so missing BAML
# dependencies affect only poem-ai, not the other API endpoints.

AI_UNAVAILABLE_MSG = "AI సేవ ఇప్పుడు అందుబాటులో లేదు. కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి."
AI_BUSY_MSG = "ఇప్పుడు చాలా మంది వాడుతున్నారు. కొద్దిసేపు ఆగి మళ్ళీ ప్రయత్నించండి."
AI_SLOW_MSG = "సమాధానం రావడానికి ఎక్కువ సమయం పట్టింది. మళ్ళీ ప్రయత్నించండి."


class AIServiceError(Exception):
    """An AI provider problem, already translated into an HTTP status and a
    message that is safe to show to the person. The technical cause goes to the
    server log only."""

    def __init__(self, status: int, message: str, detail: str = ""):
        super().__init__(detail or message)
        self.status = status
        self.message = message


async def call_baml(poem: dict, question: str) -> str:
    """Explain a server-loaded poem through the shared generated BAML client."""
    if not GROQ_API_KEY:
        raise AIServiceError(
            503, AI_UNAVAILABLE_MSG,
            "GROQ_API_KEY is not configured on the server.",
        )

    try:
        from baml_client import b
    except ImportError as e:
        raise AIServiceError(
            503, AI_UNAVAILABLE_MSG,
            f"BAML Python runtime is missing ({e}). Add baml-py to requirements.txt.",
        ) from e

    try:
        answer = await asyncio.to_thread(
            b.ExplainPoem,
            poem_title=poem["title"],
            author=poem["author"],
            poem_text=poem["text"],
            question=question,
        )
    except Exception as e:
        status = getattr(e, "status_code", None)
        detail = f"{type(e).__name__} (HTTP {status}): {e}"
        if status == 429:
            raise AIServiceError(429, AI_BUSY_MSG, detail) from e
        if "timeout" in type(e).__name__.lower():
            raise AIServiceError(504, AI_SLOW_MSG, detail) from e
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, detail) from e

    answer = answer.strip()
    if not answer:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, "BAML returned an empty answer.")

    return strip_markdown(answer)


async def explain_poem(
    collection: str,
    filename: str,
    question: str,
    title: str = "",
    content: str = "",
) -> dict:
    question = (question or "").strip()
    if not question:
        raise ValueError("Question is required.")

    if collection and filename:
        # Poem stored as a .md file under content/<collection>/
        poem = get_poem(collection=collection, filename=filename)
    else:
        # Poem stored in PostgreSQL (no file) — find it by title.
        row = await asyncio.to_thread(Poems.find_by_title, title, content)
        if row is None:
            raise FileNotFoundError(f"Poem '{title}' not found.")
        poem = {
            "title": row["title"],
            "author": row["poet_name"],
            "text": row["content"],
        }

    answer = await call_baml(poem, question)
    return {
        "success": True, "collection": collection, "filename": filename,
        "title": poem["title"], "author": poem["author"],
        "question": question, "answer": answer,
    }


# ═══════════════════════════════════════════════════════════════
# భావాలమాల AI — RAG: ప్రశ్న → BGE-M3 → pgvector → Groq
# ═══════════════════════════════════════════════════════════════

_bhavalamala_model = None  # BGE-M3 — మొదటి ప్రశ్నకు ఒక్కసారే load


def _local_model_installed() -> bool:
    import importlib.util
    try:
        return importlib.util.find_spec("sentence_transformers") is not None
    except (ImportError, ValueError):
        return False


def bhavalamala_embedding_mode() -> str:
    """'local' (computer) · 'api' (OpenAI-compatible) · 'hf' (Hugging Face) · '' (ఏదీ లేదు)."""
    if _local_model_installed():
        return "local"
    if EMBEDDINGS_API_URL and EMBEDDINGS_API_KEY:
        return "api"
    if _HF_TOKEN:
        return "hf"
    return ""


def bhavalamala_available() -> bool:
    return bool(bhavalamala_embedding_mode())


def _to_pgvector(vector) -> str:
    """BGE-M3 sentence vector → L2 normalize → '[0.01,…]' (database embeddings లాగే normalized)."""
    values = [float(v) for v in vector]
    if len(values) != BHAVALAMALA_EMBEDDING_DIM:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, f"Embedding dim {len(values)} != {BHAVALAMALA_EMBEDDING_DIM}")
    norm = sum(v * v for v in values) ** 0.5 or 1.0
    return "[" + ",".join(f"{v / norm:.7f}" for v in values) + "]"


def _sentence_vector(data):
    """Hugging Face జవాబు రూపం ఏదైనా: [1024] · [[1024]] · [[[token],…]] (అప్పుడు CLS = మొదటి token, BGE-M3 pooling)."""
    while isinstance(data, list) and data and isinstance(data[0], list):
        if len(data) == 1:
            data = data[0]
        elif isinstance(data[0][0], list):
            data = data[0]
        else:
            data = data[0]  # token వారీ → CLS
    return data


def _remote_embedding(question: str, mode: str):
    try:
        if mode == "api":
            res = httpx.post(
                EMBEDDINGS_API_URL,
                headers={"Authorization": f"Bearer {EMBEDDINGS_API_KEY}"},
                json={"model": BHAVALAMALA_EMBEDDING_MODEL, "input": [question], "encoding_format": "float"},
                timeout=30,
            )
        else:
            res = httpx.post(
                HF_EMBEDDING_URL,
                headers={"Authorization": f"Bearer {_HF_TOKEN}", "X-Wait-For-Model": "true"},
                json={"inputs": question, "normalize": True},
                timeout=60,
            )
    except httpx.TimeoutException as e:
        raise AIServiceError(504, AI_SLOW_MSG, f"Embedding timeout ({mode}): {e}") from e
    except httpx.HTTPError as e:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, f"Embedding network error ({mode}): {e}") from e

    if res.status_code == 429:
        raise AIServiceError(429, AI_BUSY_MSG, f"Embedding rate limit ({mode})")
    if res.status_code >= 400:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, f"Embedding HTTP {res.status_code} ({mode}): {res.text[:300]}")

    data = res.json()
    return data["data"][0]["embedding"] if mode == "api" else _sentence_vector(data)


def create_bhavalamala_embedding(question: str) -> str:
    """ప్రశ్న → BGE-M3 (local / బయటి సేవ) → normalized 1024 → pgvector literal."""
    global _bhavalamala_model
    mode = bhavalamala_embedding_mode()
    if mode == "local":
        if _bhavalamala_model is None:
            from sentence_transformers import SentenceTransformer  # local only — ఇక్కడే import
            log("[Bhavalamala] Loading BGE-M3 (first request — may take a while)...")
            _bhavalamala_model = SentenceTransformer(BHAVALAMALA_EMBEDDING_MODEL)
            log("[Bhavalamala] BGE-M3 ready.")
        return _to_pgvector(_bhavalamala_model.encode(question, normalize_embeddings=True))
    if mode in ("api", "hf"):
        return _to_pgvector(_remote_embedding(question, mode))
    raise AIServiceError(503, BHAVALAMALA_LOCAL_ONLY, "No embedding provider configured.")


def search_bhavalamala(embedding: str, top_k: int) -> list[dict]:
    """pgvector cosine similarity — HNSW index వాడుతుంది."""
    if not RATNALABALA_DATABASE_URL:
        raise RuntimeError("NEON_DATABASE_URL is not configured.")

    query = f"""
        SELECT id, source_key, mala, title, content, source, details, link,
               1 - (embedding <=> %(q)s::vector) AS similarity
        FROM {BHAVALAMALA_SOURCE_TABLE}
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> %(q)s::vector
        LIMIT %(k)s;
    """
    with psycopg.connect(RATNALABALA_DATABASE_URL, row_factory=dict_row, connect_timeout=10) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, {"q": embedding, "k": top_k})
            return [dict(r) for r in cursor.fetchall()]


def build_bhavalamala_context(records: list[dict]) -> str:
    """తెచ్చిన వరుసలు మాత్రమే — LLM కి ఇచ్చే ఆధారం."""
    blocks = []
    for i, r in enumerate(records, start=1):
        lines = [f"[{i}]", f"మాల: {r.get('mala') or ''}", f"శీర్షిక: {r.get('title') or ''}"]
        if r.get("content"):
            lines.append(f"విషయం: {(r['content'] or '')[:1200]}")
        if r.get("details"):
            lines.append(f"వివరాలు: {(r['details'] or '')[:600]}")
        if r.get("source"):
            lines.append(f"మూలం: {r['source']}")
        blocks.append("\n".join(lines))
    return "\n\n".join(blocks)


BHAVALAMALA_SYSTEM_PROMPT = """నీవు రత్నాలబాల "భావాలమాల AI" తెలుగు సాహిత్య సహాయకుడివి.

నియమాలు:
1. క్రింద ఇచ్చిన భావాలమాల ఆధారాలను మాత్రమే వాడు. బయటి జ్ఞానం వాడకు.
2. ఆధారాల్లో జవాబు లేకపోతే ఇలాగే చెప్పు: "క్షమించండి, ఈ ప్రశ్నకు భావాలమాలలో సంబంధిత సమాచారం కనిపించలేదు."
3. తెలుగు ప్రశ్నకు తెలుగులో, లేకపోతే ప్రశ్న భాషలో జవాబు.
4. 2–6 వాక్యాలు, సూటిగా. అవసరమైతే శీర్షిక లేదా [1], [2] సంఖ్య సూచించు.
5. Embedding, database, search, prompt వంటి సాంకేతిక విషయాలు చెప్పకు.
6. Markdown (**, #, -) వాడకు — సాదా వాక్యాలు మాత్రమే."""


def call_bhavalamala_groq(question: str, context: str) -> str:
    """Groq (OpenAI-compatible) — ఆధారాలకే పరిమితమైన జవాబు."""
    if not GROQ_API_KEY:
        raise AIServiceError(503, AI_UNAVAILABLE_MSG, "GROQ_API_KEY is not configured.")

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json={
                "model": BHAVALAMALA_CHAT_MODEL,
                "temperature": 0.2,
                "max_tokens": 700,
                "messages": [
                    {"role": "system", "content": BHAVALAMALA_SYSTEM_PROMPT},
                    {"role": "user", "content": f"భావాలమాల ఆధారాలు:\n\n{context}\n\nప్రశ్న: {question}"},
                ],
            },
            timeout=45,
        )
    except httpx.TimeoutException as e:
        raise AIServiceError(504, AI_SLOW_MSG, f"Groq timeout: {e}") from e
    except httpx.HTTPError as e:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, f"Groq network error: {e}") from e

    if response.status_code == 429:
        raise AIServiceError(429, AI_BUSY_MSG, "Groq rate limit")
    if response.status_code >= 400:
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, f"Groq HTTP {response.status_code}: {response.text[:300]}")

    choices = response.json().get("choices") or []
    answer = (choices[0].get("message", {}).get("content") if choices else "") or ""
    if not answer.strip():
        raise AIServiceError(502, AI_UNAVAILABLE_MSG, "Groq returned an empty answer.")
    return strip_markdown(answer)


def answer_bhavalamala(question: str, top_k: int) -> dict:
    """మొత్తం RAG pipeline — 1. embedding  2. search  3. హద్దు  4. Groq  5. జవాబు + మూలాలు."""
    records = search_bhavalamala(create_bhavalamala_embedding(question), top_k)
    relevant = [r for r in records if float(r["similarity"] or 0) >= BHAVALAMALA_MIN_SIMILARITY]

    best = max((float(r["similarity"]) for r in records), default=0)
    log(f"[Bhavalamala] mode={bhavalamala_embedding_mode()} top_k={top_k} found={len(records)} relevant={len(relevant)} best={best:.3f}")

    if not relevant:  # సంబంధం లేనివే వచ్చాయి — Groq ని పిలవకుండా నిజాయితీగా
        return {"success": True, "question": question, "answer": BHAVALAMALA_NOT_FOUND, "sources": []}

    answer = call_bhavalamala_groq(question, build_bhavalamala_context(relevant))
    return {
        "success": True,
        "question": question,
        "answer": answer,
        "sources": [
            {
                "id": r["id"],
                "title": r["title"] or "",
                "mala": r["mala"] or "",
                "link": r.get("link") or "",
                "similarity": round(float(r["similarity"]), 4),
            }
            for r in relevant
        ],
    }


# ═══════════════════════════════════════════════════════════════
# HANDLER
# ═══════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload, cache: str | None = None, extra_headers: dict | None = None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        if cache:
            self.send_header("Cache-Control", cache)
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _send_audio(self, audio_bytes: bytes, content_type: str, filename: str):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(audio_bytes)))
        self.end_headers()
        self.wfile.write(audio_bytes)

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        return json.loads(body) if body else {}

    def do_GET(self):
        # /api/aksharamala, /api/gita, ... → వాటి సొంత handler (api/_router.py)
        if delegate(self, "do_GET"):
            return

        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        try:
            if endpoint == "fonts":
                status, payload = handle_fonts()
                self._send_json(status, payload, cache=FONTS_CACHE_HEADER,
                                extra_headers={"X-Font-Count": str(len(payload))})
                return

            if endpoint == "activity_summary":
                status, payload = activity_summary(query, self.headers.get("X-Admin-Key", ""))
                self._send_json(status, payload)
                return

            if endpoint == "font_agent":
                status, payload = handle_font_agent(query)
                # పరికరం వెడల్పు ప్రకారం జవాబు మారుతుంది — URL ఒక్కో వెడల్పుకు వేరు, కాబట్టి cache సురక్షితం
                self._send_json(status, payload, cache=FONTS_CACHE_HEADER)
                return

            # ====================================================
            # POEMS
            # ====================================================
            # PostgreSQL:
            #   /api/main?endpoint=poems&poet_id=2
            #
            # Existing Markdown compatibility:
            #   /api/main?endpoint=poems&collection=Sumati
            #
            # If poet_id is supplied, PostgreSQL is used.
            # Otherwise the existing Markdown collection logic is preserved.

            if endpoint == "poems":
                poet_id_value = query.get("poet_id", [""])[0].strip()

                if poet_id_value:
                    try:
                        poet_id = int(poet_id_value)
                    except ValueError:
                        raise ValueError("poet_id must be a valid integer.")

                    if poet_id <= 0:
                        raise ValueError("poet_id must be greater than 0.")

                    poems = Poems.get(poet_id)

                    response = [
                        {
                            "poem_id": poem["poem_id"],
                            "title": poem["title"],
                            "content": poem["content"],
                            "special_line": poem["special_line"],
                            "poet_id": poem["poet_id"],
                            "poet_name": poem["poet_name"],
                        }
                        for poem in poems
                    ]

                    self._send_json(200, response)
                    return

                # Existing Markdown poems
                collection = query.get("collection", [""])[0]
                poems = get_poems(collection)

                self._send_json(200, {
                    "success": True,
                    "collection": collection,
                    "count": len(poems),
                    "poems": poems,
                })
                return

            if endpoint == "poems_all":
                self._send_json(200, Poems.get_all(), cache=POEMS_ALL_CACHE_HEADER)
                return

            if endpoint == "poem":
                collection = query.get("collection", [""])[0]
                filename = query.get("filename", [""])[0]
                poem = get_poem(collection, filename)
                self._send_json(200, {"success": True, "poem": poem})
                return

            self._send_json(400, {
                "error": "Missing or invalid ?endpoint= param."
            })

        except FileNotFoundError as e:
            self._send_json(404, {"success": False, "error": str(e)})
        except ValueError as e:
            self._send_json(400, {"success": False, "error": str(e)})
        except Exception as e:
            log(f"GET error ({endpoint}): {type(e).__name__}: {e}\n{traceback.format_exc()}")
            self._send_json(500, {"success": False, "error": "Failed to process request."})

    def do_POST(self):
        # /api/aksharamala, /api/rag_chat, ... → వాటి సొంత handler (api/_router.py)
        if delegate(self, "do_POST"):
            return

        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        # కార్యకలాపాల ఏజెంట్ — sendBeacon (text/plain) కూడా అంగీకరిస్తుంది
        if endpoint == "track":
            length = int(self.headers.get("Content-Length", 0) or 0)
            raw = self.rfile.read(min(length, 64_000)) if length > 0 else b""
            status, result = save_activity(raw)
            self._send_json(status, result)
            return

        try:
            payload = self._read_json_body()
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        if endpoint == "svara":
            text = (payload.get("text") or "").strip()
            voice_choice = payload.get("voice", "male")
            if not text:
                self._send_json(400, {"error": "Missing 'text' field."})
                return
            try:
                audio_bytes, content_type = handle_svara_tts(text, voice_choice)
                self._send_audio(audio_bytes, content_type, "svara_output.wav")
            except Exception as e:
                log(f"[Svara TTS] generation failed: {e}")
                self._send_json(502, {"error": f"Svara TTS generation failed: {e}"})

        elif endpoint == "tts":
            text = (payload.get("text") or "").strip()
            voice = payload.get("voice", "te-IN-ShrutiNeural")
            speed = payload.get("speed", 1.0)
            if not text:
                self._send_json(400, {"detail": "Missing 'text' field."})
                return
            try:
                audio_bytes, content_type, ext = handle_tts(text, voice, float(speed))
                stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                self._send_audio(audio_bytes, content_type, f"telugu_news_{stamp}.{ext}")
            except ValueError as e:
                self._send_json(400, {"detail": str(e)})
            except Exception as e:
                log(f"[News TTS] generation failed: {e}")
                self._send_json(502, {"detail": f"TTS generation failed: {e}"})

        elif endpoint == "extract-news":
            url = (payload.get("url") or "").strip()
            if not url:
                self._send_json(400, {"detail": "Missing 'url' field."})
                return
            try:
                text = handle_extract_news(url)
                self._send_json(200, {"text": text})
            except ValueError as e:
                self._send_json(422, {"detail": str(e)})
            except Exception as e:
                log(f"[extract-news] failed: {e}")
                self._send_json(400, {"detail": f"URL fetch failed: {e}"})

        elif endpoint == "bhavalamala-chat":
            # ============================================================
            # భావాలమాల AI — RAG (poem-ai లాగే రోజువారీ పరిమితి)
            # ============================================================
            question = payload.get("question")
            if not isinstance(question, str) or not question.strip():
                self._send_json(400, {"success": False, "error": "దయచేసి ఒక ప్రశ్న టైప్ చేయండి."})
                return
            question = question.strip()
            if len(question) > BHAVALAMALA_MAX_QUESTION_LENGTH:
                self._send_json(400, {"success": False, "error": "ప్రశ్న చాలా పొడవుగా ఉంది (గరిష్ఠం 1000 అక్షరాలు)."})
                return

            try:
                top_k = int(payload.get("top_k", BHAVALAMALA_DEFAULT_TOP_K))
            except (TypeError, ValueError):
                top_k = BHAVALAMALA_DEFAULT_TOP_K
            top_k = max(1, min(top_k, BHAVALAMALA_MAX_TOP_K))

            # Vercel లో BGE-M3 లేదు — పరిమితి లెక్కలోకి రాకుండా వెంటనే స్పష్టమైన జవాబు
            if not bhavalamala_available():
                self._send_json(503, {"success": False, "error": BHAVALAMALA_LOCAL_ONLY})
                return

            try:
                usage_id = reserve_api_call("bhavalamala-chat", "/api/main?endpoint=bhavalamala-chat", "POST", BHAVALAMALA_DAILY_LIMIT)
            except Exception as e:
                log(f"[Bhavalamala] usage log failed: {type(e).__name__}: {e}")
                self._send_json(503, {"success": False, "error": AI_UNAVAILABLE_MSG})
                return
            if usage_id is None:
                self._send_json(429, {"success": False, "error": "ఈరోజు భావాలమాల AI పరిమితి (100 ప్రశ్నలు) పూర్తయింది. రేపు మళ్ళీ ప్రయత్నించండి."})
                return

            try:
                result = answer_bhavalamala(question, top_k)
                safe_update_api_log(usage_id, 200)
                self._send_json(200, result)
            except AIServiceError as e:
                log(f"[Bhavalamala] AI error ({e.status}): {e}")
                safe_update_api_log(usage_id, e.status)
                self._send_json(e.status, {"success": False, "error": e.message})
            except Exception as e:
                log(f"[Bhavalamala] RAG error: {type(e).__name__}: {e}\n{traceback.format_exc()}")
                safe_update_api_log(usage_id, 500)
                self._send_json(500, {"success": False, "error": "భావాలమాల AI సమాధానం ఇవ్వలేకపోయింది. మళ్ళీ ప్రయత్నించండి."})

        elif endpoint == "poem-ai":
            # ============================================================
            # POEM AI API USAGE LIMIT
            # ============================================================
            # Every POST /api/main?endpoint=poem-ai request is counted.
            # The limit is application-wide: no user_id is required.
            # Maximum allowed calls per day = 100.
            #
            # The usage record is inserted BEFORE calling the BAML client.
            # This means failed requests also count toward the daily limit.
            # ============================================================
            api_name = "poem-ai"
            api_endpoint = "/api/main?endpoint=poem-ai"

            # Neon లేకపోయినా / నిద్రలో ఉన్నా — request వేలాడకుండా స్పష్టమైన జవాబు
            try:
                usage_id = reserve_api_call(api_name, api_endpoint, "POST", 100)
            except Exception as e:
                log(f"poem-ai usage log failed: {type(e).__name__}: {e}")
                self._send_json(503, {"success": False, "error": AI_UNAVAILABLE_MSG})
                return

            if usage_id is None:
                self._send_json(429, {
                    "success": False,
                    "error": "Daily AI API limit of 100 calls has been reached. Please try again tomorrow."
                })
                return

            collection = (payload.get("collection") or "").strip()
            filename = (payload.get("filename") or "").strip()
            title = (payload.get("title") or "").strip()
            content = payload.get("content") or ""
            question = (payload.get("question") or "").strip()

            # .md poems are found by collection + filename;
            # database poems (no file) are found by title.
            if not (collection and filename) and not title:
                safe_update_api_log(usage_id, 400)
                self._send_json(400, {
                    "success": False,
                    "error": "Send 'collection' + 'filename', or 'title'.",
                })
                return

            if not question:
                safe_update_api_log(usage_id, 400)
                self._send_json(400, {
                    "success": False,
                    "error": "Missing 'question'."
                })
                return

            try:
                result = asyncio.run(
                    explain_poem(collection, filename, question, title, content)
                )

                # Record successful API completion in Neon.
                safe_update_api_log(usage_id, 200)

                self._send_json(200, result)

            except FileNotFoundError as e:
                safe_update_api_log(usage_id, 404)
                self._send_json(404, {
                    "success": False,
                    "error": str(e)
                })

            except ValueError as e:
                safe_update_api_log(usage_id, 400)
                self._send_json(400, {
                    "success": False,
                    "error": str(e)
                })

            except AIServiceError as e:
                # Friendly message goes to the frontend.
                # Technical error is written to the server log.
                log(f"poem-ai AI error ({e.status}): {e}")
                safe_update_api_log(usage_id, e.status)
                self._send_json(e.status, {
                    "success": False,
                    "error": e.message
                })

            except httpx.HTTPStatusError as e:
                log(f"poem-ai provider HTTP error: {e.response.status_code}")
                safe_update_api_log(usage_id, 502)
                self._send_json(502, {
                    "success": False,
                    "error": AI_UNAVAILABLE_MSG
                })

            except Exception as e:
                log(
                    f"poem-ai error: {type(e).__name__}: {e}\n"
                    f"{traceback.format_exc()}"
                )
                safe_update_api_log(usage_id, 500)
                self._send_json(500, {
                    "success": False,
                    "error": "Failed to process AI request."
                })

        else:
            self._send_json(400, {
                "error": "Missing or invalid ?endpoint= param."
            })

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ═══════════════════════════════════════════════════════════════
# API USAGE LOGGING / DAILY LIMIT
# ═══════════════════════════════════════════════════════════════

def reserve_api_call(
    api_name: str,
    endpoint: str,
    http_method: str,
    daily_limit: int = 100
) -> int | None:
    """
    Reserve one API call in Neon.

    Returns:
        usage_id -> call is allowed and has been logged.
        None     -> daily limit has already been reached.

    An advisory transaction lock is used so two simultaneous requests
    cannot both pass the 100-call check at the same time.
    """

    if not RATNALABALA_DATABASE_URL:
        raise RuntimeError("NEON_DATABASE_URL is not configured.")

    with psycopg.connect(RATNALABALA_DATABASE_URL) as conn:
        with conn.cursor() as cursor:

            # Prevent concurrent requests from bypassing the daily limit.
            # The lock exists only for this database transaction.
            cursor.execute(
                "SELECT pg_advisory_xact_lock(hashtext(%s));",
                (api_name,)
            )

            # Count today's API calls.
            # Every reserved request counts, including failed requests.
            cursor.execute(
                """
                SELECT COUNT(*) AS usage_count
                FROM api_usage_log
                WHERE api_name = %s
                  AND request_date = CURRENT_DATE;
                """,
                (api_name,)
            )

            row = cursor.fetchone()
            usage_count = row[0]

            # Stop the API after the daily limit.
            if usage_count >= daily_limit:
                return None

            # Insert the API call BEFORE the actual AI request.
            # status_code is NULL until the request finishes.
            cursor.execute(
                """
                INSERT INTO api_usage_log (
                    api_name,
                    endpoint,
                    http_method,
                    event_type,
                    status_code,
                    success
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    'API_CALL',
                    NULL,
                    FALSE
                )
                RETURNING usage_id;
                """,
                (
                    api_name,
                    endpoint,
                    http_method
                )
            )

            usage_id = cursor.fetchone()[0]

            return usage_id


def update_api_log(
    usage_id: int,
    status_code: int
):
    """
    Update the reserved API log after the request finishes.
    """

    success = 200 <= status_code < 400

    with psycopg.connect(RATNALABALA_DATABASE_URL) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE api_usage_log
                SET
                    status_code = %s,
                    success = %s
                WHERE usage_id = %s;
                """,
                (
                    status_code,
                    success,
                    usage_id
                )
            )


def safe_update_api_log(usage_id: int, status_code: int):
    """A logging failure must never stop the real answer reaching the person."""
    try:
        update_api_log(usage_id, status_code)
    except Exception as e:
        log(f"api_usage_log update failed (usage_id={usage_id}): {type(e).__name__}: {e}")


# ── Local-only test runner ──
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8004
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/main?endpoint=fonts")
    print(f"Try: http://localhost:{port}/api/main?endpoint=font_agent&content_type=sloka&width=390")
    # PostgreSQL-backed generic poems endpoint
    print(f"Try: http://localhost:{port}/api/main?endpoint=poems&poet_id=1")

    # Existing Markdown-based poems endpoint (backward compatible)
    print(f"Try: http://localhost:{port}/api/main?endpoint=poems&collection=Sumati")
    print(f"Try: http://localhost:{port}/api/main?endpoint=poem&collection=Sumati&filename=001.md")

    # Merged endpoints (served through api/_router.py)
    print(f"Try: http://localhost:{port}/api/aksharamala?search=&type=all&page=1&page_size=4")
    print(f"Try: http://localhost:{port}/api/gita")
    print(f"POST http://localhost:{port}/api/main?endpoint=track        body: {{\"session_id\": \"abc12345\", \"events\": [{{\"name\": \"page_view\", \"path\": \"/aksharamala\"}}]}}")
    print(f"GET  http://localhost:{port}/api/main?endpoint=activity_summary&days=7   header: X-Admin-Key")
    print(f"POST http://localhost:{port}/api/main?endpoint=bhavalamala-chat  body: {{\"question\": \"అసహనం గురించి ఏమి చెప్పారు?\", \"top_k\": 5}}")

    print(f"POST http://localhost:{port}/api/main?endpoint=svara        body: {{\"text\": \"...\", \"voice\": \"male\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=tts          body: {{\"text\": \"...\", \"voice\": \"te-IN-ShrutiNeural\", \"speed\": 1.0}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=extract-news body: {{\"url\": \"https://...\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=poem-ai      body: {{\"collection\": \"Sumati\", \"filename\": \"001.md\", \"question\": \"...\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=poem-ai      body: {{\"title\": \"గర్వం\", \"content\": \"...\", \"question\": \"...\"}}   (database poem)")
    HTTPServer(("localhost", port), handler).serve_forever()