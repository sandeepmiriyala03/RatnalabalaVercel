# api/build_index.py
#
# RUNS ON VERCEL, NOT LOCALLY. This is the fix for "it should work in
# Vercel only" — visiting this endpoint's URL once (in a browser, or
# via curl) triggers the entire indexing pipeline server-side: fetch
# poems, embed everything via Cohere, upload the result to Vercel Blob
# storage (a real persistent file store, separate from your deployed
# code). No local Python, no venv, no DNS issues, no committing a
# JSON file to git.
#
# Setup (once):
#   1. Vercel dashboard → Storage → Create Database → Blob
#      (this auto-adds BLOB_READ_WRITE_TOKEN to your project)
#   2. Add to api/requirements.txt:  vercel_blob
#   3. Deploy this file + the updated rag_chat.py
#   4. Visit https://ratnalabala.vercel.app/api/build_index in your
#      browser (or curl it) — ONE TIME. This takes maybe 10-30 seconds
#      depending on how much data there is.
#   5. Copy the "url" value from the JSON response it gives you
#   6. Vercel → Settings → Environment Variables → add:
#      EMBEDDINGS_BLOB_URL = <that url>
#   7. Redeploy (or just wait — new deployments pick up new env vars
#      automatically; existing warm functions may need a fresh deploy
#      to see it)
#
# Re-run this same endpoint any time your poem/grammar data changes —
# it always overwrites the same blob pathname, so EMBEDDINGS_BLOB_URL
# never needs to change.

import os
import json
import time
import requests
import vercel_blob
from http.server import BaseHTTPRequestHandler

COHERE_API_KEY = os.environ.get("COHERE_API_KEY")
COHERE_EMBED_URL = "https://api.cohere.com/v1/embed"
EMBED_MODEL = "embed-multilingual-v3.0"
BATCH_SIZE = 90
BLOB_PATHNAME = "embeddings_index.json"

# This function calls your OWN site's APIs — since it's already
# running as part of ratnalabala.vercel.app, this resolves fine.
BASE_URL = "https://ratnalabala.vercel.app"


def embed_batch(texts: list[str], retries: int = 3) -> list[list[float]]:
    headers = {"Authorization": f"Bearer {COHERE_API_KEY}", "Content-Type": "application/json"}
    body = {"texts": texts, "model": EMBED_MODEL, "input_type": "search_document"}
    last_error = None
    for _ in range(retries):
        res = requests.post(COHERE_EMBED_URL, headers=headers, json=body, timeout=30)
        if res.status_code == 200:
            return res.json()["embeddings"]
        if res.status_code == 429:
            time.sleep(5)
            continue
        last_error = f"{res.status_code}: {res.text[:200]}"
        time.sleep(2)
    raise Exception(f"Cohere embed failed: {last_error}")


# ================================================================
# STATIC DATA — paste your full arrays here (same as the local
# version — this just moved to run inside a Vercel function instead)
# ================================================================

AKSHARALU = [
    {"letter": "అ", "word": "అరటి"}, {"letter": "ఆ", "word": "ఆవు"},
    # ... మీ పూర్తి 51 అక్షరాల జాబితా ఇక్కడ
]
SANDHI_RULES: list[dict] = [
    # ... మీ సంధి నియమాలు ఇక్కడ
]
SAMASA_TYPES: list[dict] = [
    # ... మీ సమాస రకాలు ఇక్కడ
]


def static_items() -> list[dict]:
    items = []
    for a in AKSHARALU:
        items.append({"text": f"అక్షరం {a['letter']} — ఉదాహరణ పదం: {a['word']}",
                       "title": a["letter"], "folder": "అక్షరమాల"})
    for rule in SANDHI_RULES:
        ex = "; ".join(f"{e['before']} → {e['after']}" for e in rule.get("examples", []))
        items.append({"text": f"{rule['name']}: {rule['rule']}. ఉదాహరణలు: {ex}",
                       "title": rule["name"], "folder": "సంధిమాల"})
    for s in SAMASA_TYPES:
        ex = "; ".join(f"{e['samasa']} = {e['vigraha']}" for e in s.get("examples", []))
        items.append({"text": f"{s['name']}: {s['definition']}. ఉదాహరణలు: {ex}",
                       "title": s["name"], "folder": "సమాసములు"})
    return items


def fetch_poems_flat(path: str, folder: str) -> list[dict]:
    res = requests.get(f"{BASE_URL}{path}", timeout=20)
    res.raise_for_status()
    data = res.json()
    return [{"text": f"{title}\n{content}", "title": title, "folder": folder}
            for title, content in data.items()]


def fetch_shatakamu_all() -> list[dict]:
    res = requests.get(f"{BASE_URL}/api/shatakamu?key=all", timeout=20)
    res.raise_for_status()
    poems = res.json().get("poems", res.json())
    return [{"text": f"{title}\n{content}", "title": title, "folder": "శతకాలమాల"}
            for title, content in poems.items()]


def build_full_index() -> list[dict]:
    items = static_items()
    items += fetch_poems_flat("/api/poems", "పద్యాలవాల")
    items += fetch_poems_flat("/api/mirapoems", "మిరా")
    items += fetch_shatakamu_all()

    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        vectors = embed_batch([item["text"] for item in batch])
        for item, vector in zip(batch, vectors):
            item["vector"] = vector

    return items


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if not COHERE_API_KEY:
                self._send_json(500, {"error": "COHERE_API_KEY సెట్ చేయలేదు."})
                return

            items = build_full_index()
            payload = json.dumps(items, ensure_ascii=False).encode("utf-8")

            result = vercel_blob.put(
                BLOB_PATHNAME,
                payload,
                {"addRandomSuffix": "false", "access": "public"},
            )

            self._send_json(200, {
                "success": True,
                "count": len(items),
                "size_kb": round(len(payload) / 1024, 1),
                "url": result["url"],
                "note": "ఈ url ను EMBEDDINGS_BLOB_URL గా Vercel Environment Variables లో పెట్టండి.",
            })
        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))