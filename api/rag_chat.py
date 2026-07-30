# api/rag_chat.py
#
# REWRITTEN to fix the 1153MB bundle size error. Removed: chromadb,
# langchain-community, langchain-huggingface (which pulled in
# sentence-transformers + torch). Added: a plain HTTP call to HF's
# hosted Inference API for embedding the user's query, and numpy for
# a simple cosine-similarity search against the precomputed vectors
# in embeddings_index.json (built by the rewritten build_index.py).
#
# This keeps the actual deployed function small — numpy is ~15-30MB,
# requests is tiny, langchain-openai/langchain-core are lightweight
# (just HTTP clients), nothing here needs a multi-hundred-MB ML
# framework bundled into the function itself.

import os
import json
import requests
import numpy as np
from http.server import BaseHTTPRequestHandler
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

HF_API_TOKEN = os.environ.get("HF_API_TOKEN")
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"

# Loaded once per warm function instance — the file itself is small
# (a few MB of vectors + text), not a multi-hundred-MB model.
_index_items = None


def get_index():
    global _index_items
    if _index_items is None:
        index_path = os.path.join(os.path.dirname(__file__), "embeddings_index.json")
        with open(index_path, "r", encoding="utf-8") as f:
            _index_items = json.load(f)
        # Pre-stack vectors into one numpy array for fast similarity math.
        for item in _index_items:
            item["_vec"] = np.array(item["vector"], dtype=np.float32)
    return _index_items


def embed_query(text: str) -> np.ndarray:
    """Same HF hosted API used at index-build time — must match, or
    the query vector won't be comparable to the document vectors."""
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    res = requests.post(HF_API_URL, headers=headers, json={"inputs": text})
    if res.status_code != 200:
        raise Exception(f"HF embedding API error {res.status_code}: {res.text}")
    vector = res.json()
    if isinstance(vector[0], list):
        vector = np.mean(np.array(vector), axis=0)
    return np.array(vector, dtype=np.float32)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


def retrieve(query: str, k: int = 5) -> list[dict]:
    index = get_index()
    query_vec = embed_query(query)
    scored = [
        (cosine_similarity(query_vec, item["_vec"]), item)
        for item in index
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:k]]


# Groq — genuinely free tier, no credit card. Created lazily (inside
# get_llm(), not at module import time) so a missing GROQ_API_KEY
# surfaces as a proper JSON error from our own handler, instead of
# crashing the whole module before any request can be processed —
# which is what was likely causing the "<!DOCTYPE..." HTML error page
# instead of a JSON response.
_llm = None


def get_llm():
    global _llm
    if _llm is None:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY సెట్ చేయలేదు — Vercel Environment Variables చెక్ చేయండి.")
        _llm = ChatOpenAI(
            model="llama-3.3-70b-versatile",
            openai_api_key=api_key,
            openai_api_base="https://api.groq.com/openai/v1",
            temperature=0,
        )
    return _llm


class AssistantReply(BaseModel):
    answer: str = Field(description="యూజర్‌కి చెప్పే సహజమైన జవాబు")
    title: str = Field(description="సూచించిన అంశం యొక్క టైటిల్")
    folder: str = Field(description="ఏ మాల నుండి")
    content: str = Field(description="అసలు పాఠ్యం, మార్చకుండా")


parser = PydanticOutputParser(pydantic_object=AssistantReply)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "మీరు రత్నాలబాల సహాయకుడు. క్రింద ఇచ్చిన అంశాల నుండి మాత్రమే జవాబు ఇవ్వండి — "
        "కొత్తవి కల్పించకండి.\n\nసంబంధిత అంశాలు:\n{retrieved_items}\n\n{format_instructions}",
    ),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
]).partial(format_instructions=parser.get_format_instructions())


def build_chat_history(history: List[dict]) -> list:
    messages = []
    for turn in history:
        messages.append(HumanMessage(content=turn["content"]) if turn["role"] == "user"
                         else AIMessage(content=turn["content"]))
    return messages


def run_rag(user_input: str, history: List[dict]) -> dict:
    docs = retrieve(user_input, k=5)
    retrieved_text = "\n\n".join(
        f"[{d['folder']}] {d['title']}:\n{d['text']}" for d in docs
    )

    messages = prompt.format_messages(
        input=user_input,
        chat_history=build_chat_history(history),
        retrieved_items=retrieved_text,
    )
    response = get_llm().invoke(messages)

    try:
        parsed: AssistantReply = parser.parse(response.content)
        return parsed.model_dump()
    except Exception:
        return {
            "answer": response.content,
            "title": docs[0]["title"] if docs else "",
            "folder": docs[0]["folder"] if docs else "",
            "content": docs[0]["text"] if docs else "",
        }


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Visiting this URL directly in a browser sends a GET, not a
        # POST — without this, that request had no defined behavior at
        # all, which is part of why visiting the URL directly showed a
        # generic browser error page.
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