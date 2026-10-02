import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda
from langgraph.graph import END, START, StateGraph

API_DIR = str(Path(__file__).resolve().parent)
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from _rag_chat import call_groq, retrieve


class ReadingState(TypedDict, total=False):
    favorites: list[dict[str, str]]
    recent: list[dict[str, str]]
    candidates: list[dict[str, str]]
    recommendation: dict[str, str]


PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "మీరు తెలుగు సాహిత్య పఠన సహాయకుడు. ఇవ్వబడిన candidates నుంచే ఒక అంశాన్ని ఎంచుకోండి; "
        "కొత్త శీర్షిక లేదా పద్యం కల్పించవద్దు. JSON మాత్రమే ఇవ్వండి: "
        '{{"title":"...","folder":"...","reason":"..."}}. reason ఒక చిన్న తెలుగు వాక్యం కావాలి.',
    ),
    (
        "human",
        "ఇష్టమైనవి: {favorites}\nఇటీవల చదివినవి: {recent}\nఅందుబాటులో ఉన్న candidates: {candidates}",
    ),
])


def _run_groq(prompt_value):
    messages = []
    for message in prompt_value.to_messages():
        role = "assistant" if message.type == "ai" else message.type
        content = message.content if isinstance(message.content, str) else json.dumps(message.content, ensure_ascii=False)
        messages.append({"role": role, "content": content})
    return call_groq(messages)


recommendation_chain = PROMPT | RunnableLambda(_run_groq)


def _clean_items(value) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value[:8]:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        module = item.get("module")
        if isinstance(title, str) and isinstance(module, str):
            cleaned.append({
                "title": title.strip()[:160],
                "module": module.strip()[:80],
            })
    return [item for item in cleaned if item["title"]]


def _retrieve_candidates(state: ReadingState) -> ReadingState:
    preferences = state["favorites"] + state["recent"]
    query = "తెలుగు సాహిత్య పఠన సూచన. " + "; ".join(
        f"{item['module']}: {item['title']}" for item in preferences
    )
    documents = retrieve(query[:1200], k=8)
    candidates = [
        {
            "folder": str(document.get("folder", ""))[:100],
            "title": str(document.get("title", ""))[:160],
            "text": str(document.get("text", ""))[:700],
        }
        for document in documents
        if document.get("title") and document.get("text")
    ]
    return {"candidates": candidates}


def _choose_candidate(state: ReadingState) -> ReadingState:
    candidates = state.get("candidates", [])
    if not candidates:
        raise ValueError("No recommendation candidates found")

    raw = recommendation_chain.invoke({
        "favorites": json.dumps(state["favorites"], ensure_ascii=False),
        "recent": json.dumps(state["recent"], ensure_ascii=False),
        "candidates": json.dumps(candidates, ensure_ascii=False),
    })
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        parsed = {}

    selected = next(
        (
            candidate for candidate in candidates
            if candidate["title"] == parsed.get("title")
            and candidate["folder"] == parsed.get("folder")
        ),
        candidates[0],
    )
    reason = parsed.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        reason = "మీరు చదివిన తెలుగు సాహిత్యానికి దగ్గరగా ఉన్న అంశం."

    return {
        "recommendation": {
            "title": selected["title"],
            "folder": selected["folder"],
            "reason": reason.strip()[:240],
        }
    }


workflow = StateGraph(ReadingState)
workflow.add_node("retrieve_candidates", _retrieve_candidates)
workflow.add_node("choose_candidate", _choose_candidate)
workflow.add_edge(START, "retrieve_candidates")
workflow.add_edge("retrieve_candidates", "choose_candidate")
workflow.add_edge("choose_candidate", END)
reading_graph = workflow.compile()


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 12000:
                self._send_json(413, {"error": "అభ్యర్థన చాలా పెద్దది."})
                return

            try:
                data = json.loads(self.rfile.read(content_length))
            except json.JSONDecodeError:
                self._send_json(400, {"error": "చెల్లని JSON అభ్యర్థన."})
                return
            if not isinstance(data, dict):
                self._send_json(400, {"error": "చెల్లని అభ్యర్థన."})
                return

            favorites = _clean_items(data.get("favorites"))
            recent = _clean_items(data.get("recent"))
            if not favorites and not recent:
                self._send_json(400, {"error": "ముందుగా కొన్ని అంశాలు చదవండి లేదా ఇష్టమైనవిగా ఎంచుకోండి."})
                return

            result = reading_graph.invoke({"favorites": favorites, "recent": recent})
            self._send_json(200, {"recommendation": result["recommendation"]})
        except Exception as error:
            print(f"[Reading recommendations] Failed: {type(error).__name__}")
            self._send_json(500, {"error": "సూచన రూపొందించలేకపోయాం. API అమరికను పరిశీలించండి."})

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
