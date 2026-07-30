# api/rag_chat.py
#
# Query-time RAG endpoint for the భావాలమాల సహాయకుడు chat. Loads the
# pre-built Chroma index (from scripts/build_index.py — NOT rebuilt
# here), retrieves the most relevant items across ALL malas for the
# person's question, and asks the LLM to answer using only those
# retrieved items.
#
# LLM: Groq (genuinely free tier, no credit card) — 30 requests/min,
# 14,400 requests/day, no per-token charge on the free tier. This is
# NOT xAI's Grok (paid) — different company, different API, easy to
# mix up by name alone.
#
# All five LangChain fundamentals appear here:
#   PROMPT  — instructs the LLM to answer only from retrieved items
#   MODEL   — Groq's Llama 3.3 70B, via its OpenAI-compatible endpoint
#   TOOLS   — not needed — retrieval already tells us what's relevant,
#             no need for the LLM to decide which tool to call
#   MEMORY  — frontend sends prior turns each request (Vercel
#             functions are stateless between requests)
#   PARSER  — forces {answer, title, folder, content} every time
#
# HONEST NOTE ON HOSTING: the embedding model loaded here (to embed
# the user's query at request time) carries some size/cold-start
# cost — smaller than re-indexing everything, but not free. If this
# proves too heavy for Vercel's Python function limits, the fallback
# is the same lesson as PaddleOCR: host this endpoint as its own
# small separate service instead of inside the main project.

import os
import json
from http.server import BaseHTTPRequestHandler
from typing import List

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

# ── Loaded once per warm function instance, not per-request ──
_embeddings = None
_vectorstore = None


def get_vectorstore():
    global _embeddings, _vectorstore
    if _vectorstore is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
        )
        _vectorstore = Chroma(
            persist_directory="./chroma_index",  # committed alongside this function
            embedding_function=_embeddings,
        )
    return _vectorstore


# Groq — genuinely free tier, no credit card required. OpenAI-compatible
# endpoint, so ChatOpenAI works unchanged; only the base URL, key env
# var, and model name differ from a real OpenAI/xAI setup.
llm = ChatOpenAI(
    model="llama-3.3-70b-versatile",
    openai_api_key=os.environ.get("GROQ_API_KEY"),
    openai_api_base="https://api.groq.com/openai/v1",
    temperature=0,
)


class AssistantReply(BaseModel):
    answer: str = Field(description="యూజర్‌కి చెప్పే సహజమైన జవాబు")
    title: str = Field(description="సూచించిన అంశం యొక్క టైటిల్")
    folder: str = Field(description="ఏ మాల నుండి (పద్యాలవాల/సంధిమాల/సమాసములు/మొదలైనవి)")
    content: str = Field(description="అసలు పాఠ్యం, తీసుకొచ్చిన దాని నుండి మార్చకుండా")


parser = PydanticOutputParser(pydantic_object=AssistantReply)

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "మీరు రత్నాలబాల సహాయకుడు — పద్యాలు, కథలు, సామెతలు, సంధి, సమాసం, అక్షరమాల, "
        "గుణింతమాల, పదాలమాల — అన్ని మాలల డేటా మీ దగ్గర ఉంది. క్రింద ఇచ్చిన అంశాల నుండి "
        "మాత్రమే జవాబు ఇవ్వండి — కొత్తవి కల్పించకండి, పాఠ్యాన్ని మార్చకండి.\n\n"
        "అందుబాటులో ఉన్న సంబంధిత అంశాలు:\n{retrieved_items}\n\n"
        "{format_instructions}",
    ),
    MessagesPlaceholder(variable_name="chat_history"),
    ("user", "{input}"),
]).partial(format_instructions=parser.get_format_instructions())


def build_chat_history(history: List[dict]) -> list:
    messages = []
    for turn in history:
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            messages.append(AIMessage(content=turn["content"]))
    return messages


def run_rag(user_input: str, history: List[dict]) -> dict:
    vectorstore = get_vectorstore()

    # RETRIEVAL — finds the 5 closest items across ALL malas (poems,
    # sandhi rules, samasa types, words, letters — whatever matches
    # best), regardless of which mala they came from.
    docs = vectorstore.similarity_search(user_input, k=5)
    retrieved_text = "\n\n".join(
        f"[{d.metadata.get('folder', '?')}] {d.metadata.get('title', '?')}:\n{d.page_content}"
        for d in docs
    )

    chat_history = build_chat_history(history)
    messages = prompt.format_messages(
        input=user_input,
        chat_history=chat_history,
        retrieved_items=retrieved_text,
    )
    response = llm.invoke(messages)

    try:
        parsed: AssistantReply = parser.parse(response.content)
        return parsed.model_dump()
    except Exception:
        return {
            "answer": response.content,
            "title": docs[0].metadata.get("title", "") if docs else "",
            "folder": docs[0].metadata.get("folder", "") if docs else "",
            "content": docs[0].page_content if docs else "",
        }


class handler(BaseHTTPRequestHandler):
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