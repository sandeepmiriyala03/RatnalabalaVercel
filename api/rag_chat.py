# api/rag_chat.py
#
# FINAL, ULTRA-LEAN VERSION — removes LangChain, numpy, and pydantic
# entirely. All this endpoint actually does is: (1) call HF's hosted
# API to embed the query, (2) compare that vector against precomputed
# vectors with plain-Python math, (3) call Groq's chat API directly.
# None of that needs a framework — `requests` alone is a few hundred
# KB, versus the hundreds of MB LangChain + numpy + pydantic were
# adding for marginal benefit on a task this simple.
#
# Only dependency: requests

import os
import json
import math
import requests
from http.server import BaseHTTPRequestHandler
from typing import List

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"

# ── Loaded once per warm function instance ──
_index_items = None


def get_index() -> list[dict]:
    global _index_items
    if _index_items is None:
        index_path = os.path.join(os.path.dirname(__file__), "embeddings_index.json")
        with open(index_path, "r", encoding="utf-8") as f:
            _index_items = json.load(f)
    return _index_items


def embed_query(text: str) -> list[float]:
    if not HF_API_TOKEN:
        raise Exception("HF_API_TOKEN సెట్ చేయలేదు — Vercel Environment Variables చెక్ చేయండి.")
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    res = requests.post(HF_API_URL, headers=headers, json={"inputs": text})
    if res.status_code != 200:
        raise Exception(f"HF embedding API error {res.status_code}: {res.text}")
    vector = res.json()
    if isinstance(vector[0], list):
        # average token-level vectors into one sentence-level vector —
        # plain Python, no numpy
        n_tokens = len(vector)
        dim = len(vector[0])
        return [sum(vector[t][d] for t in range(n_tokens)) / n_tokens for d in range(dim)]
    return vector


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve(query: str, k: int = 5) -> list[dict]:
    index = get_index()
    query_vec = embed_query(query)
    scored = [(cosine_similarity(query_vec, item["vector"]), item) for item in index]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:k]]


def call_groq(messages: list[dict]) -> str:
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY సెట్ చేయలేదు — Vercel Environment Variables చెక్ చేయండి.")
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0,
    }
    res = requests.post(GROQ_CHAT_URL, headers=headers, json=body)
    if res.status_code != 200:
        raise Exception(f"Groq API error {res.status_code}: {res.text}")
    return res.json()["choices"][0]["message"]["content"]


def build_prompt_messages(user_input: str, history: List[dict], retrieved_text: str) -> list[dict]:
    system_message = (
        "మీరు రత్నాలబాల సహాయకుడు. క్రింద ఇచ్చిన అంశాల నుండి మాత్రమే జవాబు ఇవ్వండి — "
        "కొత్తవి కల్పించకండి. మీ జవాబును ఖచ్చితంగా ఈ JSON ఆకృతిలో మాత్రమే ఇవ్వండి, "
        "వేరే ఏమీ రాయకండి:\n"
        '{"answer": "...", "title": "...", "folder": "...", "content": "..."}\n\n'
        f"సంబంధిత అంశాలు:\n{retrieved_text}"
    )
    messages = [{"role": "system", "content": system_message}]
    messages.extend(history)  # already {"role": "user"/"assistant", "content": "..."}
    messages.append({"role": "user", "content": user_input})
    return messages


def run_rag(user_input: str, history: List[dict]) -> dict:
    docs = retrieve(user_input, k=5)
    retrieved_text = "\n\n".join(
        f"[{d['folder']}] {d['title']}:\n{d['text']}" for d in docs
    )

    messages = build_prompt_messages(user_input, history, retrieved_text)
    raw_response = call_groq(messages)

    try:
        parsed = json.loads(raw_response)
        return {
            "answer": parsed.get("answer", raw_response),
            "title": parsed.get("title", docs[0]["title"] if docs else ""),
            "folder": parsed.get("folder", docs[0]["folder"] if docs else ""),
            "content": parsed.get("content", docs[0]["text"] if docs else ""),
        }
    except (json.JSONDecodeError, KeyError):
        # Model didn't follow the JSON format exactly — fall back to
        # plain text rather than crashing the request.
        return {
            "answer": raw_response,
            "title": docs[0]["title"] if docs else "",
            "folder": docs[0]["folder"] if docs else "",
            "content": docs[0]["text"] if docs else "",
        }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._send_json(200, {
            "status": "ok",
            "message": "ఈ endpoint POST రిక్వెస్ట్‌లు మాత్రమే స్వీకరిస్తుంది. {message, history} JSON body పంపండి.",
        })

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(content_length))
            user_input = data.get("message", "").strip()
            history = data.get("history", [])

            if not user_input:
                self._send_json(400, {"error": "'message' ఖాళీగా ఉంది"})
                return

            result = run_rag(user_input, history)
            self._send_json(200, result)
        except Exception as e:
            self._send_json(500, {"error": f"లోపం: {str(e)}"})

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))