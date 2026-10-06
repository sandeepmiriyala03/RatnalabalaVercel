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
from urllib.parse import parse_qs, quote, urlparse
from urllib.parse import unquote as urllib_unquote
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
# వైవిధ్యం: ముందు ఇన్ని దగ్గరివి తెచ్చి, ఒక్కో మాల నుండి గరిష్ఠం ఇన్ని ఎంచుకోవడం
# (పొడవైన పద్యాలే top 5 ని ఆక్రమించకుండా — సామెతలు, గీత, కథలు కూడా రావాలి)
BHAVALAMALA_CANDIDATES = 40
BHAVALAMALA_MAX_PER_MALA = 2

# ── WebMCP శోధన (bhavalamala-search) — AI జవాబు లేకుండా, వెతకడం మాత్రమే ──
# Groq లేదు కాబట్టి chat (100) కంటే ఎక్కువ; embedding సేవకు రోజువారీ రక్షణ
BHAVALAMALA_SEARCH_DAILY_LIMIT = int(os.environ.get("BHAVALAMALA_SEARCH_DAILY_LIMIT", "300"))
# ఒకే ప్రశ్నకు ఫలితాలు database మారే వరకు మారవు: Vercel CDN దగ్గర 1 రోజు
BHAVALAMALA_SEARCH_CACHE_HEADER = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
BHAVALAMALA_SNIPPET_CHARS = 280

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

# ── Font files (public/Fonts/) ─────────────────────────────────────
# ఈ ఒక్క జాబితా నుండే బ్రౌజర్ ఫాంట్‌ను లోడ్ చేస్తుంది (globals.css / ఏ
# ఇతర ఫైల్‌లోనూ ఫాంట్లు లేవు). ఎంచుకున్న ఫాంట్ మాత్రమే డౌన్‌లోడ్ అవుతుంది.
#   value: (files, weight, italic)   — files: ఒకటి లేదా రెండు ఫార్మాట్లు
# కొత్త ఫాంట్: ఫైల్‌ను public/Fonts/ లో పెట్టి, FONT_CATALOG లో ఒక లైన్,
# ఇక్కడ ఒక లైన్ జోడించండి. అంతే.
FONT_FILES: dict[str, tuple[tuple[str, ...], int, bool]] = {
    "Gurajada": (("Gurajada-Regular.ttf",), 400, False),
    "NTR": (("NTR-Regular.ttf",), 400, False),
    "Ramaneeya": (("RamaneeyaWin.ttf",), 400, False),
    "Veturi": (("Veturi.ttf",), 400, False),
    "Sirivennela": (("Sirivennela.ttf",), 400, False),
    "Chathura-Thin": (("Chathura-Thin.ttf",), 200, False),
    "Chathura-Light": (("Chathura-Light.ttf",), 300, False),
    "Chathura-Regular": (("Chathura-Regular.ttf",), 400, False),
    "Chathura-Bold": (("Chathura-Bold.ttf",), 700, False),
    "Chathura-ExtraBold": (("Chathura-ExtraBold.ttf",), 800, False),
    "Ramaraja": (("Ramaraja-Regular.ttf",), 400, False),
    "RaviPrakash": (("RaviPrakash.ttf",), 400, False),
    "TenaliRamakrishna": (("TenaliRamakrishna-Regular.ttf",), 400, False),
    "Timmana": (("TimmanaRegular.ttf",), 400, False),
    "TANA": (("TANA.ttf",), 400, False),
    "Gidugu": (("Gidugu.otf",), 400, False),
    "Gidugu-Italic": (("Gidugu-Italic.otf",), 400, True),
    "LakkiReddy": (("LakkiReddy.ttf",), 400, False),
    "Nandakam": (("Nandakam.otf",), 400, False),
    "Nandakam-Italic": (("Nandakam-Italic.otf",), 400, True),
    "Peddana": (("Peddana-Regular.ttf",), 400, False),
    "Purushothamaa": (("Purushothamaa.otf",), 400, False),
    "Purushothamaa-Italic": (("Purushothamaa-Italic.otf",), 400, True),
    "Ramabhadra": (("Ramabhadra.otf",), 400, False),
    "Ramabhadra-Italic": (("Ramabhadra-Italic.otf",), 400, True),
    "SreeKrushnadevaraya": (("Sree Krushnadevaraya.otf",), 400, False),
    "SreeKrushnadevaraya-Italic": (("Sree Krushnadevaraya-Italic.otf",), 400, True),
    "Suranna-Regular": (("Suranna Regular.otf",), 400, False),
    "Suranna-Bold": (("Suranna Bold.otf",), 700, False),
    "Suranna-Italic": (("Suranna-Italic.otf",), 400, True),
    "Suranna-BoldItalic": (("Suranna Bold Italic.otf",), 700, True),
    "Suravaram": (("Suravaram.otf",), 400, False),
    "Suravaram-Italic": (("Suravaram-Italic.otf",), 400, True),
    "Ponnala-Regular": (("Ponnala-Regular.ttf",), 400, False),
    "Annamayya": (("Annamayya.otf",), 400, False),
    "Annamayya-Bold": (("AnnamayyaBold.otf",), 700, False),
    "Annamayya-Italic": (("AnnamayyaItalic.otf",), 400, True),
    "Annamayya-BoldItalic": (("AnnamayyaBoldItalic.otf",), 700, True),
    "Dhurjati": (("Dhurjati.otf",), 400, False),
    "Dhurjati-Italic": (("Dhurjati-Italic.otf",), 400, True),
    "JIMS": (("JIMS.otf",), 400, False),
    "JIMS-Italic": (("JIMSItalic.otf",), 400, True),
    "KanakaDurga": (("KanakaDurga.otf",), 400, False),
    "KanakaDurga-Italic": (("KanakaDurga-Italic.otf",), 400, True),
    "Mandali-Regular": (("Mandali-Regular.otf",), 400, False),
    "Mandali-Bold": (("Mandali-Bold.otf",), 700, False),
    "Mandali-Italic": (("Mandali-Italic.otf",), 400, True),
    "Mandali-BoldItalic": (("Mandali-Bold Italic.otf",), 700, True),
    "PottiSreeramulu": (("Potti Sreeramulu.otf",), 400, False),
    "TiroSundaraTelugu-Regular": (("TiroSundaraTelugu-Regular.ttf",), 400, False),
    "NATS": (("NATS.otf",), 400, False),
    "NATS-Italic": (("NATS-Italic.otf",), 400, True),
    "BVSatyamurty": (("BVSatyamurty.otf", "BVSatyamurty.ttf"), 400, False),
    "Mallanna": (("Mallanna.otf",), 400, False),
    "Mallanna-Italic": (("Mallanna-Italic.otf",), 400, True),
    "PVNR": (("PVNR.otf",), 400, False),
    "SeelaVeerraju": (("SeelaVeerraju.otf", "SeelaVeerraju.ttf"), 400, False),
    "SPBalasubrahmanyam": (("SPBalasubrahmanyam.otf", "SPBalasubrahmanyam.ttf"), 400, False),
    "Syamala Ramana": (("Syamala Ramana.otf",), 400, False),
}

# ప్రత్యేక OpenType సెట్టింగ్‌లు (అరుదు)
FONT_FEATURES = {"SPBalasubrahmanyam": '"liga" 1, "calt" 1'}

_FONT_FORMATS = {"otf": "opentype", "ttf": "truetype", "woff": "woff", "woff2": "woff2"}

# Startup check: a catalog font without a file would silently never load
_missing_files = FONT_VALUES - set(FONT_FILES)
if _missing_files:
    print(f"[Ratnalabala] fonts without files in FONT_FILES: {sorted(_missing_files)}")


def _font_id(value: str) -> str:
    """'Mandali-Regular' → 'mandali-regular' (stable id for saved choices)."""
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def font_payload(f: dict) -> dict:
    """One font as the browser needs it: name + where its file is."""
    files, weight, italic = FONT_FILES.get(f["value"], ((), 400, False))
    payload = {
        "id": _font_id(f["value"]),
        "label": f["label"],
        "value": f["value"],
        "src": [
            {
                # ఖాళీలు ఉన్న ఫైల్ పేర్లు (%20) ఏ server/CDN లోనైనా పనిచేస్తాయి
                "url": "/Fonts/" + "/".join(quote(part) for part in name.split("/")),
                "format": _FONT_FORMATS.get(name.rsplit(".", 1)[-1].lower(), "truetype"),
            }
            for name in files
        ],
        "weight": weight,
        "style": "italic" if italic else "normal",
    }
    if f["value"] in FONT_FEATURES:
        payload["features"] = FONT_FEATURES[f["value"]]
    return payload

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
    # New dicts, so no request can ever change the shared list
    return 200, [font_payload(f) for f in FONT_CATALOG]


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
    ordered += [f for f in FONT_CATALOG if f["value"] not in recommended]
    ordered = [font_payload(f) for f in ordered]

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

    def __init__(self, status: int, message: str, detail: str = "", reason: str = ""):
        super().__init__(detail or message)
        self.status = status
        self.message = message
        self.reason = reason          # యంత్రం చదివే కారణం (pypdf_missing, db_failed …) — రహస్యాలు ఉండవు


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


def call_bhavalamala_groq(
    question: str,
    context: str,
    system_prompt: str | None = None,
    context_label: str = "భావాలమాల ఆధారాలు",
) -> str:
    """Groq (OpenAI-compatible) — ఆధారాలకే పరిమితమైన జవాబు.
    PDF ప్రశ్నోత్తరి కూడా ఇదే వాడుతుంది (వేరే system prompt తో)."""
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
                    {"role": "system", "content": system_prompt or BHAVALAMALA_SYSTEM_PROMPT},
                    {"role": "user", "content": f"{context_label}:\n\n{context}\n\nప్రశ్న: {question}"},
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


def diversify_by_mala(records: list[dict], top_k: int) -> list[dict]:
    """similarity క్రమంలోనే, ఒక్కో మాల నుండి గరిష్ఠం BHAVALAMALA_MAX_PER_MALA.
    స్థలం మిగిలితే మిగతా దగ్గరివాటితో నింపడం."""
    picked, counts, leftovers = [], {}, []
    for r in records:
        mala = r.get("mala") or ""
        if counts.get(mala, 0) < BHAVALAMALA_MAX_PER_MALA:
            picked.append(r)
            counts[mala] = counts.get(mala, 0) + 1
        else:
            leftovers.append(r)
        if len(picked) == top_k:
            break
    picked += leftovers[: max(0, top_k - len(picked))]
    return sorted(picked, key=lambda r: float(r["similarity"]), reverse=True)


def answer_bhavalamala(question: str, top_k: int) -> dict:
    """మొత్తం RAG pipeline — 1. embedding  2. search  3. హద్దు  4. వైవిధ్యం  5. Groq  6. జవాబు + మూలాలు."""
    candidates = search_bhavalamala(create_bhavalamala_embedding(question), max(top_k, BHAVALAMALA_CANDIDATES))
    records = candidates
    above = [r for r in candidates if float(r["similarity"] or 0) >= BHAVALAMALA_MIN_SIMILARITY]
    relevant = diversify_by_mala(above, top_k)

    best = max((float(r["similarity"]) for r in records), default=0)
    malas = sorted({r.get("mala") or "" for r in relevant})
    log(f"[Bhavalamala] mode={bhavalamala_embedding_mode()} top_k={top_k} candidates={len(records)} above={len(above)} picked={len(relevant)} best={best:.3f} malas={malas}")

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
# WebMCP శోధన — ప్రశ్న → BGE-M3 → pgvector (Groq లేదు)
# ═══════════════════════════════════════════════════════════════
#   GET /api/main?endpoint=bhavalamala-search&query=కోపం&top_k=5
#   (next.config.ts rewrite వల్ల:  GET /api/search?query=కోపం)
#
# భావాలమాల AI లాగే వెతుకుతుంది, కానీ AI జవాబు రాయదు. కాబట్టి వేగంగా,
# Groq ఖర్చు లేకుండా, CDN cache తో. పిలిచిన AI ఏజెంట్ ఈ ఫలితాలు చదివి
# తానే జవాబు రాస్తుంది — అదే WebMCP పద్ధతి.

def _snippet(text: str, limit: int = BHAVALAMALA_SNIPPET_CHARS) -> str:
    text = (text or "").strip()
    return text if len(text) <= limit else text[:limit].rstrip() + "…"


def search_bhavalamala_only(query_text: str, top_k: int) -> dict:
    """RAG లోని retrieval భాగం మాత్రమే — embedding, search, హద్దు, వైవిధ్యం."""
    candidates = search_bhavalamala(
        create_bhavalamala_embedding(query_text),
        max(top_k, BHAVALAMALA_CANDIDATES),
    )
    above = [r for r in candidates if float(r["similarity"] or 0) >= BHAVALAMALA_MIN_SIMILARITY]
    picked = diversify_by_mala(above, top_k)

    best = max((float(r["similarity"]) for r in candidates), default=0)
    log(f"[Bhavalamala search] top_k={top_k} candidates={len(candidates)} above={len(above)} picked={len(picked)} best={best:.3f}")

    return {
        "success": True,
        "query": query_text,
        "count": len(picked),
        "results": [
            {
                "id": r["id"],
                "title": r.get("title") or "",
                "mala": r.get("mala") or "",
                "link": r.get("link") or "",
                "snippet": _snippet(r.get("content") or r.get("details") or ""),
                "source": r.get("source") or "",
                "similarity": round(float(r["similarity"]), 4),
            }
            for r in picked
        ],
    }


# ═══════════════════════════════════════════════════════════════
# PDF ప్రశ్నోత్తరి — సొంత logic తో private RAG (బయటి AI మోడల్ లేదు)
#
#   1. తనిఖీ  : తెలుగు, టైప్ చేసిన, మంచి నాణ్యత PDF మాత్రమే
#   2. ముక్కలు : వాక్యాల సరిహద్దుల్లో ~700 అక్షరాలు, 120 overlap, పేజీ దాటదు
#   3. Vector : మన సొంత "అక్షర n-gram TF-IDF" → 2048 కొలతల sparse vector
#   4. నిల్వ   : Neon pgvector (sparsevec) — 24 గంటల తర్వాత తొలగింపు
#   5. వెతకడం : ప్రశ్న vector ↔ ముక్కల vectors, cosine score
#   6. జవాబు  : PDF లోని అసలు వాక్యాలే (extractive) + పేజీ సంఖ్య
#
#   ఏ బయటి సేవా పిలవదు (Groq / OpenAI / Hugging Face / DeepInfra లేవు).
#   PDF పాఠ్యం ఈ function, మీ Neon డేటాబేస్ దాటి ఎక్కడికీ వెళ్ళదు.
#
#   POST /api/main?endpoint=pdf-upload   body: PDF bytes, header X-Filename
#   POST /api/main?endpoint=pdf-ask      {"doc_id": "...", "question": "..."}
#   POST /api/main?endpoint=pdf-delete   {"doc_id": "..."}
# ═══════════════════════════════════════════════════════════════

import math
import uuid
import unicodedata
import zlib
from collections import Counter

# ---------- నియమాల సంఖ్యలు (environment తో మార్చుకోవచ్చు) ----------
PDF_MAX_BYTES = 4 * 1024 * 1024                                          # Vercel request ~4.5 MB
PDF_MAX_PAGES = int(os.environ.get("PDF_RAG_MAX_PAGES", "120"))
PDF_MAX_CHUNKS = int(os.environ.get("PDF_RAG_MAX_CHUNKS", "500"))
PDF_MIN_TELUGU_PERCENT = int(os.environ.get("PDF_RAG_MIN_TELUGU", "40"))          # దీని లోపు → తెలుగు PDF కాదు
PDF_MAX_IMAGE_PAGE_PERCENT = int(os.environ.get("PDF_RAG_MAX_IMAGE_PAGES", "10"))  # పాఠ్యం లేని పేజీలు
PDF_MIN_QUALITY = int(os.environ.get("PDF_RAG_MIN_QUALITY", "95"))                # అక్షరాల నాణ్యత %
PDF_MIN_PAGE_CHARS = 30                 # దీని లోపు అక్షరాలు ఉన్న పేజీ = image / ఖాళీ పేజీ
PDF_CHUNK_CHARS = 700
PDF_CHUNK_OVERLAP = 120
PDF_TOP_K = 5
PDF_MIN_SCORE = float(os.environ.get("PDF_RAG_MIN_SCORE", "0.08"))   # cosine హద్దు (పరీక్ష: సంబంధం ఉన్నవి 0.11+, లేనివి ≤0.05)
PDF_SENTENCE_RATIO = 0.3                # జవాబు వాక్యం ఉత్తమ వాక్యం score లో కనీసం 30%
PDF_ANSWER_SENTENCES = 3
PDF_KEEP_HOURS = 24
PDF_UPLOAD_DAILY_LIMIT = int(os.environ.get("PDF_RAG_UPLOAD_LIMIT", "30"))
PDF_ASK_DAILY_LIMIT = int(os.environ.get("PDF_RAG_ASK_LIMIT", "300"))

PDF_RAG_VERSION = "own-ngram-v2"        # pdf-health లో కనిపిస్తుంది — ఏ main.py deploy అయిందో తెలుస్తుంది
VEC_DIM = 2048                          # vector కొలతలు
NGRAM_SIZES = (3, 4)                    # అక్షర ముక్కల పొడవులు

PDF_NOT_FOUND = "క్షమించండి, ఈ ప్రశ్నకు మీ PDF లో సంబంధిత విషయం కనిపించలేదు. PDF లోని పదాలతో అడిగి చూడండి."

# ప్రశ్నలో మాత్రమే వచ్చే పదాలు — వెతకడానికి పనికిరావు, వదిలేస్తాం
QUESTION_STOPWORDS = {
    "ఏమి", "ఏమిటి", "ఏం", "ఏది", "ఏవి", "ఎవరు", "ఎవరి", "ఎక్కడ", "ఎప్పుడు", "ఎందుకు", "ఎలా", "ఎన్ని", "ఎంత",
    "గురించి", "చెప్పారు", "చెప్పండి", "చెప్పు", "వివరించండి", "వివరించు", "తెలుపండి", "ఉంది", "ఉన్నాయి",
    "ఈ", "ఆ", "లో", "కి", "కు", "అని", "మరియు", "పుస్తకం", "పుస్తకంలో", "పుస్తకము", "pdf", "లో?",
}

_TELUGU_RE = re.compile(r"[ఀ-౿]")
_LEGACY_RE = re.compile(r"[À-ɏ]")    # పాత (Unicode కాని) తెలుగు ఫాంట్ల గుర్తు
# గుణింతం / ఒత్తు గుర్తులు — ఇవి పదం మొదట్లో రాకూడదు (వస్తే అక్షరం విరిగినట్టు)
_DEPENDENT_SIGNS = "ఀఁంఃఄ఼ాిీుూృౄెేైొోౌ్ౕౖౢౣ"
_BROKEN_START_RE = re.compile(rf"(?:^|(?<=[^ఀ-౿‌‍]))[{_DEPENDENT_SIGNS}]")

# PDF తయారీదారులు ఒత్తుల దగ్గర పెట్టే చెత్త గుర్తులు: "బద్దె1న", "శ్రీ]రాముడు"
_STRAY_IN_WORD_RE = re.compile(
    r"(?<=[ఀ-౿])[^ఀ-౿\s‌‍.,;:'\"()\-–—।॥]{1,2}(?=[ఀ-౿])"      # ? ! పదం మధ్యలో = చెత్త
)
# "బ్రాD హ్మణుడు", "శత్రుR వు" — తెలుగు మధ్యలో ఒక్క ఇంగ్లీష్ అక్షరం + ఖాళీ = విరిగిన పదం, అతికిస్తాం.
# ("కాబట్టి+ ఇటాలియన్" లో + తర్వాత ఖాళీ నిజమైనది — అది _STRAY_END_RE తీసేస్తుంది, ఖాళీ ఉంటుంది)
_STRAY_SPACE_RE = re.compile(r"(?<=[ఀ-౿])(?:[A-Za-z]|[\x00-\x08\x0b-\x1f\x7f]) (?=[ఀ-౿])")
_STRAY_END_RE = re.compile(r"(?<=[ఀ-౿])(?:[+\[\]{}|~^`\\#@$%&*=<>]+|[A-Za-z](?![A-Za-z]))(?=[\s.,!?;:)]|$)")
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b-\x1f\x7f]")
_SENTENCE_END_RE = re.compile(r"(?<=[.?!।॥])\s+|\n+")
_WORD_RE = re.compile(r"[ఀ-౿‌‍]+|[A-Za-z]+|[0-9]+")


class PdfRuleError(ValueError):
    """వ్యాపార నియమం ఉల్లంఘన — పాఠకుడికి చూపించే సందేశం + ఏ నియమమో (rule)."""

    def __init__(self, rule: str, message: str):
        super().__init__(message)
        self.rule = rule


# ═══════════ 1. PDF → పాఠ్యం ═══════════

def _clean_text(text: str) -> tuple[str, int]:
    """శుభ్రం చేసిన పాఠ్యం + తీసేసిన చెత్త గుర్తుల సంఖ్య (నాణ్యత లెక్కకు)."""
    text = unicodedata.normalize("NFC", text or "")
    stray = (len(_CONTROL_RE.findall(text)) + len(_STRAY_SPACE_RE.findall(text))
             + len(_STRAY_IN_WORD_RE.findall(text)) + len(_STRAY_END_RE.findall(text)))
    text = _STRAY_SPACE_RE.sub("", text)        # ముందు: "శత్రు\x1b వు" → "శత్రువు"
    text = _CONTROL_RE.sub("", text)
    text = _STRAY_IN_WORD_RE.sub("", text)
    text = _STRAY_END_RE.sub("", text)
    text = text.replace("­", "")
    text = re.sub(r"[ \t ]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip(), stray


# ---------- PDF లోని అనవసర భాగాలు ----------
_INVISIBLE_TEXT_RE = re.compile(rb"(?<![\d.])3\s+Tr\b")      # OCR పొర: కనిపించని పాఠ్యం (render mode 3)
_PAGE_NO_LINE_RE = re.compile(
    r"^[\s\-–—|•.()\[\]]*(?:పేజీ|పుట|page|p\.)?\s*[0-9౦-౯]{1,4}\s*(?:/\s*[0-9౦-౯]{1,4})?[\s\-–—|•.()\[\]]*$", re.I
)
_LEADER_RE = re.compile(r"[.·…_\-–—=*]{5,}")                   # విషయసూచిక చుక్కలు "అధ్యాయం ....... 12"
_HAS_LETTER_RE = re.compile(r"[ఀ-౿A-Za-z]")


def _page_images(page) -> list[tuple[int, int]]:
    """పేజీలోని చిత్రాల పరిమాణాలు (pixels) — చిత్రాన్ని decode చేయం, వేగంగా ఉంటుంది."""
    found: list[tuple[int, int]] = []

    def walk(resources, depth: int):
        if depth > 3 or not resources:
            return
        resources = resources.get_object()
        xobjects = resources.get("/XObject")
        if not xobjects:
            return
        xobjects = xobjects.get_object()
        for name in list(xobjects.keys())[:200]:
            obj = xobjects[name].get_object()
            subtype = obj.get("/Subtype")
            if subtype == "/Image":
                found.append((int(obj.get("/Width", 0) or 0), int(obj.get("/Height", 0) or 0)))
            elif subtype == "/Form":                          # చిత్రం ఒక గుంపులో దాగి ఉండవచ్చు
                walk(obj.get("/Resources"), depth + 1)

    try:
        walk(page.get("/Resources"), 0)
    except Exception as e:
        log(f"[PDF RAG] image scan failed: {type(e).__name__}: {e}")
    return found


def _is_full_page(img: tuple[int, int], page) -> bool:
    """చిత్రం పేజీ అంత పెద్దదా? (scan పేజీ గుర్తు) — పేజీ నిష్పత్తి సరిపోయి, 1000px పైన."""
    w, h = img
    if max(w, h) < 1000 or not w or not h:
        return False
    try:
        pw, ph = float(page.mediabox.width), float(page.mediabox.height)
        if int(page.get("/Rotate", 0) or 0) % 180:
            pw, ph = ph, pw
    except Exception:
        return False
    return abs((w / h) - (pw / ph)) / (pw / ph) < 0.12


def _has_invisible_text(page) -> bool:
    try:
        contents = page.get_contents()
        return contents is not None and bool(_INVISIBLE_TEXT_RE.search(contents.get_data()[:2_000_000]))
    except Exception:
        return False


def _page_has_js(page) -> bool:
    try:
        if "/AA" in page:
            return True
        for annot in (page.get("/Annots") or [])[:300]:
            a = annot.get_object()
            action = a.get("/A")
            if action and action.get_object().get("/S") == "/JavaScript":
                return True
    except Exception:
        pass
    return False


def _page_has_attachment(page) -> bool:
    try:
        return any(a.get_object().get("/Subtype") == "/FileAttachment" for a in (page.get("/Annots") or [])[:300])
    except Exception:
        return False


def _inspect_document(reader) -> dict:
    """పత్రం స్థాయి: JavaScript, జతపరిచిన ఫైళ్ళు, forms, portfolio."""
    info = {"javascript": False, "attachments": 0, "form_fields": 0, "portfolio": False}
    try:
        root = reader.trailer["/Root"].get_object()
        names = root.get("/Names")
        names = names.get_object() if names else {}
        open_action = root.get("/OpenAction")
        open_action = open_action.get_object() if open_action is not None else None
        info["javascript"] = (
            "/JavaScript" in names
            or "/AA" in root
            or (hasattr(open_action, "get") and open_action.get("/S") == "/JavaScript")
        )
        info["portfolio"] = "/Collection" in root
        if "/EmbeddedFiles" in names:
            try:
                info["attachments"] = len(reader.attachments)
            except Exception:
                info["attachments"] = 1
        acro = root.get("/AcroForm")
        if acro:
            acro = acro.get_object()
            info["form_fields"] = len(acro.get("/Fields") or []) + (1 if "/XFA" in acro else 0)
    except Exception as e:
        log(f"[PDF RAG] document inspect failed: {type(e).__name__}: {e}")
    return info


def _strip_noise_lines(text: str) -> tuple[str, dict]:
    """పేజీ సంఖ్యల వరుసలు, గుర్తులు మాత్రమే ఉన్న వరుసలు, విషయసూచిక చుక్కలు తీసేస్తాం."""
    kept, removed = [], {"page_numbers": 0, "symbol_lines": 0}
    for line in text.split("\n"):
        line = _LEADER_RE.sub(" ", line).strip()
        if not line:
            kept.append("")
        elif _PAGE_NO_LINE_RE.match(line):
            removed["page_numbers"] += 1
        elif not _HAS_LETTER_RE.search(line):
            removed["symbol_lines"] += 1                     # "* * *", "❖❖❖", "12 34"
        else:
            kept.append(line)
    return "\n".join(kept).strip(), removed


def _remove_headers_footers(pages: list[tuple[int, str]]) -> tuple[list[tuple[int, str]], int, list[str]]:
    """ప్రతి పేజీ పైన / కింద మళ్ళీ మళ్ళీ వచ్చే వరుసలు (పుస్తకం పేరు, అధ్యాయం పేరు) తీసేస్తాం.
    నియమం: మొదటి 2 / చివరి 2 వరుసల్లో, సగం పైగా పేజీల్లో (కనీసం 3) ఒకేలా ఉంటే."""
    def key(line: str) -> str:
        return re.sub(r"[0-9౦-౯]+", "#", line.strip())

    def edges(lines: list[str]) -> list[int]:
        idx = [i for i, ln in enumerate(lines) if ln.strip()]
        return sorted(set(idx[:2] + idx[-2:]))

    text_pages = [(n, t.split("\n")) for n, t in pages if t]
    counts: Counter = Counter()
    for _, lines in text_pages:
        counts.update({key(lines[i]) for i in edges(lines) if len(lines[i]) <= 120})
    need = max(3, (len(text_pages) + 1) // 2)
    repeated = {k for k, c in counts.items() if c >= need}
    if not repeated:
        return pages, 0, []

    removed, out = 0, []
    for n, t in pages:
        lines = t.split("\n") if t else []
        drop = {i for i in edges(lines) if key(lines[i]) in repeated}
        removed += len(drop)
        out.append((n, "\n".join(ln for i, ln in enumerate(lines) if i not in drop).strip()))
    return out, removed, sorted(repeated, key=lambda k: -counts[k])[:3]


def extract_pdf_pages(data: bytes) -> dict:
    """పేజీ వారీగా పాఠ్యం + PDF లో ఏమేమి ఉన్నాయో నివేదిక. చిత్రాలు చదవం, లెక్కిస్తాం."""
    try:
        from pypdf import PdfReader
    except ImportError as e:
        raise AIServiceError(
            503, "PDF సేవ ఇప్పుడు అందుబాటులో లేదు (PDF చదివే భాగం సర్వర్‌లో లేదు).",
            f"pypdf missing ({e}). Add pypdf to requirements.txt.", reason="pypdf_missing",
        ) from e

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            try:
                if not reader.decrypt(""):
                    raise ValueError("needs password")
            except Exception:
                raise PdfRuleError("password", "ఈ PDF కి పాస్‌వర్డ్ ఉంది. పాస్‌వర్డ్ లేని PDF అప్‌లోడ్ చేయండి.")
        total = len(reader.pages)
    except PdfRuleError:
        raise
    except Exception as e:
        raise PdfRuleError("not_pdf", "ఈ ఫైల్‌ను PDF గా తెరవలేకపోయాం. సరైన PDF అప్‌లోడ్ చేయండి.") from e

    document = _inspect_document(reader)
    pages, page_info, stray_total = [], [], 0
    removed = {"page_numbers": 0, "symbol_lines": 0, "header_lines": 0, "header_examples": []}
    for i, page in enumerate(reader.pages[:PDF_MAX_PAGES], start=1):
        try:
            text, stray = _clean_text(page.extract_text() or "")
        except Exception as e:  # ఒక పేజీ విఫలమైనా మిగతావి కొనసాగుతాయి
            log(f"[PDF RAG] page {i} extract failed: {type(e).__name__}: {e}")
            text, stray = "", 0
        text, noise = _strip_noise_lines(text)
        removed["page_numbers"] += noise["page_numbers"]
        removed["symbol_lines"] += noise["symbol_lines"]
        stray_total += stray

        images = _page_images(page)
        full = any(_is_full_page(img, page) for img in images)
        invisible = full and _has_invisible_text(page)
        document["javascript"] = document["javascript"] or _page_has_js(page)
        document["attachments"] += 1 if _page_has_attachment(page) else 0
        pages.append((i, text))
        page_info.append({"page": i, "images": len(images), "full_image": full, "invisible_text": invisible})

    pages, header_lines, examples = _remove_headers_footers(pages)
    removed["header_lines"], removed["header_examples"] = header_lines, examples

    # పేజీ రకం: text | blank | image | scan_ocr | background
    for info, (_, text) in zip(page_info, pages):
        info["chars"] = len(text)
        if info["invisible_text"]:
            info["kind"] = "scan_ocr"            # scan చిత్రం + కనిపించని OCR పాఠ్యం = టైప్ చేసినది కాదు
        elif len(text) < PDF_MIN_PAGE_CHARS:
            info["kind"] = "image" if info["images"] else "blank"
        elif info["full_image"]:
            info["kind"] = "background"          # పేజీ అంత చిత్రం పైన నిజమైన టైప్ పాఠ్యం — అనుమతి
        else:
            info["kind"] = "text"

    return {"pages": pages, "total_pages": total, "stray": stray_total,
            "page_info": page_info, "document": document, "removed": removed}


# ═══════════ 2. వ్యాపార నియమాల తనిఖీ ═══════════

def check_pdf_rules(extracted: dict) -> dict:
    """అన్ని నియమాలు ఒకేచోట. ఏది ఉల్లంఘించినా PdfRuleError. పాస్ అయితే లెక్కలు."""
    doc, info = extracted["document"], extracted["page_info"]

    # R-SAFE: ఆటోమేటిక్‌గా నడిచే JavaScript / చర్యలు ఉన్న PDF వద్దు (మనం నడపం, కానీ శుభ్రమైన PDF మాత్రమే నియమం)
    if doc["javascript"]:
        raise PdfRuleError("unsafe_content", "ఈ PDF లో JavaScript / ఆటోమేటిక్ చర్యలు ఉన్నాయి. సాధారణ (Word / Google Docs నుండి చేసిన) PDF అప్‌లోడ్ చేయండి.")
    # R-PORTFOLIO: PDF లోపల చాలా ఫైళ్ళ సంచి
    if doc["portfolio"]:
        raise PdfRuleError("portfolio", "ఇది PDF Portfolio (చాలా ఫైళ్ళ సంచి). ఒకే తెలుగు PDF అప్‌లోడ్ చేయండి.")

    image_pages = [p["page"] for p in info if p["kind"] in ("image", "scan_ocr")]
    scan_pages = [p["page"] for p in info if p["kind"] == "scan_ocr"]
    blank_pages = [p["page"] for p in info if p["kind"] == "blank"]
    text_page_set = {p["page"] for p in info if p["kind"] in ("text", "background")}
    pages = [(n, t) for n, t in extracted["pages"] if n in text_page_set]
    read_pages = len(info)
    content_pages = read_pages - len(blank_pages)              # ఖాళీ పేజీలు లెక్కలోకి రావు

    # R-SCAN: టైప్ చేసిన పాఠ్యం అసలే లేదు
    if not pages:
        if scan_pages:
            raise PdfRuleError("scan_ocr", "ఇది scan చేసి OCR చేసిన PDF (పేజీలు ఫోటోలు, వాటి వెనుక కనిపించని పాఠ్యం). నేరుగా టైప్ చేసిన తెలుగు PDF మాత్రమే అప్‌లోడ్ చేయండి.")
        if image_pages:
            raise PdfRuleError("scanned", "ఈ PDF లో టైప్ చేసిన అక్షరాలు లేవు — ఇది scan / ఫోటో PDF. టైప్ చేసిన తెలుగు PDF మాత్రమే అప్‌లోడ్ చేయండి.")
        raise PdfRuleError("no_text", "ఈ PDF లో పాఠ్యం దొరకలేదు (పేజీలు ఖాళీగా ఉన్నాయి).")

    # R-IMAGE: చిత్రాల / scan పేజీలు 10% మించకూడదు
    image_percent = round(100 * len(image_pages) / max(content_pages, 1))
    if image_percent > PDF_MAX_IMAGE_PAGE_PERCENT:
        shown = ", ".join(str(n) for n in image_pages[:10]) + (" …" if len(image_pages) > 10 else "")
        what = "scan చేసి OCR చేసినవి" if len(scan_pages) * 2 >= len(image_pages) else "చిత్రాలు / scan లా ఉన్నాయి"
        raise PdfRuleError(
            "scan_ocr" if what.startswith("scan") else "image_pages",
            f"ఈ PDF లో {len(image_pages)} పేజీలు ({image_percent}%) {what} (పేజీలు: {shown}). "
            f"గరిష్ఠం {PDF_MAX_IMAGE_PAGE_PERCENT}% మాత్రమే అనుమతి. నేరుగా టైప్ చేసిన PDF అప్‌లోడ్ చేయండి.",
        )

    joined = "".join(t for _, t in pages)
    telugu = len(_TELUGU_RE.findall(joined))
    # తెలుగు గుణింతాల గుర్తులు Python లో "alpha" కావు — తెలుగు పరిధిని కూడా లెక్కిస్తాం
    letters = sum(1 for ch in joined if ch.isalpha() or "ఀ" <= ch <= "౿")
    legacy = len(_LEGACY_RE.findall(joined))

    # R-LEGACY: పాత (Unicode కాని) ఫాంట్
    if letters > 200 and telugu / letters < 0.05 and legacy / letters > 0.15:
        raise PdfRuleError("legacy_font", "ఈ PDF పాత (Unicode కాని) తెలుగు ఫాంట్‌లో ఉంది; అక్షరాలు సరిగ్గా చదవలేం. Unicode తెలుగు PDF అప్‌లోడ్ చేయండి.")

    # R-TELUGU: తెలుగు PDF మాత్రమే
    telugu_percent = round(100 * telugu / letters) if letters else 0
    if telugu_percent < PDF_MIN_TELUGU_PERCENT:
        raise PdfRuleError(
            "not_telugu",
            f"ఇది తెలుగు PDF కాదు (తెలుగు అక్షరాలు {telugu_percent}% మాత్రమే; కనీసం {PDF_MIN_TELUGU_PERCENT}% కావాలి). తెలుగు PDF మాత్రమే అప్‌లోడ్ చేయండి.",
        )

    # R-QUALITY: శుభ్రం చేసిన తర్వాత కూడా విరిగి ఉన్న అక్షరాలు
    # (మనం సరిచేసిన చెత్త గుర్తులు "fixed" గా విడిగా చూపిస్తాం — అవి PDF తప్పు కాదు, extractor వి)
    broken = len(_BROKEN_START_RE.findall(joined)) + len(re.findall(r"[ఀ-౿][A-Za-z0-9]|[A-Za-z][ా-ౌ్]", joined))
    quality = max(0, round(100 * (1 - broken / max(telugu, 1))))
    if quality < PDF_MIN_QUALITY:
        raise PdfRuleError(
            "low_quality",
            f"ఈ PDF అక్షరాల నాణ్యత {quality}% మాత్రమే (కనీసం {PDF_MIN_QUALITY}% కావాలి) — చాలా అక్షరాలు విరిగి వస్తున్నాయి. "
            "Word / Google Docs నుండి నేరుగా తయారుచేసిన PDF ప్రయత్నించండి.",
        )

    pictures = [p for p in info if p["kind"] in ("text", "background") and p["images"]]
    return {
        "read_pages": read_pages,
        "text_pages": len(pages),
        "image_pages": image_pages,
        "scan_pages": scan_pages,
        "blank_pages": blank_pages,
        "picture_count": sum(p["images"] for p in pictures),
        "picture_pages": [p["page"] for p in pictures],
        "background_pages": [p["page"] for p in info if p["kind"] == "background"],
        "telugu_percent": telugu_percent,
        "quality_percent": quality,
        "broken": broken,
        "fixed": extracted["stray"],
        "characters": len(joined),
    }


# ═══════════ 3. ముక్కలు (chunking) ═══════════

def _join_lines(text: str) -> str:
    """PDF ప్రతి వరుసకు \n పెడుతుంది. వాక్యం మధ్యలో వచ్చిన \n ను ఖాళీగా మారుస్తాం;
    వాక్యం ముగింపు (. ? ! ।) లేదా చిన్న శీర్షిక వరుస తర్వాత మాత్రమే \n ఉంచుతాం."""
    lines = [ln.strip() for ln in text.split("\n")]
    out = ""
    for ln in lines:
        if not ln:
            out += "\n"
            continue
        prev = out.rstrip(" ").split("\n")[-1]
        if not out or out.endswith("\n") or re.search(r"[.?!।॥:]$", prev) or len(prev) < 40:
            out += ("" if not out or out.endswith("\n") else "\n") + ln
        else:
            out += " " + ln
    return out


def chunk_pages(pages: list[tuple[int, str]], skip: set[int] | None = None) -> list[dict]:
    """ప్రతి పేజీని వాక్యాల సరిహద్దుల్లో ~700 అక్షరాల ముక్కలుగా.
    overlap: ముందు ముక్క చివరి వాక్యాలు (~120 అక్షరాలు) తర్వాతి ముక్క మొదట్లో.
    ముక్క పేజీ దాటదు — జవాబులో పేజీ సంఖ్య ఖచ్చితంగా ఉంటుంది."""
    chunks: list[dict] = []
    for page_no, text in pages:
        if len(text) < PDF_MIN_PAGE_CHARS or (skip and page_no in skip):
            continue
        sentences: list[str] = []
        for s in _SENTENCE_END_RE.split(_join_lines(text)):
            s = (s or "").strip()
            while len(s) > PDF_CHUNK_CHARS:                     # చాలా పొడవైన వాక్యం → పదాల దగ్గర కోత
                cut = s.rfind(" ", 0, PDF_CHUNK_CHARS)
                cut = cut if cut > PDF_CHUNK_CHARS // 2 else PDF_CHUNK_CHARS
                sentences.append(s[:cut].strip())
                s = s[cut:].strip()
            if s:
                sentences.append(s)

        current: list[str] = []
        overlap_n = 0                                           # current మొదట్లో ఎన్ని వాక్యాలు overlap
        fresh = False                                           # overlap కాకుండా కొత్త వాక్యం ఉందా

        def emit():
            chunks.append({
                "page": page_no,
                "content": "\n".join(current),
                "overlap_chars": len("\n".join(current[:overlap_n])) + (1 if overlap_n else 0),
                "sentences": len(current),
            })

        for s in sentences:
            if current and sum(len(x) + 1 for x in current) + len(s) > PDF_CHUNK_CHARS:
                emit()
                tail: list[str] = []
                for x in reversed(current):                     # overlap వాక్యాలు
                    if sum(len(y) + 1 for y in tail) + len(x) > PDF_CHUNK_OVERLAP:
                        break
                    tail.insert(0, x)
                current, overlap_n, fresh = tail, len(tail), False
            current.append(s)
            fresh = True
        if current and fresh:
            emit()

    chunks = [c for c in chunks if len(c["content"]) >= 30]   # పేజీ సంఖ్య, శీర్షిక మాత్రమే ఉన్నవి వదిలేస్తాం
    for i, c in enumerate(chunks):
        c["chunk_index"] = i
    return chunks


# ═══════════ 4. సొంత vector: అక్షర n-gram TF-IDF ═══════════
# తెలుగు పదాలకు ప్రత్యయాలు అతుక్కుంటాయి (కోపం, కోపంతో, కోపాన్ని). పూర్తి పదం
# వెతికితే దొరకవు; 3–4 అక్షరాల ముక్కలు ("కోప") అన్ని రూపాల్లోనూ ఉంటాయి.
# ప్రతి ముక్కను స్థిర hash (crc32) తో 2048 కొలతల్లో ఒక స్థానానికి పంపుతాం.

def _words(text: str) -> list[str]:
    return [w.replace("‌", "").replace("‍", "").lower() for w in _WORD_RE.findall(text)]


def _grams_of_word(word: str) -> list[str]:
    padded = f" {word} "
    if len(word) <= 2:
        return [padded]                                     # చిన్న పదం మొత్తం ఒక ముక్క
    return [padded[i:i + n] for n in NGRAM_SIZES for i in range(len(padded) - n + 1)]


def text_grams(text: str, drop_stopwords: bool = False) -> Counter:
    words = _words(text)
    if drop_stopwords:
        words = [w for w in words if w not in QUESTION_STOPWORDS]
    return Counter(g for w in words for g in _grams_of_word(w))


def _slot(gram: str) -> tuple[int, float]:
    """స్థిర hash: ఏ సర్వర్‌లోనైనా, ఎప్పుడైనా ఒకే ముక్క → ఒకే స్థానం (Python hash() లా మారదు)."""
    h = zlib.crc32(gram.encode("utf-8"))
    return h % VEC_DIM, (1.0 if (h >> 20) & 1 else -1.0)


def _tf_slots(grams: Counter) -> dict[int, float]:
    """ముక్కల తరచుదనం (1 + log) → vector స్థానాలు (ఢీకొన్నవి కలుస్తాయి)."""
    slots: dict[int, float] = {}
    for g, count in grams.items():
        i, sign = _slot(g)
        slots[i] = slots.get(i, 0.0) + sign * (1.0 + math.log(count))
    return slots


def build_idf(chunk_slots: list[dict[int, float]]) -> list[float]:
    """అరుదైన ముక్కకు ఎక్కువ బరువు: idf = log((1+N)/(1+df)) + 1 — ఈ PDF ఒక్కదానికే."""
    n = len(chunk_slots)
    df = [0] * VEC_DIM
    for slots in chunk_slots:
        for i in slots:
            df[i] += 1
    return [math.log((1 + n) / (1 + d)) + 1.0 for d in df]


def weigh(slots: dict[int, float], idf: list[float]) -> dict[int, float]:
    """TF × IDF, తర్వాత పొడవు 1 (cosine కోసం)."""
    vec = {i: v * idf[i] for i, v in slots.items() if v}
    norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
    return {i: v / norm for i, v in vec.items()}


def cosine(a: dict[int, float], b: dict[int, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(v * b.get(i, 0.0) for i, v in a.items())


def to_sparsevec(vec: dict[int, float]) -> str:
    """pgvector sparsevec రూపం: '{1:0.12,57:-0.3}/2048' (స్థానాలు 1 నుండి)."""
    body = ",".join(f"{i + 1}:{v:.6f}" for i, v in sorted(vec.items()) if abs(v) >= 1e-6)
    return "{" + body + "}/" + str(VEC_DIM)


def top_words(text: str, idf: list[float], k: int = 4) -> list[str]:
    """ఈ ముక్కను ప్రత్యేకం చేసే పదాలు (అరుదైన అక్షర ముక్కలు ఎక్కువ ఉన్నవి) — తెరపై చూపించడానికి."""
    counts = Counter(w for w in _words(text) if len(w) >= 3 and _TELUGU_RE.search(w) and w not in QUESTION_STOPWORDS)

    def score(w: str) -> float:
        grams = _grams_of_word(w)
        return (1 + math.log(counts[w])) * sum(idf[_slot(g)[0]] for g in grams) / len(grams)

    return sorted(counts, key=score, reverse=True)[:k]


# ═══════════ 5. నిల్వ (Neon pgvector) ═══════════

_rag_tables_ready = False


def ensure_rag_tables():
    """మొదటిసారి మాత్రమే. sparsevec కి pgvector 0.7+ కావాలి (Neon లో ఉంది)."""
    global _rag_tables_ready
    if _rag_tables_ready:
        return
    if not RATNALABALA_DATABASE_URL:
        raise RuntimeError("NEON_DATABASE_URL is not configured.")
    with psycopg.connect(RATNALABALA_DATABASE_URL, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(f"""
                CREATE TABLE IF NOT EXISTS rag_docs (
                    doc_id      UUID PRIMARY KEY,
                    filename    TEXT NOT NULL,
                    pages       INT  NOT NULL,
                    chunks      INT  NOT NULL,
                    idf         REAL[] NOT NULL,
                    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
                    expires_at  TIMESTAMPTZ NOT NULL
                );
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    id          BIGSERIAL PRIMARY KEY,
                    doc_id      UUID NOT NULL REFERENCES rag_docs(doc_id) ON DELETE CASCADE,
                    page        INT  NOT NULL,
                    chunk_index INT  NOT NULL,
                    content     TEXT NOT NULL,
                    embedding   sparsevec({VEC_DIM}) NOT NULL
                );
                CREATE INDEX IF NOT EXISTS rag_chunks_doc_idx ON rag_chunks (doc_id);
                CREATE INDEX IF NOT EXISTS rag_docs_expires_idx ON rag_docs (expires_at);
            """)
    _rag_tables_ready = True


def rag_db_ready():
    """టేబుళ్ళు సిద్ధం; విఫలమైతే కారణంతో 503 (500 కాదు) — pdf-health చూడమని."""
    try:
        ensure_rag_tables()
    except Exception as e:
        text = str(e).lower()
        reason = "pgvector_old" if "sparsevec" in text else ("db_not_configured" if "not configured" in text else "db_failed")
        raise AIServiceError(
            503, "PDF సేవ ఇప్పుడు అందుబాటులో లేదు (డేటాబేస్). కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.",
            f"rag tables: {type(e).__name__}: {e}", reason=reason,
        ) from e


def delete_expired_rag_docs():
    with psycopg.connect(RATNALABALA_DATABASE_URL, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag_docs WHERE expires_at < now();")   # ముక్కలు CASCADE తో


# ═══════════ 6. అప్‌లోడ్ ═══════════

def handle_pdf_upload(data: bytes, filename: str) -> dict:
    started = time.time()
    if b"%PDF-" not in data[:1024]:
        raise PdfRuleError("not_pdf", "ఇది PDF ఫైల్ కాదు. .pdf ఫైల్ ఎంచుకోండి.")

    extracted = extract_pdf_pages(data)
    stats = check_pdf_rules(extracted)                      # ఏ నియమం తప్పినా ఇక్కడే ఆగుతుంది

    chunks = chunk_pages(extracted["pages"], skip=set(stats["image_pages"]))
    warnings: list[str] = []
    if extracted["total_pages"] > PDF_MAX_PAGES:
        warnings.append(f"PDF లో {extracted['total_pages']} పేజీలు; మొదటి {PDF_MAX_PAGES} పేజీలు మాత్రమే చదివాం.")
    if len(chunks) > PDF_MAX_CHUNKS:
        last_page = chunks[PDF_MAX_CHUNKS - 1]["page"]
        chunks = chunks[:PDF_MAX_CHUNKS]
        warnings.append(f"PDF చాలా పెద్దది; పేజీ {last_page} వరకు మాత్రమే ప్రశ్నించవచ్చు.")
    if stats["image_pages"]:
        warnings.append(f"చిత్రాల / scan పేజీలు వదిలేశాం: {', '.join(map(str, stats['image_pages'][:10]))}.")
    if extracted["document"]["attachments"]:
        warnings.append(f"PDF లో జతపరిచిన ఫైళ్ళు {extracted['document']['attachments']} ఉన్నాయి — వాటిని చదవం.")
    if extracted["document"]["form_fields"]:
        warnings.append("ఈ PDF లో form ఉంది — form లో నింపిన విలువలు చదవం, పేజీ పాఠ్యం మాత్రమే.")
    if not chunks:
        raise PdfRuleError("no_text", "ఈ PDF నుండి ప్రశ్నించగలిగే పాఠ్యం దొరకలేదు.")

    # సొంత vectors
    chunk_grams = [text_grams(c["content"]) for c in chunks]
    chunk_slots = [_tf_slots(g) for g in chunk_grams]
    idf = build_idf(chunk_slots)
    vectors = [weigh(s, idf) for s in chunk_slots]

    rag_db_ready()
    delete_expired_rag_docs()
    doc_id = str(uuid.uuid4())
    with psycopg.connect(RATNALABALA_DATABASE_URL, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rag_docs (doc_id, filename, pages, chunks, idf, expires_at) "
                "VALUES (%s, %s, %s, %s, %s, now() + make_interval(hours => %s));",
                (doc_id, filename[:200], stats["text_pages"], len(chunks), [round(x, 5) for x in idf], PDF_KEEP_HOURS),
            )
            cur.executemany(
                "INSERT INTO rag_chunks (doc_id, page, chunk_index, content, embedding) VALUES (%s, %s, %s, %s, %s::sparsevec);",
                [(doc_id, c["page"], c["chunk_index"], c["content"], to_sparsevec(v)) for c, v in zip(chunks, vectors)],
            )

    nonzero = [len(v) for v in vectors]
    log(f"[PDF RAG] upload doc={doc_id} pages={stats['text_pages']} chunks={len(chunks)} telugu={stats['telugu_percent']}% quality={stats['quality_percent']}%")
    return {
        "success": True,
        "doc_id": doc_id,
        "filename": filename,
        "keep_hours": PDF_KEEP_HOURS,
        "checks": {                     # ఏ నియమాలు పాస్ అయ్యాయో తెరపై చూపించడానికి
            "total_pages": extracted["total_pages"],
            "text_pages": stats["text_pages"],
            "image_pages": stats["image_pages"],
            "telugu_percent": stats["telugu_percent"],
            "min_telugu_percent": PDF_MIN_TELUGU_PERCENT,
            "quality_percent": stats["quality_percent"],
            "min_quality_percent": PDF_MIN_QUALITY,
            "fixed_symbols": stats["fixed"],
            "blank_pages": stats["blank_pages"],
            "scan_pages": stats["scan_pages"],
            "characters": stats["characters"],
        },
        "content": {                    # PDF లో ఏమేమి ఉన్నాయి, ఏమి వదిలేశాం
            "pictures": stats["picture_count"],
            "picture_pages": stats["picture_pages"][:30],
            "background_pages": stats["background_pages"][:30],
            "header_lines": extracted["removed"]["header_lines"],
            "header_examples": extracted["removed"]["header_examples"],
            "page_number_lines": extracted["removed"]["page_numbers"],
            "symbol_lines": extracted["removed"]["symbol_lines"],
            "attachments": extracted["document"]["attachments"],
            "form_fields": extracted["document"]["form_fields"],
        },
        "page_map": [                   # పేజీ → రకం, అక్షరాలు, ముక్కలు
            {
                "page": p["page"],
                "kind": p["kind"],
                "chars": p["chars"],
                "images": p["images"],
                "chunks": [c["chunk_index"] for c in chunks if c["page"] == p["page"]],
            }
            for p in extracted["page_info"]
        ],
        "chunking": {"target_chars": PDF_CHUNK_CHARS, "overlap_chars": PDF_CHUNK_OVERLAP, "rule": "వాక్యాల సరిహద్దుల్లో, పేజీ దాటకుండా"},
        "vector": {
            "method": "అక్షర 3–4 n-gram TF-IDF (సొంత logic, AI మోడల్ లేదు)",
            "dimensions": VEC_DIM,
            "store": "Neon PostgreSQL · pgvector (sparsevec)",
            "similarity": "cosine",
            "avg_nonzero": round(sum(nonzero) / len(nonzero)),
        },
        "chunks": [
            {
                "index": c["chunk_index"],
                "page": c["page"],
                "chars": len(c["content"]),
                "sentences": c["sentences"],
                "overlap_chars": c["overlap_chars"],
                "text": c["content"],
                "keywords": top_words(c["content"], idf),
                "nonzero": len(v),
            }
            for c, g, v in zip(chunks, chunk_grams, vectors)
        ],
        "preview": next((t for _, t in extracted["pages"] if len(t) >= PDF_MIN_PAGE_CHARS), "")[:300],
        "warnings": warnings,
        "took_ms": round((time.time() - started) * 1000),
    }


# ═══════════ 7. ప్రశ్న → వెతకడం → జవాబు (PDF వాక్యాలే) ═══════════

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def _valid_doc_id(doc_id) -> str:
    doc_id = str(doc_id or "").strip().lower()
    if not _UUID_RE.match(doc_id):
        raise PdfRuleError("bad_doc", "PDF గుర్తింపు సరిగా లేదు. PDF మళ్ళీ అప్‌లోడ్ చేయండి.")
    return doc_id


def _word_matches(word: str, query_grams: set[str]) -> bool:
    """ఈ పదం ప్రశ్నలోని ఏదైనా పదానికి దగ్గరా? (2+ అక్షర ముక్కలు కలిస్తే)"""
    grams = set(_grams_of_word(word.lower()))
    shared = grams & query_grams
    return len(shared) >= 2 or (len(word) <= 2 and bool(shared))


def _highlight(sentence: str, query_grams: set[str]) -> list[dict]:
    """వాక్యాన్ని ముక్కలుగా: ప్రశ్న పదాలకు సరిపోయినవి m=True (తెరపై హైలైట్)."""
    parts = []
    for piece in re.split(r"(\s+)", sentence):
        if not piece:
            continue
        core = "".join(_words(piece))
        parts.append({"t": piece, "m": bool(core) and _word_matches(core, query_grams)})
    return parts


def handle_pdf_ask(doc_id: str, question: str) -> dict:
    started = time.time()
    doc_id = _valid_doc_id(doc_id)
    rag_db_ready()

    q_grams = text_grams(question, drop_stopwords=True)
    if not q_grams:
        raise PdfRuleError("empty_question", "ప్రశ్నలో వెతకడానికి పదాలు లేవు. PDF లోని ఒక పదం లేదా విషయం పేరుతో అడగండి.")

    with psycopg.connect(RATNALABALA_DATABASE_URL, row_factory=dict_row, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT idf FROM rag_docs WHERE doc_id = %s AND expires_at > now();", (doc_id,))
            row = cur.fetchone()
            if row is None:
                raise FileNotFoundError("ఈ PDF గడువు ముగిసింది లేదా తొలగించబడింది. మళ్ళీ అప్‌లోడ్ చేయండి.")
            idf = [float(x) for x in row["idf"]]

            q_vec = weigh(_tf_slots(q_grams), idf)
            cur.execute(
                """
                SELECT page, chunk_index, content, 1 - (embedding <=> %(q)s::sparsevec) AS score
                FROM rag_chunks
                WHERE doc_id = %(d)s
                ORDER BY embedding <=> %(q)s::sparsevec
                LIMIT %(k)s;
                """,
                {"q": to_sparsevec(q_vec), "d": doc_id, "k": PDF_TOP_K},
            )
            rows = [dict(r) for r in cur.fetchall()]

    return answer_from_chunks(question, q_grams, q_vec, idf, rows, started)


def answer_from_chunks(question, q_grams, q_vec, idf, rows, started) -> dict:
    """DB నుండి వచ్చిన ముక్కల నుండి జవాబు వాక్యాలు ఎంచుకోవడం (DB లేకుండా పరీక్షించవచ్చు)."""
    retrieved = [
        {
            "page": r["page"],
            "index": r["chunk_index"],
            "score": round(float(r["score"] or 0), 4),
            "used": float(r["score"] or 0) >= PDF_MIN_SCORE,
            "preview": r["content"].replace("\n", " ")[:160],
        }
        for r in rows
    ]
    used = [r for r in rows if float(r["score"] or 0) >= PDF_MIN_SCORE]

    answer: list[dict] = []
    if used:
        query_gram_set = set(q_grams)
        candidates, order = [], {}
        for r in used:
            for pos, s in enumerate(x.strip() for x in _SENTENCE_END_RE.split(r["content"])):
                key = re.sub(r"\s+", " ", s)
                if len(key) < 15 or key in order:               # overlap వల్ల వచ్చే పునరావృతం వదిలేస్తాం
                    continue
                order[key] = (r["page"], r["chunk_index"], pos)
                candidates.append((cosine(q_vec, weigh(_tf_slots(text_grams(key)), idf)), key))
        candidates.sort(reverse=True)

        picked: list[tuple[float, str]] = []
        best = candidates[0][0] if candidates else 0.0
        for sc, s in candidates:
            if sc <= 0 or sc < best * PDF_SENTENCE_RATIO or len(picked) == PDF_ANSWER_SENTENCES:
                break
            if any(s in p or p in s for _, p in picked):         # ఒకదానిలో ఒకటి ఉంటే మళ్ళీ వద్దు
                continue
            picked.append((sc, s))

        # ఒక్క వాక్యమే దొరికితే — దాని తర్వాతి వాక్యం సందర్భం కోసం (అదే ముక్కలో)
        if len(picked) == 1:
            page, ci, pos = order[picked[0][1]]
            nxt = next((k for k, v in order.items() if v == (page, ci, pos + 1)), None)
            if nxt and not any(nxt in p for _, p in picked):
                picked.append((cosine(q_vec, weigh(_tf_slots(text_grams(nxt)), idf)), nxt))

        picked.sort(key=lambda p: order[p[1]])                  # PDF లో వచ్చే క్రమంలోనే చూపిస్తాం
        answer = [
            {"page": order[s][0], "score": round(sc, 4), "parts": _highlight(s, query_gram_set)}
            for sc, s in picked
        ]

    log(f"[PDF RAG] ask found={len(rows)} used={len(used)} best={max((x['score'] for x in retrieved), default=0):.3f}")
    return {
        "success": True,
        "question": question,
        "found": bool(answer),
        "message": None if answer else PDF_NOT_FOUND,
        "answer": answer,                       # PDF లోని అసలు వాక్యాలు, పేజీతో
        "retrieved": retrieved,                 # వెతికిన 5 ముక్కలు, scores తో
        "threshold": PDF_MIN_SCORE,
        "query_terms": sorted({w for w in _words(question) if w not in QUESTION_STOPWORDS}),
        "took_ms": round((time.time() - started) * 1000),
    }


def pdf_health() -> dict:
    """GET /api/main?endpoint=pdf-health — 503 కారణం కనుగొనడానికి. రహస్యాలు (URL, keys) చూపించం."""
    checks: dict = {"version": PDF_RAG_VERSION}

    def item(ok: bool, value=None, fix: str = "") -> dict:
        out = {"ok": ok}
        if value is not None:
            out["value"] = value
        if not ok and fix:
            out["fix"] = fix
        return out

    try:
        import pypdf
        checks["pypdf"] = item(True, pypdf.__version__)
    except Exception as e:
        checks["pypdf"] = item(False, type(e).__name__, "requirements.txt లో pypdf చేర్చి మళ్ళీ deploy చేయండి")

    checks["database_url"] = item(bool(RATNALABALA_DATABASE_URL), fix="Vercel లో NEON_DATABASE_URL environment variable పెట్టండి")
    if RATNALABALA_DATABASE_URL:
        try:
            with psycopg.connect(RATNALABALA_DATABASE_URL, connect_timeout=10) as conn:
                with conn.cursor() as cur:
                    checks["database"] = item(True)
                    cur.execute("SELECT extversion FROM pg_extension WHERE extname = 'vector';")
                    row = cur.fetchone()
                    version = row[0] if row else None
                    parts = [int(p) for p in re.findall(r"\d+", version or "")[:2]] + [0, 0]
                    checks["pgvector"] = item(
                        bool(version) and (parts[0], parts[1]) >= (0, 7), version or "not installed",
                        "Neon SQL Editor లో: CREATE EXTENSION IF NOT EXISTS vector; ALTER EXTENSION vector UPDATE;",
                    )
                    cur.execute("SELECT to_regclass('public.api_usage_log') IS NOT NULL;")
                    checks["api_usage_log_table"] = item(bool(cur.fetchone()[0]), fix="api_usage_log టేబుల్ లేదు — మిగతా APIs వాడే అదే టేబుల్ ఈ డేటాబేస్‌లో సృష్టించండి")
        except Exception as e:
            checks["database"] = item(False, type(e).__name__, "Neon డేటాబేస్ నిద్రలో ఉందా / URL సరైనదా చూడండి")
        if checks.get("database", {}).get("ok"):
            try:
                rag_db_ready()
                checks["rag_tables"] = item(True)
            except AIServiceError as e:
                checks["rag_tables"] = item(False, e.reason, "pgvector 0.7+ కావాలి (sparsevec)" if e.reason == "pgvector_old" else "server log లో [PDF RAG] చూడండి")

    checks["ready"] = all(v.get("ok", True) for v in checks.values() if isinstance(v, dict))
    return checks


def handle_pdf_delete(doc_id: str) -> dict:
    doc_id = _valid_doc_id(doc_id)
    rag_db_ready()
    with psycopg.connect(RATNALABALA_DATABASE_URL, connect_timeout=10) as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM rag_docs WHERE doc_id = %s;", (doc_id,))
    return {"success": True}


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

    # ---------- PDF ప్రశ్నోత్తరి ----------

    def _handle_pdf_upload(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            self._send_json(400, {"success": False, "error": "PDF ఫైల్ రాలేదు. మళ్ళీ ప్రయత్నించండి."})
            return
        if length > PDF_MAX_BYTES:
            self._send_json(413, {"success": False, "error": "PDF చాలా పెద్దది (గరిష్ఠం 4 MB)."})
            return
        filename = (urllib_unquote(self.headers.get("X-Filename", "") or "") or "document.pdf").strip()[:200]

        try:
            usage_id = reserve_api_call("pdf-upload", "/api/main?endpoint=pdf-upload", "POST", PDF_UPLOAD_DAILY_LIMIT)
        except Exception as e:
            log(f"[PDF RAG] usage log failed: {type(e).__name__}: {e}")
            self._send_json(503, {
                "success": False,
                "reason": "usage_log_failed",
                "error": "PDF సేవ ఇప్పుడు అందుబాటులో లేదు (డేటాబేస్). కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి.",
            })
            return
        if usage_id is None:
            self._send_json(429, {"success": False, "error": "ఈరోజు PDF అప్‌లోడ్ పరిమితి పూర్తయింది. రేపు మళ్ళీ ప్రయత్నించండి."})
            return

        try:
            data = self.rfile.read(length)
            result = handle_pdf_upload(data, filename)
            safe_update_api_log(usage_id, 200)
            self._send_json(200, result)
        except PdfRuleError as e:
            log(f"[PDF RAG] rejected rule={e.rule}")
            safe_update_api_log(usage_id, 422)
            self._send_json(422, {"success": False, "rule": e.rule, "error": str(e)})
        except ValueError as e:
            safe_update_api_log(usage_id, 400)
            self._send_json(400, {"success": False, "error": str(e)})
        except AIServiceError as e:
            log(f"[PDF RAG] service error ({e.status}, {e.reason}): {e}")
            safe_update_api_log(usage_id, e.status)
            self._send_json(e.status, {"success": False, "reason": e.reason, "error": e.message})
        except Exception as e:
            log(f"[PDF RAG] upload error: {type(e).__name__}: {e}\n{traceback.format_exc()}")
            safe_update_api_log(usage_id, 500)
            self._send_json(500, {"success": False, "error": "PDF సిద్ధం చేయలేకపోయాం. మళ్ళీ ప్రయత్నించండి."})

    def _handle_pdf_json(self, endpoint: str, payload: dict):
        try:
            if endpoint == "pdf-delete":
                self._send_json(200, handle_pdf_delete(payload.get("doc_id")))
                return

            question = payload.get("question")
            if not isinstance(question, str) or not question.strip():
                self._send_json(400, {"success": False, "error": "దయచేసి ఒక ప్రశ్న టైప్ చేయండి."})
                return
            question = question.strip()
            if len(question) > BHAVALAMALA_MAX_QUESTION_LENGTH:
                self._send_json(400, {"success": False, "error": "ప్రశ్న చాలా పొడవుగా ఉంది (గరిష్ఠం 1000 అక్షరాలు)."})
                return

            usage_id = reserve_api_call("pdf-ask", "/api/main?endpoint=pdf-ask", "POST", PDF_ASK_DAILY_LIMIT)
            if usage_id is None:
                self._send_json(429, {"success": False, "error": "ఈరోజు ప్రశ్నల పరిమితి పూర్తయింది. రేపు మళ్ళీ ప్రయత్నించండి."})
                return
            try:
                result = handle_pdf_ask(payload.get("doc_id"), question)
                safe_update_api_log(usage_id, 200)
                self._send_json(200, result)
            except FileNotFoundError as e:
                safe_update_api_log(usage_id, 404)
                self._send_json(404, {"success": False, "error": str(e)})
            except AIServiceError as e:
                log(f"[PDF RAG] service error ({e.status}, {e.reason}): {e}")
                safe_update_api_log(usage_id, e.status)
                self._send_json(e.status, {"success": False, "reason": e.reason, "error": e.message})
        except ValueError as e:
            self._send_json(400, {"success": False, "error": str(e)})
        except Exception as e:
            log(f"[PDF RAG] {endpoint} error: {type(e).__name__}: {e}\n{traceback.format_exc()}")
            self._send_json(500, {"success": False, "error": "సమస్య ఏర్పడింది. మళ్ళీ ప్రయత్నించండి."})

    def _handle_bhavalamala_search(self, query: dict):
        """WebMCP శోధన — GET /api/main?endpoint=bhavalamala-search&query=..."""
        q = _first(query, "query", "")
        if not q:
            self._send_json(400, {"success": False, "error": "వెతకడానికి ఒక పదం లేదా ప్రశ్న ఇవ్వండి."})
            return
        if len(q) > BHAVALAMALA_MAX_QUESTION_LENGTH:
            self._send_json(400, {"success": False, "error": "ప్రశ్న చాలా పొడవుగా ఉంది (గరిష్ఠం 1000 అక్షరాలు)."})
            return

        try:
            top_k = int(_first(query, "top_k", str(BHAVALAMALA_DEFAULT_TOP_K)))
        except ValueError:
            top_k = BHAVALAMALA_DEFAULT_TOP_K
        top_k = max(1, min(top_k, BHAVALAMALA_MAX_TOP_K))

        # embedding సేవ లేకపోతే — పరిమితి లెక్కలోకి రాకుండా వెంటనే స్పష్టమైన జవాబు
        if not bhavalamala_available():
            self._send_json(503, {"success": False, "error": BHAVALAMALA_LOCAL_ONLY})
            return

        try:
            usage_id = reserve_api_call(
                "bhavalamala-search", "/api/main?endpoint=bhavalamala-search", "GET",
                BHAVALAMALA_SEARCH_DAILY_LIMIT,
            )
        except Exception as e:
            log(f"[Bhavalamala search] usage log failed: {type(e).__name__}: {e}")
            self._send_json(503, {"success": False, "error": AI_UNAVAILABLE_MSG})
            return
        if usage_id is None:
            self._send_json(429, {"success": False, "error": "ఈరోజు శోధన పరిమితి పూర్తయింది. రేపు మళ్ళీ ప్రయత్నించండి."})
            return

        try:
            result = search_bhavalamala_only(q, top_k)
            safe_update_api_log(usage_id, 200)
            # విజయవంతమైన జవాబు మాత్రమే cache — errors ఎప్పుడూ cache కావు
            self._send_json(200, result, cache=BHAVALAMALA_SEARCH_CACHE_HEADER)
        except AIServiceError as e:
            log(f"[Bhavalamala search] AI error ({e.status}): {e}")
            safe_update_api_log(usage_id, e.status)
            self._send_json(e.status, {"success": False, "error": e.message})
        except Exception as e:
            log(f"[Bhavalamala search] error: {type(e).__name__}: {e}\n{traceback.format_exc()}")
            safe_update_api_log(usage_id, 500)
            self._send_json(500, {"success": False, "error": "శోధన పూర్తి కాలేదు. మళ్ళీ ప్రయత్నించండి."})

    def do_GET(self):
        # /api/aksharamala, /api/gita, ... → వాటి సొంత handler (api/_router.py)
        if delegate(self, "do_GET"):
            return

        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        try:
            if endpoint == "bhavalamala-search":
                self._handle_bhavalamala_search(query)
                return
            if endpoint == "pdf-health":
                result = pdf_health()
                self._send_json(200 if result["ready"] else 503, result)
                return

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

        # PDF ప్రశ్నోత్తరి: అప్‌లోడ్ JSON కాదు, PDF bytes నేరుగా
        if endpoint == "pdf-upload":
            self._handle_pdf_upload()
            return

        try:
            payload = self._read_json_body()
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        if endpoint in ("pdf-ask", "pdf-delete"):
            self._handle_pdf_json(endpoint, payload)
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
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Filename")
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

    # WebMCP search (retrieval only, no AI answer)
    print(f"Try: http://localhost:{port}/api/main?endpoint=bhavalamala-search&query=కోపం&top_k=5")

    # Merged endpoints (served through api/_router.py)
    print(f"Try: http://localhost:{port}/api/aksharamala?search=&type=all&page=1&page_size=4")
    print(f"Try: http://localhost:{port}/api/gita")
    print(f"POST http://localhost:{port}/api/main?endpoint=track        body: {{\"session_id\": \"abc12345\", \"events\": [{{\"name\": \"page_view\", \"path\": \"/aksharamala\"}}]}}")
    print(f"GET  http://localhost:{port}/api/main?endpoint=activity_summary&days=7   header: X-Admin-Key")
    print(f"POST http://localhost:{port}/api/main?endpoint=bhavalamala-chat  body: {{\"question\": \"అసహనం గురించి ఏమి చెప్పారు?\", \"top_k\": 5}}")

    print(f"POST http://localhost:{port}/api/main?endpoint=pdf-upload   body: PDF bytes, header X-Filename")
    print(f"POST http://localhost:{port}/api/main?endpoint=pdf-ask      body: {{\"doc_id\": \"...\", \"question\": \"...\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=svara        body: {{\"text\": \"...\", \"voice\": \"male\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=tts          body: {{\"text\": \"...\", \"voice\": \"te-IN-ShrutiNeural\", \"speed\": 1.0}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=extract-news body: {{\"url\": \"https://...\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=poem-ai      body: {{\"collection\": \"Sumati\", \"filename\": \"001.md\", \"question\": \"...\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=poem-ai      body: {{\"title\": \"గర్వం\", \"content\": \"...\", \"question\": \"...\"}}   (database poem)")
    HTTPServer(("localhost", port), handler).serve_forever()