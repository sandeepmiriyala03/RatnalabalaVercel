# api/sametalu_agent.py
#
# THE ACTUAL PYTHON LANGGRAPH AGENT, deployed on Vercel — not a
# TypeScript rewrite. Place at project ROOT api/ folder (sibling to
# app/, NOT inside app/api/) — same rule that caused the very first
# "module not found" errors way back when paddleocr.py was
# accidentally placed inside app/api/ instead of root api/.
#
# Kept deliberately lean: langgraph + langchain-core + requests only.
# No langchain-groq (avoids pulling in extra transitive deps), no
# torch/chromadb/sentence-transformers (those were the actual cause
# of the earlier 1153MB bundle failure, not LangGraph itself).

import os
import json
import requests
from typing import TypedDict, Optional
from http.server import BaseHTTPRequestHandler
from langgraph.graph import StateGraph, END

BASE_URL = "https://ratnalabala.vercel.app"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

SAMETALU_FILES = [
    "a", "aa", "am", "ba", "bha", "ca", "cha", "da", "da2", "dha", "dha2",
    "e", "ee", "ga", "ha", "i", "ja", "ka", "ksha", "la", "ma", "na2",
    "o", "oo", "pa", "ra", "sa", "sha", "ssa", "tha2", "u", "uu", "va",
]

# Loaded once per warm function instance
_sametalu_cache: Optional[list[str]] = None


def load_all_sametalu() -> list[str]:
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


def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        raise Exception("GROQ_API_KEY సెట్ చేయలేదు.")
    res = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
        },
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["choices"][0]["message"]["content"]


# ================================================================
# 1. STATE
# ================================================================
class AgentState(TypedDict):
    word: str
    found_sameta: Optional[str]
    final_answer: Optional[str]


# ================================================================
# 2. NODES
# ================================================================
def search_node(state: AgentState) -> dict:
    sametalu = load_all_sametalu()
    word = state["word"]
    matches = [s for s in sametalu if word in s]
    return {"found_sameta": matches[0] if matches else None}


def explain_node(state: AgentState) -> dict:
    sameta = state["found_sameta"]
    explanation = call_groq(
        f"ఈ తెలుగు సామెతను ఒక విద్యార్థికి అర్థమయ్యేలా సులభంగా వివరించు: {sameta}"
    )
    return {"final_answer": f"సామెత: {sameta}\n\nఅర్థం: {explanation}"}


def not_found_node(state: AgentState) -> dict:
    word = state["word"]
    return {"final_answer": f"'{word}' అనే పదం ఉన్న సామెత దొరకలేదు. వేరే పదం ప్రయత్నించండి."}


# ================================================================
# 3. CONDITIONAL EDGE
# ================================================================
def route_after_search(state: AgentState) -> str:
    return "explain" if state["found_sameta"] else "not_found"


# ================================================================
# 4. BUILD + COMPILE — once, at module load time
# ================================================================
_graph = StateGraph(AgentState)
_graph.add_node("search", search_node)
_graph.add_node("explain", explain_node)
_graph.add_node("not_found", not_found_node)
_graph.set_entry_point("search")
_graph.add_conditional_edges(
    "search", route_after_search, {"explain": "explain", "not_found": "not_found"}
)
_graph.add_edge("explain", END)
_graph.add_edge("not_found", END)
compiled_graph = _graph.compile()


# ================================================================
# VERCEL HANDLER — frontend calls this directly via fetch (plain
# JSON request/response, not the AI SDK streaming protocol, since
# this is a raw Python function, not wrapped in the ai package).
# ================================================================
class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # CORS preflight — needed since the frontend calls this
        # directly with fetch(), not through Next.js's own routing.
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(content_length))
            word = data.get("word", "").strip()

            if not word:
                self._send_json(400, {"error": "'word' ఖాళీగా ఉంది"})
                return

            result = compiled_graph.invoke(
                {"word": word, "found_sameta": None, "final_answer": None}
            )
            self._send_json(200, {"answer": result["final_answer"]})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))