"""
api/gita.py

Single-file Vercel Python serverless function (native Vercel runtime —
BaseHTTPRequestHandler, matching aksharamala.py / trace_check.py /
sametalu_agent.py conventions in this folder — no Flask/FastAPI).

Fetches the Bhagavad Gita (Telugu) dataset live from Hugging Face's
Datasets Server API and returns it grouped by chapter — no local
storage, just a live pass-through with in-memory caching.

Dataset: ajaysadhu02/bhagavath-gita-telugu
Columns (confirmed): sloka, verse, chapter, audio, w2w_meaning,
                      te_translation, commentry

DEPLOYED ENDPOINTS (Vercel auto-routes api/gita.py → /api/gita):
    GET /api/gita?chapter=1        → single chapter, verses sorted
    GET /api/gita?chapter=all      → every chapter, as a list
    GET /api/gita                  → same as ?chapter=all

Dependencies: requests only (already in requirements.txt).
"""

import json
import time
from collections import defaultdict
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

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
#    cold starts will re-fetch, same as build_index.py's pattern) ──
_cache: dict[int, dict] = {}
_cached_at: float = 0.0


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
            "commentary": row.get("commentry"),
            "audio": row.get("audio"),
        }
        grouped[row["chapter"]].append(verse_obj)

    chapters: dict[int, dict] = {}
    for chapter_num, verses in grouped.items():
        verses.sort(key=lambda v: v["verse"])
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
        chapter_param = query.get("chapter", ["all"])[0]

        try:
            chapters = _get_all_chapters()
        except requests.RequestException as e:
            self._send_json(502, {"error": f"Hugging Face API error: {e}"})
            return

        if chapter_param == "all":
            result = sorted(chapters.values(), key=lambda c: c["chapter"])
            self._send_json(200, result)
            return

        try:
            chapter_num = int(chapter_param)
        except ValueError:
            self._send_json(400, {"error": "chapter must be an integer or 'all'"})
            return

        chapter = chapters.get(chapter_num)
        if not chapter:
            self._send_json(404, {"error": "Chapter not found"})
            return

        self._send_json(200, chapter)

    def do_OPTIONS(self):
        # CORS preflight support, in case the frontend is on a different origin.
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Local-only test runner ──
# Vercel ignores this block entirely and calls the `handler` class
# directly through its own server. This is purely so you can run
# `python api/gita.py` on your machine without needing the Vercel CLI.
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8000
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/gita?chapter=1")
    print(f"Try: http://localhost:{port}/api/gita?chapter=all")
    server = HTTPServer(("localhost", port), handler)
    server.serve_forever()