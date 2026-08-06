# api/aksharamala_similar.py
#
# "Similar words" lookup — triggered when a user clicks a letter/word
# card. Pure data lookup against the SAME AKSHARALU dataset and
# related JSON files (no Groq/LLM call — pure lookup, per the
# requirement).
#
# GET /api/aksharamala_similar?letter=అ&word=అరటి

import json
import requests
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

from aksharamala import AKSHARALU  # reuse the same source of truth

BASE_URL = "https://ratnalabala.vercel.app"

# If related word associations are hosted as JSON (same pattern as
# sametalu's /ssmetalamala/*.json), point at those files here.
# Adjust the path to wherever your akshara-relation JSON actually
# lives — this mirrors the sametalu_agent.py loading pattern exactly.
SAM_JSON_FOLDER = "sam"  # e.g. /sam/a.json, /sam/ka.json, etc.

_related_cache: dict = {}


def load_related_json(letter: str) -> list[dict]:
    """
    Fetches /{SAM_JSON_FOLDER}/{letter}.json if it exists — same
    hosted-JSON pattern as sametalu. Cached per warm instance.
    """
    if letter in _related_cache:
        return _related_cache[letter]

    try:
        res = requests.get(f"{BASE_URL}/{SAM_JSON_FOLDER}/{letter}.json", timeout=10)
        res.raise_for_status()
        data = res.json()
        related = data.get("related", [])
    except Exception:
        related = []

    _related_cache[letter] = related
    return related


def find_similar(letter: str, word: str) -> dict:
    # 1. Same-type matches from the existing dataset (free, instant)
    clicked = next((a for a in AKSHARALU if a["letter"] == letter), None)
    same_type = []
    if clicked:
        same_type = [
            a for a in AKSHARALU
            if a["type"] == clicked["type"] and a["letter"] != letter
        ][:5]

    # 2. Hosted JSON relations, if available (e.g. thematically
    # related words prepared separately, same pattern as sametalu)
    json_related = load_related_json(letter)

    return {
        "clicked": {"letter": letter, "word": word},
        "same_type": same_type,
        "related_from_json": json_related,
        "source": "local_data",
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)
            letter = query.get("letter", [""])[0]
            word = query.get("word", [""])[0]

            if not letter:
                self._send_json(400, {"error": "'letter' ఖాళీగా ఉంది"})
                return

            result = find_similar(letter, word)
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))