# api/aksharamala.py
#
# Search now ALSO checks sametalu data for the same term — added as
# a plain inline function call, same file, no cross-file import
# (avoids the exact problem we already hit once with aksharamala_data.py).
#
# GET /api/aksharamala?search=&type=all&page=1&page_size=4
# GET /api/aksharamala?endpoint=similar&letter=అ&word=అరటి
# POST /api/aksharamala?endpoint=pronunciation or endpoint=trace

import base64
import difflib
import io
import json
import requests
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageDraw, ImageFont

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

SAMETALU_FILES = [
    "a", "aa", "am", "ba", "bha", "ca", "cha", "da", "da2", "dha", "dha2",
    "e", "ee", "ga", "ha", "i", "ja", "ka", "ksha", "la", "ma", "na2",
    "o", "oo", "pa", "ra", "sa", "sha", "ssa", "tha2", "u", "uu", "va",
]

_sametalu_cache: list[str] | None = None


def load_all_sametalu() -> list[str]:
    """Same loading pattern as sametalu_agent.py — plain function
    call within THIS file, not a cross-file import."""
    global _sametalu_cache
    if _sametalu_cache is not None:
        return _sametalu_cache

    all_texts = []
    for filename in SAMETALU_FILES:
        try:
            res = requests.get(f"{BASE_URL}/ssmetalamala/{filename}.json", timeout=15)
            res.raise_for_status()
            data = res.json()
            for s in data.get("sametalu", []):
                text = s.get("text", "")
                if text:
                    all_texts.append(text)
        except Exception:
            continue

    _sametalu_cache = all_texts
    return all_texts


def search_sametalu(term: str) -> list[str]:
    if not term:
        return []
    sametalu = load_all_sametalu()
    return [s for s in sametalu if term in s][:10]


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


FONT_PATH = "public/fonts/NTR-Regular.ttf"
OVERLAP_THRESHOLD = 0.35
_font_cache: dict = {}


def get_font(size: int) -> ImageFont.FreeTypeFont:
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(FONT_PATH, size)
    return _font_cache[size]


def render_guide_mask(letter: str, canvas_size: int) -> Image.Image:
    image = Image.new("L", (canvas_size, canvas_size), color=255)
    draw = ImageDraw.Draw(image)
    font = get_font(int(canvas_size * 0.55))
    bbox = draw.textbbox((0, 0), letter, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (canvas_size - text_width) / 2 - bbox[0]
    y = (canvas_size - text_height) / 2 - bbox[1]
    draw.text((x, y), letter, font=font, fill=0)
    return image


def decode_drawn_image(image_data: str, canvas_size: int) -> Image.Image:
    _, encoded = image_data.split(",", 1)
    image = Image.open(io.BytesIO(base64.b64decode(encoded))).convert("L")
    if image.size != (canvas_size, canvas_size):
        image = image.resize((canvas_size, canvas_size))
    return image


def compute_overlap(guide: Image.Image, drawn: Image.Image, canvas_size: int) -> float:
    guide_pixels = guide.load()
    drawn_pixels = drawn.load()
    guide_ink = 0
    covered = 0

    for x in range(0, canvas_size, 2):
        for y in range(0, canvas_size, 2):
            if guide_pixels[x, y] < 200:
                guide_ink += 1
                if drawn_pixels[x, y] < 200:
                    covered += 1

    return covered / guide_ink if guide_ink else 0.0


def check_trace(letter: str, image_data: str, canvas_size: int) -> dict:
    try:
        guide = render_guide_mask(letter, canvas_size)
        drawn = decode_drawn_image(image_data, canvas_size)
        score = compute_overlap(guide, drawn, canvas_size)
    except Exception as error:
        return {
            "correct": False,
            "score": 0.0,
            "message": "తనిఖీ చేయడంలో సమస్య వచ్చింది.",
            "error": str(error),
        }

    correct = score >= OVERLAP_THRESHOLD
    return {
        "correct": correct,
        "score": round(score, 2),
        "message": "బాగా రాశారు! 🎉" if correct else "మరింత సాధన చేయండి, మళ్ళీ ప్రయత్నించండి.",
    }


def filter_and_paginate(search: str, type_filter: str, page: int, page_size: int) -> dict:
    search = search.strip()

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

    # NEW — same search term also checked against sametalu data
    sametalu_matches = search_sametalu(search)

    return {
        "items": items,
        "total_count": total_count,
        "page_count": page_count,
        "current_page": page,
        "sametalu_matches": sametalu_matches,
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            endpoint = query.get("endpoint", [""])[0]
            if endpoint in ("similar", "aksharamala_similar"):
                letter = query.get("letter", [""])[0]
                if not letter:
                    self._send_json(400, {"error": "'letter' ఖాళీగా ఉంది"})
                    return
                self._send_json(200, find_similar(letter, query.get("word", [""])[0]))
                return

            result = filter_and_paginate(
                query.get("search", [""])[0],
                query.get("type", ["all"])[0],
                int(query.get("page", ["1"])[0]),
                int(query.get("page_size", ["4"])[0]),
            )
            self._send_json(200, result)
        except ValueError as e:
            self._send_json(400, {"error": str(e)})
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_POST(self):
        query = parse_qs(urlparse(self.path).query)
        endpoint = query.get("endpoint", [""])[0]
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(content_length)) if content_length else {}
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        if endpoint in ("pronunciation", "pronunciation_check"):
            target_word = payload.get("target_word", "")
            if not target_word:
                self._send_json(400, {"error": "'target_word' ఖాళీగా ఉంది"})
                return
            self._send_json(200, check_pronunciation(target_word, payload.get("spoken_text", "")))
            return

        if endpoint in ("trace", "trace_check"):
            letter = payload.get("letter", "")
            image_data = payload.get("image_data", "")
            if not letter or not image_data:
                self._send_json(400, {"error": "'letter' లేదా 'image_data' ఖాళీగా ఉంది"})
                return
            try:
                canvas_size = int(payload.get("canvas_size", 260))
            except (TypeError, ValueError):
                self._send_json(400, {"error": "canvas_size must be an integer"})
                return
            self._send_json(200, check_trace(letter, image_data, canvas_size))
            return

        self._send_json(400, {"error": "Use endpoint=pronunciation or endpoint=trace."})

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


