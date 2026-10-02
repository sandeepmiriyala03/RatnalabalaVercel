"""Vercel entry point for the live Bhagavad Gita verses API."""

import json
import re
import time
from collections import defaultdict
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

import requests

# ── Config ──
HF_BASE = "https://datasets-server.huggingface.co"
DATASET = "ajaysadhu02/bhagavath-gita-telugu"
CONFIG = "default"
SPLIT = "train"
PAGE_SIZE = 100          # Hugging Face's hard per-request limit
TOTAL_ROWS = 701         # confirmed from the dataset's viewer page
CACHE_TTL_SECONDS = 60 * 60  # 1 hour

# ── In-memory cache (per serverless instance —
#    cold starts will re-fetch, same as the build-index helper) ──
_cache: dict[int, dict] = {}
_cached_at: float = 0.0


def _clean_text(text: str | None) -> str | None:
    """Collapse stray tabs/extra whitespace from source dataset text,
    without touching intentional \\r\\n structure in `meaning`."""
    if text is None:
        return None
    return re.sub(r"[\t]+", " ", text)


def _fetch_page(offset: int) -> list[dict]:
    url = (
        f"{HF_BASE}/rows"
        f"?dataset={DATASET}&config={CONFIG}&split={SPLIT}"
        f"&offset={offset}&length={PAGE_SIZE}"
    )
    res = requests.get(url, timeout=30)
    res.raise_for_status()
    data = res.json()
    return [r["row"] for r in data["rows"]]


def _fetch_all_rows() -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while offset < TOTAL_ROWS:
        rows.extend(_fetch_page(offset))
        offset += PAGE_SIZE
    return rows


def _group_by_chapter(rows: list[dict]) -> dict[int, dict]:
    grouped: dict[int, list[dict]] = defaultdict(list)

    for row in rows:
        verse_obj = {
            "verse": row.get("verse"),
            "sloka": row.get("sloka"),
            "meaning": row.get("te_translation") or "",
            "w2wMeaning": row.get("w2w_meaning"),
            "commentary": _clean_text(row.get("commentry")),
            "audio": row.get("audio"),
        }
        grouped[row["chapter"]].append(verse_obj)

    chapters: dict[int, dict] = {}
    for chapter_num, verses in grouped.items():
        # FIX: sort key must force int — if the Hugging Face API ever
        # returns `verse` as a string (JSON APIs commonly don't
        # preserve numeric types strictly), a plain string sort orders
        # "1", "10", "11", "2", "3"... instead of 1, 2, 3... 10, 11.
        # That misordering is exactly what would look like "the next
        # verse's content showing up in the current verse's slot" when
        # rendered in sequence — verse 10 would appear immediately
        # after verse 1, well before verses 2-9.
        verses.sort(key=lambda v: int(v["verse"]))
        chapters[chapter_num] = {
            "chapter": chapter_num,
            "chapterName": f"అధ్యాయం {chapter_num}",  # no chapter-name column in dataset
            "totalVerses": len(verses),
            "verses": verses,
        }

    return chapters


def _get_all_chapters() -> dict[int, dict]:
    global _cache, _cached_at

    is_fresh = _cache and (time.time() - _cached_at) < CACHE_TTL_SECONDS
    if is_fresh:
        return _cache

    rows = _fetch_all_rows()
    _cache = _group_by_chapter(rows)
    _cached_at = time.time()
    return _cache


def get_chapter_response(chapter_param: str) -> tuple[int, dict | list]:
    try:
        chapters = _get_all_chapters()
    except requests.RequestException as e:
        return 502, {"error": f"Hugging Face API error: {e}"}

    if chapter_param == "all":
        return 200, sorted(chapters.values(), key=lambda chapter: chapter["chapter"])

    try:
        chapter_num = int(chapter_param)
    except ValueError:
        return 400, {"error": "chapter must be an integer or 'all'"}

    chapter = chapters.get(chapter_num)
    if not chapter:
        return 404, {"error": "Chapter not found"}

    return 200, chapter


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
        query = parse_qs(urlparse(self.path).query)
        status, payload = get_chapter_response(query.get("chapter", ["all"])[0])
        self._send_json(status, payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()