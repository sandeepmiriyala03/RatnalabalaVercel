# api/aksharamala.py


import base64
import difflib
import io
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont, features

AKSHARALU = [
    {"id": "s1", "type": "swaralu", "letter": "అ", "word": "అరటి", "image": "/akshara/1.jpg"},
    {"id": "s2", "type": "swaralu", "letter": "ఆ", "word": "ఆవు", "image": "/akshara/2.jpg"},
    {"id": "s3", "type": "swaralu", "letter": "ఇ", "word": "ఇల్లు", "image": "/akshara/3.jpg"},
    {"id": "s4", "type": "swaralu", "letter": "ఈ", "word": "ఈక", "image": "/akshara/4.jpg"},
    {"id": "s5", "type": "swaralu", "letter": "ఉ", "word": "ఉడుత", "image": "/akshara/5.jpg"},
    {"id": "s6", "type": "swaralu", "letter": "ఊ", "word": "ఊయల", "image": "/akshara/6.jpg"},
    {"id": "s7", "type": "swaralu", "letter": "ఋ", "word": "ఋషి"},
    {"id": "s8", "type": "swaralu", "letter": "ౠ", "word": "ౠ"},
    {"id": "s9", "type": "swaralu", "letter": "ఎ", "word": "ఎలుక", "image": "/akshara/7.jpg"},
    {"id": "s10", "type": "swaralu", "letter": "ఏ", "word": "ఏనుగు", "image": "/akshara/8.jpg"},
    {"id": "s11", "type": "swaralu", "letter": "ఐ", "word": "ఐదు", "image": "/akshara/9.jpg"},
    {"id": "s12", "type": "swaralu", "letter": "ఒ", "word": "ఒంటె", "image": "/akshara/10.jpg"},
    {"id": "s13", "type": "swaralu", "letter": "ఓ", "word": "ఓడ", "image": "/akshara/11.jpg"},
    {"id": "s14", "type": "swaralu", "letter": "ఔ", "word": "ఔషధం", "image": "/akshara/12.jpg"},
    {"id": "s15", "type": "swaralu", "letter": "అం", "word": "అంకెలు", "image": "/akshara/13.jpg"},
    {"id": "s16", "type": "swaralu", "letter": "అః", "word": "అంతఃపురం"},
    {"id": "v1", "type": "vyanjanalu", "letter": "క", "word": "కప్ప", "image": "/akshara/14.jpg"},
    {"id": "v2", "type": "vyanjanalu", "letter": "ఖ", "word": "ఖడ్గం", "image": "/akshara/15.jpg"},
    {"id": "v3", "type": "vyanjanalu", "letter": "గ", "word": "గడియారం", "image": "/akshara/16.jpg"},
    {"id": "v4", "type": "vyanjanalu", "letter": "ఘ", "word": "ఘంట", "image": "/akshara/17.jpg"},
    {"id": "v5", "type": "vyanjanalu", "letter": "ఙ", "word": "జ్ఞానము"},
    {"id": "v6", "type": "vyanjanalu", "letter": "చ", "word": "చక్రము", "image": "/akshara/18.jpg"},
    {"id": "v7", "type": "vyanjanalu", "letter": "ఛ", "word": "ఛత్రము", "image": "/akshara/19.jpg"},
    {"id": "v8", "type": "vyanjanalu", "letter": "జ", "word": "జడ", "image": "/akshara/20.jpg"},
    {"id": "v9", "type": "vyanjanalu", "letter": "ఝ", "word": "ఝషము", "image": "/akshara/21.jpg"},
    {"id": "v10", "type": "vyanjanalu", "letter": "ఞ", "word": "ఞ"},
    {"id": "v11", "type": "vyanjanalu", "letter": "ట", "word": "టపాకాయ", "image": "/akshara/22.jpg"},
    {"id": "v12", "type": "vyanjanalu", "letter": "ఠ", "word": "కంఠము", "image": "/akshara/23.jpg"},
    {"id": "v13", "type": "vyanjanalu", "letter": "డ", "word": "డప్పు", "image": "/akshara/24.jpg"},
    {"id": "v14", "type": "vyanjanalu", "letter": "ఢ", "word": "ఢంకా", "image": "/akshara/25.jpg"},
    {"id": "v15", "type": "vyanjanalu", "letter": "ణ", "word": "వీణ", "image": "/akshara/26.jpg"},
    {"id": "v16", "type": "vyanjanalu", "letter": "త", "word": "తల", "image": "/akshara/27.jpg"},
    {"id": "v17", "type": "vyanjanalu", "letter": "థ", "word": "రథము", "image": "/akshara/28.jpg"},
    {"id": "v18", "type": "vyanjanalu", "letter": "ద", "word": "దంతము", "image": "/akshara/29.jpg"},
    {"id": "v19", "type": "vyanjanalu", "letter": "ధ", "word": "ధనుస్సు", "image": "/akshara/30.jpg"},
    {"id": "v20", "type": "vyanjanalu", "letter": "న", "word": "నత్త", "image": "/akshara/31.jpg"},
    {"id": "v21", "type": "vyanjanalu", "letter": "ప", "word": "పడవ", "image": "/akshara/32.jpg"},
    {"id": "v22", "type": "vyanjanalu", "letter": "ఫ", "word": "ఫలము", "image": "/akshara/33.jpg"},
    {"id": "v23", "type": "vyanjanalu", "letter": "బ", "word": "బండి", "image": "/akshara/34.jpg"},
    {"id": "v24", "type": "vyanjanalu", "letter": "భ", "word": "భవనము", "image": "/akshara/35.jpg"},
    {"id": "v25", "type": "vyanjanalu", "letter": "మ", "word": "మద్దెల", "image": "/akshara/36.jpg"},
    {"id": "v26", "type": "vyanjanalu", "letter": "య", "word": "యంత్రము", "image": "/akshara/37.jpg"},
    {"id": "v27", "type": "vyanjanalu", "letter": "ర", "word": "రంగులు", "image": "/akshara/38.jpg"},
    {"id": "v28", "type": "vyanjanalu", "letter": "ల", "word": "లత", "image": "/akshara/39.jpg"},
    {"id": "v29", "type": "vyanjanalu", "letter": "వ", "word": "వల", "image": "/akshara/40.jpg"},
    {"id": "v30", "type": "vyanjanalu", "letter": "శ", "word": "శంఖము", "image": "/akshara/41.jpg"},
    {"id": "v31", "type": "vyanjanalu", "letter": "ష", "word": "షట్పదము", "image": "/akshara/42.jpg"},
    {"id": "v32", "type": "vyanjanalu", "letter": "స", "word": "సంచి", "image": "/akshara/43.jpg"},
    {"id": "v33", "type": "vyanjanalu", "letter": "హ", "word": "హంస", "image": "/akshara/44.jpg"},
    {"id": "v34", "type": "vyanjanalu", "letter": "ళ", "word": "తాళము", "image": "/akshara/45.jpg"},
    {"id": "v35", "type": "vyanjanalu", "letter": "క్ష", "word": "వృక్షము"},
    {"id": "v36", "type": "vyanjanalu", "letter": "ఱ", "word": "ఱంపము"},
]

BASE_URL = "https://ratnalabala.vercel.app"

# ================= SAMETALU =================

SAMETALU_FILES = [
    "a", "aa", "am", "ba", "bha", "ca", "cha", "da", "da2", "dha", "dha2",
    "e", "ee", "ga", "ha", "i", "ja", "ka", "ksha", "la", "ma", "na2",
    "o", "oo", "pa", "ra", "sa", "sha", "ssa", "tha2", "u", "uu", "va",
]

_sametalu_cache: list[str] | None = None


def _fetch_sametalu_file(filename: str) -> list[str]:
    try:
        res = requests.get(f"{BASE_URL}/ssmetalamala/{filename}.json", timeout=15)
        res.raise_for_status()
        data = res.json()
        return [s.get("text", "") for s in data.get("sametalu", []) if s.get("text")]
    except Exception:
        return []


def load_all_sametalu() -> list[str]:
    """Loads all sametalu files IN PARALLEL (was one by one: 33 requests
    in a row on every cold start). Order of files is kept."""
    global _sametalu_cache
    if _sametalu_cache is not None:
        return _sametalu_cache

    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(_fetch_sametalu_file, SAMETALU_FILES))

    all_texts = [text for file_texts in results for text in file_texts]

    # Don't cache a total failure — otherwise sametalu stay empty until
    # the next cold start. Try again on the next request instead.
    if all_texts:
        _sametalu_cache = all_texts
    return all_texts


def search_sametalu(term: str) -> list[str]:
    if not term:
        return []
    sametalu = load_all_sametalu()
    return [s for s in sametalu if term in s][:10]


# ================= SIMILAR =================

SAM_JSON_FOLDER = "sam"
_related_cache: dict = {}


def load_related_json(letter: str) -> list[dict]:
    if letter in _related_cache:
        return _related_cache[letter]

    try:
        response = requests.get(f"{BASE_URL}/{SAM_JSON_FOLDER}/{letter}.json", timeout=10)
        response.raise_for_status()
        related = response.json().get("related", [])
    except Exception:
        related = []

    _related_cache[letter] = related
    return related


def find_similar(letter: str, word: str) -> dict:
    clicked = next((item for item in AKSHARALU if item["letter"] == letter), None)
    same_type = []
    if clicked:
        same_type = [
            item for item in AKSHARALU
            if item["type"] == clicked["type"] and item["letter"] != letter
        ][:5]

    return {
        "clicked": {"letter": letter, "word": word},
        "same_type": same_type,
        "related_from_json": load_related_json(letter),
        "source": "local_data",
    }


# ================= AI WORD IDEAS (Groq) =================
# Same Groq setup as sametalu_agent.py. The AI suggests more words for a
# letter; the server checks them here, and the browser checks them again
# with the Rust akshara splitter before showing them.

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-120b"  # keep in sync with sametalu_agent.py
AI_WORDS_REQUESTED = 8              # ask for a few extra; some get filtered out
AI_WORDS_RETURNED = 6
TELUGU_TEXT = re.compile(r"^[\u0c00-\u0c7f\u200c\u200d]+$")
_ai_words_cache: dict[str, list[dict]] = {}


def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY సెట్ చేయలేదు.")
    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        },
        timeout=25,
    )
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"]


def parse_json_object(text: str) -> dict:
    """Takes the first {...} block, so ```json fences or extra words don't break it."""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("AI did not return JSON")
    return json.loads(text[start:end + 1])


def build_word_prompt(letter: str, exclude_word: str) -> str:
    exclude_rule = f'- Do not include "{exclude_word}".\n' if exclude_word else ""
    return (
        "You help Telugu-speaking children aged 4-8 learn the alphabet.\n"
        f'List {AI_WORDS_REQUESTED} simple, everyday Telugu words that START with the Telugu letter "{letter}".\n'
        "Rules:\n"
        f'- Each word must begin with exactly "{letter}".\n'
        "- Use common words a small child knows: animals, food, family, objects, nature.\n"
        "- Write each word in Telugu script only.\n"
        f"{exclude_rule}"
        "Reply with ONLY this JSON and nothing else:\n"
        '{"words": [{"word": "<Telugu word>", "meaning_en": "<1-3 word English meaning>", "emoji": "<one emoji>"}]}'
    )


def clean_ai_words(data: dict, letter: str) -> list[dict]:
    """Server-side check: Telugu only, starts with the letter, no duplicates."""
    words, seen = [], set()
    for item in data.get("words", []):
        if not isinstance(item, dict):
            continue
        word = str(item.get("word", "")).strip()
        if not word or word in seen or len(word) > 20:
            continue
        if not TELUGU_TEXT.match(word) or not word.startswith(letter):
            continue
        seen.add(word)
        words.append({
            "word": word,
            "meaning_en": str(item.get("meaning_en", "")).strip()[:40],
            "emoji": str(item.get("emoji", "")).strip()[:4],
        })
    return words


def suggest_ai_words(letter: str, exclude_word: str = "") -> list[dict]:
    if letter not in _ai_words_cache:
        data = parse_json_object(call_groq(build_word_prompt(letter, exclude_word)))
        words = clean_ai_words(data, letter)
        if not words:
            return []
        _ai_words_cache[letter] = words  # cache only good results
    return [w for w in _ai_words_cache[letter] if w["word"] != exclude_word][:AI_WORDS_RETURNED]


# ================= PRONUNCIATION =================

SIMILARITY_THRESHOLD = 0.75


def check_pronunciation(target_word: str, spoken_text: str) -> dict:
    target = target_word.strip()
    spoken = spoken_text.strip()

    if not target or not spoken:
        return {
            "correct": False,
            "similarity": 0.0,
            "message": "ఏమీ వినిపించలేదు, మళ్ళీ ప్రయత్నించండి.",
        }

    if target == spoken:
        return {"correct": True, "similarity": 1.0, "message": "సరైనది! 🎉"}

    similarity = difflib.SequenceMatcher(None, target, spoken).ratio()
    return {
        "correct": similarity >= SIMILARITY_THRESHOLD,
        "similarity": round(similarity, 2),
        "message": "సరైనది! 🎉" if similarity >= SIMILARITY_THRESHOLD else "కాదు, మళ్ళీ ప్రయత్నించండి.",
    }


# ================= TRACE (fallback for the Rust check) =================
# Same numbers as the browser / Rust version, so both behave alike.

FONT_PATH = os.path.join(os.path.dirname(__file__), "fonts", "NTR-Regular.ttf")
TRACE_GRID = 64          # = MASK_SIDE in lib.rs
TRACE_TOLERANCE = 2      # = TOLERANCE in lib.rs
INK_THRESHOLD = 32       # = INK_THRESHOLD in lib.rs
GUIDE_SCALE = 0.35       # = GUIDE_SCALE in AksharaTraceBoard.tsx
GUIDE_MAX_FILL = 0.8     # = GUIDE_MAX_FILL in AksharaTraceBoard.tsx
PASS_PERCENT = 60
GREAT_PERCENT = 80

# Telugu conjuncts (క్ష, ష్మి) and vowel signs only render correctly with
# the Raqm layout engine. Without it, Pillow draws the pieces side by side.
_LAYOUT = ImageFont.Layout.RAQM if features.check("raqm") else ImageFont.Layout.BASIC
_font_cache: dict = {}


def get_font(size: int) -> ImageFont.FreeTypeFont:
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size, layout_engine=_LAYOUT)
    return _font_cache[size]


def render_guide_mask(letter: str, size: int) -> Image.Image:
    """Letter shape as an ink mask (255 = ink, 0 = empty), centred by its
    real glyph bounds and shrunk to fit — same layout as the browser guide."""
    image = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(image)

    font_size = max(8, int(size * GUIDE_SCALE))
    font = get_font(font_size)
    bbox = draw.textbbox((0, 0), letter, font=font)
    width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]

    shrink = min(1.0, size * GUIDE_MAX_FILL / max(width, 1), size * GUIDE_MAX_FILL / max(height, 1))
    if shrink < 1.0:
        font = get_font(max(8, int(font_size * shrink)))
        bbox = draw.textbbox((0, 0), letter, font=font)
        width, height = bbox[2] - bbox[0], bbox[3] - bbox[1]

    x = (size - width) / 2 - bbox[0]
    y = (size - height) / 2 - bbox[1]
    draw.text((x, y), letter, font=font, fill=255)
    return image


def decode_drawn_mask(image_data: str, size: int) -> Image.Image:
    """The drawing canvas is TRANSPARENT with coloured strokes, so the
    alpha channel is exactly 'where the child drew'. (The old version
    converted to greyscale, which turns transparent pixels BLACK — every
    empty pixel counted as ink, so almost any drawing passed.)"""
    _, encoded = image_data.split(",", 1)
    image = Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGBA")
    alpha = image.getchannel("A")
    return alpha.resize((size, size), Image.BILINEAR)


def _ink(mask: Image.Image) -> list[bool]:
    # tobytes() on an "L" image = one byte per pixel (getdata() is deprecated in new Pillow)
    return [value >= INK_THRESHOLD for value in mask.tobytes()]


def score_masks(drawn: Image.Image, target: Image.Image) -> tuple[int, int] | None:
    """Returns (coverage %, precision %), or None if the letter is empty.
    MaxFilter spreads ink by TRACE_TOLERANCE cells — same as dilate() in Rust."""
    kernel = ImageFilter.MaxFilter(2 * TRACE_TOLERANCE + 1)

    drawn_ink = _ink(drawn)
    target_ink = _ink(target)

    target_total = sum(target_ink)
    if target_total == 0:
        return None
    drawn_total = sum(drawn_ink)
    if drawn_total == 0:
        return 0, 0

    drawn_near = _ink(drawn.filter(kernel))
    target_near = _ink(target.filter(kernel))

    covered = sum(1 for t, d in zip(target_ink, drawn_near) if t and d)
    precise = sum(1 for d, t in zip(drawn_ink, target_near) if d and t)

    return covered * 100 // target_total, precise * 100 // drawn_total


def describe_trace(coverage: int, precision: int) -> tuple[bool, str]:
    correct = coverage >= PASS_PERCENT and precision >= PASS_PERCENT
    if coverage >= GREAT_PERCENT and precision >= GREAT_PERCENT:
        message = "అద్భుతం! చాలా బాగా రాశారు 🎉"
    elif correct:
        message = "బాగుంది! 👍"
    elif coverage < PASS_PERCENT and precision >= PASS_PERCENT:
        message = "కొంత భాగం మిగిలిపోయింది — అక్షరం పూర్తిగా రాయండి"
    elif precision < PASS_PERCENT and coverage >= PASS_PERCENT:
        message = "గీతలు అక్షరం బయటకు వెళ్లాయి — జాగ్రత్తగా రాయండి"
    else:
        message = "మళ్ళీ ప్రయత్నించండి — బూడిద రంగు అక్షరం మీద రాయండి"
    return correct, message


def check_trace(letter: str, image_data: str, canvas_size: int) -> dict:
    # canvas_size is kept for compatibility; everything is compared on
    # the TRACE_GRID, so the drawing's pixel size doesn't matter.
    try:
        target = render_guide_mask(letter, TRACE_GRID)
        drawn = decode_drawn_mask(image_data, TRACE_GRID)
        result = score_masks(drawn, target)
    except Exception as error:
        return {
            "correct": False,
            "score": 0,
            "message": "తనిఖీ చేయడంలో సమస్య వచ్చింది.",
            "error": str(error),
        }

    if result is None:
        return {
            "correct": False,
            "score": 0,
            "message": "ఈ అక్షరాన్ని తనిఖీ చేయలేకపోయాను.",
            "error": "empty letter shape",
        }

    coverage, precision = result
    correct, message = describe_trace(coverage, precision)
    return {
        "correct": correct,
        "score": round((coverage + precision) / 2),
        "coverage": coverage,
        "precision": precision,
        "message": message,
    }


# ================= LIST + SEARCH =================

MAX_PAGE_SIZE = 50


def filter_and_paginate(search: str, type_filter: str, page: int, page_size: int) -> dict:
    search = search.strip()
    # page_size=0 used to crash with ZeroDivisionError (500)
    page_size = max(1, min(page_size, MAX_PAGE_SIZE))

    filtered = [
        a for a in AKSHARALU
        if (not search or search in a["letter"] or (a.get("word") and search in a["word"]))
        and (type_filter == "all" or a["type"] == type_filter)
    ]

    total_count = len(filtered)
    page_count = max(1, (total_count + page_size - 1) // page_size)
    page = max(1, min(page, page_count))

    start = (page - 1) * page_size
    items = filtered[start:start + page_size]

    # Same search term also checked against sametalu data
    sametalu_matches = search_sametalu(search)

    return {
        "items": items,
        "total_count": total_count,
        "page_count": page_count,
        "current_page": page,
        "sametalu_matches": sametalu_matches,
    }


# ================= USAGE LOGGING (Neon · api_usage_log) =================
# Same table and columns as api/main.py:
#   api_name, endpoint, http_method, event_type, status_code, success
#   (usage_id and request_date are filled by the database)
#
# event_type values used here:
#   API_CALL  – a real API request (counts toward daily limits)
#   CACHE_HIT – AI words served from memory, no Groq call (never counts)
#   LIMIT_HIT – AI words refused because today's limit was reached
#   UI_EVENT  – anonymous clicks sent by the page (endpoint=track)

DATABASE_URL = os.environ.get("NEON_DATABASE_URL", "")
DB_CONNECT_TIMEOUT = 3          # seconds — a slow database must not stall the API
AI_WORDS_DAILY_LIMIT = 300      # real Groq calls per day, protects the Groq quota
UI_API_NAME = "ui:aksharamala"  # separate name so clicks never touch API limits
MAX_UI_EVENTS_PER_BATCH = 50
MAX_TRACK_BODY_BYTES = 20_000

UI_EVENT_NAMES = {
    "letter_open",       # a letter card was clicked
    "speak",             # card 🔊 (detail = voice)
    "pronunciation",     # 🎤 result (success = correct)
    "trace_check",       # ✍️ result (success = passed, detail = scores)
    "ai_word_speak",     # an AI word tile was tapped
    "family_record",     # a letter was recorded in a family voice
    "family_voice_on",   # the family voice was selected
    "search",            # a Telugu search was made (text is NOT stored)
    "how_it_works",      # the explainer was opened
}

_SAFE_DETAIL = re.compile(r"[^A-Za-z0-9_.\-]")


def _db_connect():
    import psycopg  # imported here so a missing driver only disables logging
    return psycopg.connect(DATABASE_URL, connect_timeout=DB_CONNECT_TIMEOUT)


def log_api_call(api_name: str, endpoint: str, http_method: str,
                 status_code: int, event_type: str = "API_CALL") -> None:
    """Writes one row. Never raises."""
    if not DATABASE_URL:
        return
    try:
        with _db_connect() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO api_usage_log
                    (api_name, endpoint, http_method, event_type, status_code, success)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                (api_name, endpoint[:500], http_method, event_type,
                 status_code, 200 <= status_code < 400),
            )
    except Exception as e:
        print(f"[aksharamala] usage log failed: {type(e).__name__}: {e}")


def reserve_api_call(api_name: str, endpoint: str, http_method: str,
                     daily_limit: int) -> tuple[bool, int | None]:
    """Same idea as reserve_api_call in api/main.py: counts today's calls and
    inserts this one, under a lock so two requests can't both slip past the
    limit. Returns (allowed, usage_id). If the database is unreachable the
    call is allowed (fail open) but not logged."""
    if not DATABASE_URL:
        return True, None
    try:
        with _db_connect() as conn, conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_xact_lock(hashtext(%s));", (api_name,))
            cur.execute(
                """
                SELECT COUNT(*) FROM api_usage_log
                WHERE api_name = %s
                  AND event_type = 'API_CALL'
                  AND request_date = CURRENT_DATE;
                """,
                (api_name,),
            )
            if cur.fetchone()[0] >= daily_limit:
                return False, None
            cur.execute(
                """
                INSERT INTO api_usage_log
                    (api_name, endpoint, http_method, event_type, status_code, success)
                VALUES (%s, %s, %s, 'API_CALL', NULL, FALSE)
                RETURNING usage_id;
                """,
                (api_name, endpoint[:500], http_method),
            )
            return True, cur.fetchone()[0]
    except Exception as e:
        print(f"[aksharamala] reserve failed (allowing call): {type(e).__name__}: {e}")
        return True, None


def update_api_log(usage_id: int | None, status_code: int) -> None:
    if usage_id is None or not DATABASE_URL:
        return
    try:
        with _db_connect() as conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE api_usage_log SET status_code = %s, success = %s WHERE usage_id = %s;",
                (status_code, 200 <= status_code < 400, usage_id),
            )
    except Exception as e:
        print(f"[aksharamala] usage update failed: {type(e).__name__}: {e}")


def save_ui_events(events) -> int:
    """Validates a batch from the page and inserts it in one go.
    Only known event names are kept; nothing personal is stored."""
    if not isinstance(events, list):
        return 0
    rows = []
    for ev in events[:MAX_UI_EVENTS_PER_BATCH]:
        if not isinstance(ev, dict):
            continue
        name = str(ev.get("name", ""))
        if name not in UI_EVENT_NAMES:
            continue
        letter = str(ev.get("letter") or "").strip()
        if letter and (len(letter) > 8 or not TELUGU_TEXT.match(letter)):
            letter = ""
        detail = _SAFE_DETAIL.sub("", str(ev.get("detail") or ""))[:30]
        success = ev.get("success", True) is not False
        endpoint = "|".join(part for part in (name, letter, detail) if part)
        rows.append((UI_API_NAME, endpoint, "POST", "UI_EVENT", 200, success))

    if not rows or not DATABASE_URL:
        return len(rows)
    try:
        with _db_connect() as conn, conn.cursor() as cur:
            cur.executemany(
                """
                INSERT INTO api_usage_log
                    (api_name, endpoint, http_method, event_type, status_code, success)
                VALUES (%s, %s, %s, %s, %s, %s);
                """,
                rows,
            )
        return len(rows)
    except Exception as e:
        print(f"[aksharamala] UI events failed: {type(e).__name__}: {e}")
        return 0


# ================= HANDLER =================

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        endpoint = query.get("endpoint", [""])[0]
        letter = query.get("letter", [""])[0].strip()

        if endpoint in ("similar", "aksharamala_similar"):
            log_name, log_path = "aksharamala:similar", f"/api/aksharamala?endpoint=similar&letter={letter}"
        elif endpoint == "ai_words":
            log_name, log_path = "aksharamala:ai_words", f"/api/aksharamala?endpoint=ai_words&letter={letter}"
        else:
            type_filter = query.get("type", ["all"])[0]
            log_name, log_path = "aksharamala:list", f"/api/aksharamala?endpoint=list&type={type_filter}"

        status = 500
        try:
            if endpoint in ("similar", "aksharamala_similar"):
                if not letter:
                    status = 400
                    self._send_json(status, {"error": "'letter' ఖాళీగా ఉంది"})
                    return
                status = 200
                self._send_json(status, find_similar(letter, query.get("word", [""])[0]))
                return

            if endpoint == "ai_words":
                self._handle_ai_words(letter, query.get("word", [""])[0].strip(), log_name, log_path)
                return  # logs its own rows (limit + cache)

            result = filter_and_paginate(
                query.get("search", [""])[0],
                query.get("type", ["all"])[0],
                int(query.get("page", ["1"])[0]),
                int(query.get("page_size", ["4"])[0]),
            )
            status = 200
            self._send_json(status, result)
        except ValueError as e:
            status = 400
            self._send_json(status, {"error": str(e)})
        except Exception as e:
            status = 500
            self._send_json(status, {"error": str(e)})
        finally:
            if endpoint != "ai_words":
                log_api_call(log_name, log_path, "GET", status)

    def _handle_ai_words(self, letter: str, exclude_word: str, log_name: str, log_path: str):
        if not letter or len(letter) > 6 or not TELUGU_TEXT.match(letter):
            self._send_json(400, {"error": "'letter' సరైన తెలుగు అక్షరం కాదు"})
            log_api_call(log_name, log_path, "GET", 400)
            return

        # Already in memory: no Groq call, so it doesn't count toward the limit
        if letter in _ai_words_cache:
            words = suggest_ai_words(letter, exclude_word)
            self._send_json(200, {"letter": letter, "words": words, "source": "groq-cache"})
            log_api_call(log_name, log_path, "GET", 200, event_type="CACHE_HIT")
            return

        allowed, usage_id = reserve_api_call(log_name, log_path, "GET", AI_WORDS_DAILY_LIMIT)
        if not allowed:
            self._send_json(429, {"error": "ఈరోజు AI పదాల పరిమితి ముగిసింది. రేపు మళ్ళీ ప్రయత్నించండి."})
            # Separate event type, so hitting the limit shows in reports without counting as a call
            log_api_call(log_name, log_path, "GET", 429, event_type="LIMIT_HIT")
            return

        try:
            words = suggest_ai_words(letter, exclude_word)
        except Exception as e:
            self._send_json(502, {"error": "AI పదాలు తీసుకురాలేకపోయాను.", "detail": str(e)})
            update_api_log(usage_id, 502)
            return
        self._send_json(200, {"letter": letter, "words": words, "source": "groq"})
        update_api_log(usage_id, 200)

    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        endpoint = query.get("endpoint", [""])[0]

        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except ValueError:
            content_length = 0

        if endpoint == "track" and content_length > MAX_TRACK_BODY_BYTES:
            self._send_json(413, {"error": "Too many events in one batch."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length)) if content_length else {}
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        # Anonymous UI events (sent in batches by lib/track.ts)
        if endpoint == "track":
            saved = save_ui_events(payload.get("events") if isinstance(payload, dict) else None)
            self._send_json(200, {"saved": saved})
            return

        if endpoint in ("pronunciation", "pronunciation_check"):
            log_name = "aksharamala:pronunciation"
            target_word = payload.get("target_word", "")
            if not target_word:
                self._send_json(400, {"error": "'target_word' ఖాళీగా ఉంది"})
                log_api_call(log_name, "/api/aksharamala?endpoint=pronunciation", "POST", 400)
                return
            self._send_json(200, check_pronunciation(target_word, payload.get("spoken_text", "")))
            log_api_call(log_name, f"/api/aksharamala?endpoint=pronunciation&word={target_word[:30]}", "POST", 200)
            return

        if endpoint in ("trace", "trace_check"):
            log_name = "aksharamala:trace"
            letter = payload.get("letter", "")
            image_data = payload.get("image_data", "")
            log_path = f"/api/aksharamala?endpoint=trace&letter={str(letter)[:10]}"
            if not letter or not image_data:
                self._send_json(400, {"error": "'letter' లేదా 'image_data' ఖాళీగా ఉంది"})
                log_api_call(log_name, log_path, "POST", 400)
                return
            try:
                canvas_size = int(payload.get("canvas_size", 260))
            except (TypeError, ValueError):
                self._send_json(400, {"error": "canvas_size must be an integer"})
                log_api_call(log_name, log_path, "POST", 400)
                return
            result = check_trace(letter, image_data, canvas_size)
            self._send_json(200, result)
            # A server-side failure (e.g. font missing) is logged as 500 so it shows up in reports
            log_api_call(log_name, log_path, "POST", 500 if result.get("error") else 200)
            return

        self._send_json(400, {"error": "Use endpoint=pronunciation, endpoint=trace or endpoint=track."})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))