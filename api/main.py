"""
api/main.py

Flat Python Serverless Function for Vercel — filename is literally
main.py (not index.py) as requested, which means it CANNOT live inside
an api/main/ folder: Vercel's folder-based routing only maps a folder
to its parent's clean URL when the entry file is named index.py
(api/main/index.py -> /api/main). A folder containing main.py would
route to /api/main/main instead. So this lives as a flat file at
api/main.py, which routes to /api/main directly — same URL as before.

Trade-off from flattening: this file no longer has its OWN
requirements.txt. It now shares api/requirements.txt with the other
flat functions (build_index.py, sametalu_agent.py, aksharamala.py,
etc.) — see that file's comments for the size-history context on why
that sharing is handled carefully. httpx/edge-tts/beautifulsoup4 have
been added there for this file's use.

  GET  /api/main?endpoint=fonts                          → font catalog
  GET  /api/main?endpoint=font_agent&content_type=...     → font decision agent
  POST /api/main?endpoint=svara          body: {text, voice}         → Svara TTS (audio/wav)
  POST /api/main?endpoint=tts            body: {text, voice, speed}  → Sarvam/Edge TTS (audio, chunked+parallel)
  POST /api/main?endpoint=extract-news   body: {url}                 → {text} (JSON)

NOTE: the News Reader frontend (components/TeluguNewsReader.tsx)
no longer calls the ?endpoint=tts route above — it now calls the real
app/api/tts/route.ts directly (the shared TTS contract used by
PoemCard/PoemRadio/TeluguVoice). ?endpoint=tts still works standalone
if anything else wants it; ?endpoint=svara and ?endpoint=extract-news
remain in active use.

CHANGELOG (fixes accumulated across this file's history):
  - Sarvam speaker names were WRONG before ("meera"/"arjun" don't
    exist). Verified against Sarvam's current docs: bulbul:v2's real
    speakers are anushka (female) / abhilash (male). "model" field
    added too — it was missing.
  - Sanitizer was stripping plain ASCII digits (0-9), which silently
    deleted every number from news text before TTS ever saw it.
    Digits, ₹, % and hyphen are now preserved.
  - Svara TTS calls the Space's plain REST "call API" via httpx (no
    gradio_client, which alone was ~300MB of transitive deps).
  - Svara's gender check was an exact case-sensitive string match
    ("female" only) that silently fell back to Male on any mismatch —
    now case/whitespace-insensitive, and logs what it received.
  - Svara's SSE response parsing grabbed the FIRST "data:" line
    regardless of its preceding "event:" line — usually a heartbeat's
    "data: null" during Space cold-start, causing a false "no data"
    error. Now tracks event type properly and only accepts "complete".

Deploy notes:
  - Vercel's Python runtime uses the `handler` class below directly —
    no ASGI, no FastAPI/uvicorn.
  - Set SARVAM_API_KEY for the sarvam-* voices, HF_TOKEN (optional)
    for Svara rate limits.
  - IMPORTANT — same caveat as always: Svara's `data` array order
    (language, gender, text, temperature, top_p, repetition_penalty,
    max_new_tokens) is a best-effort match to the Space's component
    order. Verify via "Use via API" at https://kenpath-svara-tts.hf.space
    before trusting this in production.
"""

import asyncio
import base64
import io
import json
import os
import re
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import httpx

# ═══════════════════════════════════════════════════════════════
# FONTS ENDPOINT
# ═══════════════════════════════════════════════════════════════

FONT_CATALOG = [
    {"label": "గురజాడ", "value": "Gurajada"},
    {"label": "ఎన్‌టిఆర్", "value": "NTR"},
    {"label": "రమణీయ", "value": "Ramaneeya"},
    {"label": "వేటూరి", "value": "Veturi"},
    {"label": "సిరివెన్నెల", "value": "Sirivennela"},
    {"label": "చతుర (Thin)", "value": "Chathura-Thin"},
    {"label": "చతుర (Light)", "value": "Chathura-Light"},
    {"label": "చతుర (Regular)", "value": "Chathura-Regular"},
    {"label": "చతుర (Bold)", "value": "Chathura-Bold"},
    {"label": "చతుర (ExtraBold)", "value": "Chathura-ExtraBold"},
    {"label": "రామరాజ", "value": "Ramaraja"},
    {"label": "రవి ప్రకాష్", "value": "RaviPrakash"},
    {"label": "తెనాలి రామకృష్ణ", "value": "TenaliRamakrishna"},
    {"label": "తిమ్మన", "value": "Timmana"},
    {"label": "టానా", "value": "TANA"},
    {"label": "గిడుగు", "value": "Gidugu"},
    {"label": "గిడుగు (ఇటాలిక్)", "value": "Gidugu-Italic"},
    {"label": "లక్కిరెడ్డి", "value": "LakkiReddy"},
    {"label": "నందకం", "value": "Nandakam"},
    {"label": "నందకం (ఇటాలిక్)", "value": "Nandakam-Italic"},
    {"label": "పెద్దన", "value": "Peddana"},
    {"label": "పురుషోత్తమ", "value": "Purushothamaa"},
    {"label": "పురుషోత్తమ (ఇటాలిక్)", "value": "Purushothamaa-Italic"},
    {"label": "రామభద్ర", "value": "Ramabhadra"},
    {"label": "రామభద్ర (ఇటాలిక్)", "value": "Ramabhadra-Italic"},
    {"label": "శ్రీ కృష్ణదేవరాయ", "value": "SreeKrushnadevaraya"},
    {"label": "శ్రీ కృష్ణదేవరాయ (ఇటాలిక్)", "value": "SreeKrushnadevaraya-Italic"},
    {"label": "సురన్న (Regular)", "value": "Suranna-Regular"},
    {"label": "సురన్న (Bold)", "value": "Suranna-Bold"},
    {"label": "సురన్న (Italic)", "value": "Suranna-Italic"},
    {"label": "సురన్న (Bold Italic)", "value": "Suranna-BoldItalic"},
    {"label": "సురవరం", "value": "Suravaram"},
    {"label": "సురవరం (ఇటాలిక్)", "value": "Suravaram-Italic"},
    {"label": "పొన్నల", "value": "Ponnala-Regular"},
    {"label": "అన్నమయ్య", "value": "Annamayya"},
    {"label": "అన్నమయ్య (Bold)", "value": "Annamayya-Bold"},
    {"label": "అన్నమయ్య (Italic)", "value": "Annamayya-Italic"},
    {"label": "అన్నమయ్య (Bold Italic)", "value": "Annamayya-BoldItalic"},
    {"label": "ధూర్జటి", "value": "Dhurjati"},
    {"label": "ధూర్జటి (ఇటాలిక్)", "value": "Dhurjati-Italic"},
    {"label": "జిమ్స్", "value": "JIMS"},
    {"label": "జిమ్స్ (ఇటాలిక్)", "value": "JIMS-Italic"},
    {"label": "కనకదుర్గ", "value": "KanakaDurga"},
    {"label": "కనకదుర్గ (ఇటాలిక్)", "value": "KanakaDurga-Italic"},
    {"label": "మండలి (Regular)", "value": "Mandali-Regular"},
    {"label": "మండలి (Bold)", "value": "Mandali-Bold"},
    {"label": "మండలి (Italic)", "value": "Mandali-Italic"},
    {"label": "మండలి (Bold Italic)", "value": "Mandali-BoldItalic"},
    {"label": "పొట్టి శ్రీరాములు", "value": "PottiSreeramulu"},
    {"label": "తిరొ సుందర తెలుగు", "value": "TiroSundaraTelugu-Regular"},
      {"label": "నాట్స్", "value": "NATS"},
    {"label": "నాట్స్ (ఇటాలిక్)", "value": "NATS-Italic"},
]


def handle_fonts():
    return 200, FONT_CATALOG


# ═══════════════════════════════════════════════════════════════
# FONT AGENT ENDPOINT
# ═══════════════════════════════════════════════════════════════

UI_FONTS = ["Mandali-Regular", "NTR"]
SLOKA_FONTS = ["Annamayya", "SreeKrushnadevaraya", "Gurajada"]
HEADING_FONTS = ["Chathura-ExtraBold", "Suranna-Bold"]


def decide_font(content_type: str, width: int) -> dict:
    is_narrow = width < 600

    if content_type == "sloka":
        font = SLOKA_FONTS[0]
        size_multiplier = 0.95 if is_narrow else 1.1
        size_note = "చిన్న స్క్రీన్ కోసం తగ్గించిన సైజ్‌లో" if is_narrow else "చదవడానికి వీలుగా కొంచెం పెద్ద సైజ్‌లో"
        reason = f"శ్లోకం/పద్య కంటెంట్ — సంప్రదాయ, కళాత్మక ఫాంట్‌ను {size_note} ఎంచుకున్నాను."
    elif content_type == "heading":
        font = HEADING_FONTS[0]
        size_multiplier = 1.0 if is_narrow else 1.2
        reason = "శీర్షిక/టైటిల్ టెక్స్ట్ — బోల్డ్, ప్రభావవంతమైన ఫాంట్‌ను ఎంచుకున్నాను."
    else:
        font = UI_FONTS[0]
        size_multiplier = 0.9 if is_narrow else 1.0
        size_note = "చిన్న ఫోన్ సైజ్‌లలో" if is_narrow else "సాధారణ డెస్క్‌టాప్ సైజ్‌లో"
        reason = f"సాధారణ UI టెక్స్ట్ — {size_note} స్పష్టంగా కనిపించేలా రూపొందించిన ఫాంట్‌ను ఎంచుకున్నాను."

    return {"fontFamily": font, "fontSizeMultiplier": size_multiplier, "reason": reason}


def handle_font_agent(query: dict):
    content_type = query.get("content_type", ["ui"])[0]
    try:
        width = int(query.get("width", ["1024"])[0])
    except ValueError:
        width = 1024

    return 200, decide_font(content_type, width)


# ═══════════════════════════════════════════════════════════════
# SVARA TTS — plain REST "call API" against the HF Space, no gradio_client
# ═══════════════════════════════════════════════════════════════

SVARA_SPACE_BASE = "https://kenpath-svara-tts.hf.space"
SVARA_API_NAME = "generate_speech"

_HF_TOKEN = os.environ.get("HF_TOKEN", "")


def _svara_headers() -> dict:
    headers = {"Content-Type": "application/json"}
    if _HF_TOKEN:
        headers["Authorization"] = f"Bearer {_HF_TOKEN}"
    return headers


def handle_svara_tts(text: str, voice_choice: str) -> tuple[bytes, str]:
    """Generate Telugu speech via the Svara Space's plain REST call API.

    Gradio 4+'s "call API" is a two-step HTTP exchange:
      1. POST /gradio_api/call/<api_name>  {"data": [...]}  -> {"event_id": "..."}
      2. GET  /gradio_api/call/<api_name>/<event_id>        -> a text/event-stream
         of MULTIPLE messages, each shaped like:
             event: <type>
             data: <json>
         Typical event types: "heartbeat" (data: null, sent repeatedly
         while the Space is cold-starting/queued — Zero-GPU Spaces do
         this often), "error" (data carries error info), and finally
         "complete" (data carries the real result array).

    FIX: this previously grabbed the FIRST "data:" line seen, with no
    regard for which "event:" line preceded it. That line is very often
    a heartbeat's "data: null" — which is falsy in Python, so the old
    `if not result_data: raise ...` fired immediately with "returned no
    data", when in reality the Space just hadn't finished yet. Now the
    event type is tracked properly: heartbeats are skipped and waited
    past, "error" raises immediately with the real error payload, and
    only "complete" is accepted as the final result.
    """
    # FIX: this used to be `"Female" if voice_choice == "female" else "Male"`
    # — an exact, case-sensitive match. Any mismatch (e.g. "Female" with a
    # capital F, a trimmed/stray space, or an unexpected value from the
    # caller) silently fell through to "Male" with NO error at all — which
    # exactly matches "female never works, male always works" as a symptom.
    # Now: case/whitespace-insensitive, and logs exactly what was received
    # so a real mismatch shows up in Vercel logs instead of hiding forever.
    normalized = (voice_choice or "").strip().lower()
    gender = "Female" if normalized in ("female", "f", "woman") else "Male"
    print(f"[Svara TTS] received voice_choice={voice_choice!r} -> gender={gender}")

    payload = {
        "data": [
            "Telugu (తెలుగు)",  # language
            gender,  # gender
            text,  # text
            0.7,  # temperature
            0.8,  # top_p
            1.1,  # repetition_penalty
            1200,  # max_new_tokens
        ]
    }

    call_url = f"{SVARA_SPACE_BASE}/gradio_api/call/{SVARA_API_NAME}"

    with httpx.Client(timeout=90, headers=_svara_headers()) as client:
        post_res = client.post(call_url, json=payload)
        post_res.raise_for_status()
        event_id = post_res.json()["event_id"]
        print(f"[Svara TTS] event_id={event_id!r}, streaming for result...")

        result_data = None
        current_event = None
        with client.stream("GET", f"{call_url}/{event_id}") as stream:
            for line in stream.iter_lines():
                if not line:
                    continue  # blank line = message boundary in SSE, not an error

                if line.startswith("event:"):
                    current_event = line[len("event:"):].strip()
                    print(f"[Svara TTS] SSE event: {current_event}")
                    continue

                if not line.startswith("data:"):
                    continue

                data_str = line[len("data:"):].strip()

                if current_event == "heartbeat":
                    # Space still queued/cold-starting — keep waiting.
                    continue

                if current_event == "error":
                    raise RuntimeError(f"Svara Space reported an error: {data_str[:300]}")

                try:
                    parsed = json.loads(data_str)
                except json.JSONDecodeError:
                    continue

                if parsed is None:
                    # A null payload under a non-heartbeat/non-error event
                    # label (e.g. an unlabeled keep-alive) — keep waiting
                    # rather than treating this as the final result.
                    continue

                result_data = parsed
                if current_event == "complete" or current_event is None:
                    break

    if not result_data:
        raise RuntimeError(
            "Svara Space closed the stream without sending a 'complete' event. "
            "This usually means the Space is asleep/cold-starting and took "
            "longer than the request timeout — try again in a moment."
        )

    audio_info = result_data[0] if isinstance(result_data, list) else result_data
    audio_path = None
    if isinstance(audio_info, dict):
        audio_path = audio_info.get("url") or audio_info.get("path") or audio_info.get("name")
    elif isinstance(audio_info, str):
        audio_path = audio_info

    if not audio_path:
        raise RuntimeError(f"Svara Space returned an unsupported audio result: {result_data!r}")

    audio_url = (
        audio_path
        if audio_path.startswith("http")
        else f"{SVARA_SPACE_BASE}/gradio_api/file={audio_path}"
    )

    with httpx.Client(timeout=30, headers=_svara_headers()) as client:
        audio_res = client.get(audio_url)
        audio_res.raise_for_status()
        return audio_res.content, "audio/wav"


# ═══════════════════════════════════════════════════════════════
# NEWS TTS — sanitizer + chunking + Sarvam/Edge dual engine
# ═══════════════════════════════════════════════════════════════

# Telugu Unicode block + ASCII digits (FIX: were missing, silently
# deleting every number from news text) + currency/percent/hyphen +
# sentence punctuation + Telugu danda marks + whitespace.
_ALLOWED_RE = re.compile(r"[^\u0C00-\u0C7F0-9₹%\-.?,!\u0964\u0965\s]")
_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_telugu(text: str) -> str:
    text = _ALLOWED_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text


MAX_CHUNK_CHARS = 500


def chunk_text(text: str, max_chars: int = MAX_CHUNK_CHARS) -> list[str]:
    sentences = re.split(r"(?<=[.?!\u0964\u0965])\s+|\n+", text)
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip()
            continue

        if current:
            chunks.append(current)
            current = ""

        if len(sentence) > max_chars:
            for i in range(0, len(sentence), max_chars):
                chunks.append(sentence[i : i + max_chars])
        else:
            current = sentence

    if current:
        chunks.append(current)

    return chunks or ([text] if text else [])


SARVAM_API_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")

# Verified against Sarvam's current docs. bulbul:v2 speakers — Female:
# anushka, manisha, vidya, arya. Male: abhilash, karun, hitesh. The old
# "meera"/"arjun" values don't exist on any Sarvam model.
SARVAM_MODEL = "bulbul:v2"
SARVAM_SPEAKERS = {
    "sarvam-te-female": "anushka",
    "sarvam-te-male": "abhilash",
}


async def synth_sarvam(text: str, voice: str, speed: float) -> bytes:
    if not SARVAM_API_KEY:
        raise RuntimeError("SARVAM_API_KEY is not configured on the server.")

    speaker = SARVAM_SPEAKERS[voice]
    pace = max(0.3, min(3.0, speed))
    print(f"[News TTS/Sarvam] voice={voice!r} -> speaker={speaker!r}, pace={pace}")

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            SARVAM_API_URL,
            headers={"api-subscription-key": SARVAM_API_KEY},
            json={
                "inputs": [text],
                "target_language_code": "te-IN",
                "model": SARVAM_MODEL,
                "speaker": speaker,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
                "pace": pace,
            },
        )
        if res.status_code >= 400:
            raise RuntimeError(f"Sarvam API {res.status_code}: {res.text[:300]}")
        data = res.json()
        return base64.b64decode(data["audios"][0])


async def synth_edge(text: str, voice: str, speed: float) -> bytes:
    import edge_tts

    rate_pct = int(round((speed - 1.0) * 100))
    rate_str = f"{'+' if rate_pct >= 0 else ''}{rate_pct}%"

    communicator = edge_tts.Communicate(text, voice=voice, rate=rate_str)
    buf = io.BytesIO()
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])

    audio_bytes = buf.getvalue()
    if not audio_bytes:
        raise RuntimeError(f"Edge TTS returned no audio for voice '{voice}'.")
    return audio_bytes


async def synth_chunk(text: str, voice: str, speed: float) -> bytes:
    if voice.startswith("sarvam-"):
        return await synth_sarvam(text, voice, speed)
    return await synth_edge(text, voice, speed)


async def _run_tts_pipeline_async(clean_text: str, voice: str, speed: float) -> bytes:
    chunks = chunk_text(clean_text)
    parts = await asyncio.gather(*(synth_chunk(c, voice, speed) for c in chunks))
    return b"".join(parts)


def handle_tts(text: str, voice: str, speed: float) -> tuple[bytes, str, str]:
    """Returns (audio_bytes, content_type, file_extension)."""
    print(f"[News TTS] request received: voice={voice!r}, speed={speed!r}")

    clean = sanitize_telugu(text)
    if not clean:
        raise ValueError("టెక్స్ట్ ఖాళీగా ఉంది లేదా తెలుగు అక్షరాలు కనిపించలేదు.")

    valid_voices = {"sarvam-te-female", "sarvam-te-male", "te-IN-ShrutiNeural", "te-IN-MohanNeural"}
    if voice not in valid_voices:
        raise ValueError(f"చెల్లని వాయిస్: {voice}")

    speed = max(0.5, min(2.0, speed))

    audio_bytes = asyncio.run(_run_tts_pipeline_async(clean, voice, speed))

    if voice.startswith("sarvam-"):
        return audio_bytes, "audio/wav", "wav"
    return audio_bytes, "audio/mpeg", "mp3"


def handle_extract_news(url: str) -> str:
    from bs4 import BeautifulSoup

    browser_headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "te-IN,te;q=0.9,en-IN;q=0.8,en;q=0.7",
    }

    # Some sites (confirmed with redbeenews.com — the exact same URL
    # failed 3+ times in a row, then succeeded on a later attempt with
    # zero code changes) block requests inconsistently rather than
    # permanently. That's the kind of transient failure any HTTP client
    # should tolerate with retries — the same pattern you'd use for a
    # flaky server or rate limiter. Increased from 3→5 attempts with
    # growing delays between them, based on that direct evidence that
    # persistence alone (not spoofing, not proxies) measurably helps
    # here. Total added wait in the worst case is ~13s (2+3+4+4s), so
    # this stays comfortably under typical serverless function time
    # limits even when every attempt but the last one fails.
    MAX_ATTEMPTS = 5
    RETRY_DELAYS_SECONDS = [2, 3, 4, 4]  # one fewer than MAX_ATTEMPTS

    res = None
    last_error: httpx.HTTPStatusError | None = None

    with httpx.Client(timeout=15, follow_redirects=True, headers=browser_headers) as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                res = client.get(url)
                res.raise_for_status()
                last_error = None
                break
            except httpx.HTTPStatusError as e:
                last_error = e
                if e.response.status_code in (403, 429) and attempt < MAX_ATTEMPTS:
                    delay = RETRY_DELAYS_SECONDS[attempt - 1]
                    print(
                        f"[extract-news] {url} got {e.response.status_code} "
                        f"on attempt {attempt}/{MAX_ATTEMPTS}, retrying in {delay}s..."
                    )
                    time.sleep(delay)
                    continue
                break

    if last_error is not None:
        if last_error.response.status_code in (403, 429):
            raise ValueError(
                "ఈ వెబ్‌సైట్ బాట్ డిటెక్షన్‌తో ఆటోమేటిక్ రిక్వెస్ట్‌లను బ్లాక్ చేస్తోంది "
                f"({MAX_ATTEMPTS} ప్రయత్నాల తర్వాత కూడా) — ఇది ఈ సైట్ యొక్క పరిమితి, "
                "మా కోడ్‌లో బగ్ కాదు. దయచేసి ఆర్టికల్ టెక్స్ట్‌ను నేరుగా కాపీ-పేస్ట్ చేయండి "
                "లేదా కొద్దిసేపు తర్వాత మళ్లీ ప్రయత్నించండి."
            )
        raise last_error

    soup = BeautifulSoup(res.text, "html.parser")

    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "form"]):
        tag.decompose()

    # ── Try common article-body container selectors first, in priority
    # order. Most Indian news CMS templates (Eenadu, Sakshi, TV9, ABN
    # Andhra Jyothy, etc.) use SOME dedicated content div even when they
    # skip the semantic <article> tag — these are the most common class
    # names seen across that family of sites. Verified reachable
    # (eenadu.net) but NOT verified against raw HTML from this
    # environment (network access here can't run BeautifulSoup against
    # arbitrary live sites) — if a given site's real class name isn't in
    # this list, it silently falls through to the page-wide fallback
    # below rather than failing outright.
    CONTENT_SELECTORS = [
        "article",
        '[itemprop="articleBody"]',
        ".story-content", ".storycontent", ".story_content",
        ".article-content", ".articlebodycontent", ".article-body",
        ".content-body", ".entry-content", ".post-content",
        ".detail-content", ".full-details", ".art-content",
        ".fullstory", ".storyPage", ".story-details",
    ]

    candidates = None
    for selector in CONTENT_SELECTORS:
        container = soup.select_one(selector)
        if container:
            found = container.find_all("p")
            if found:
                candidates = found
                break

    if candidates is None:
        # No known container matched — fall back to EVERY <p> on the
        # page, but only keep the LARGEST CONTIGUOUS run of qualifying
        # (>40 char) paragraphs, not every long paragraph anywhere on
        # the page. Real article bodies are one continuous block of
        # consecutive <p> tags in the DOM; sidebar/related-story/
        # most-read sections are separated from that block by other
        # tags (headings, links, images) in between. This keeps a
        # single scattered long teaser from a "most read" list out of
        # the extracted text, without needing to know the site's exact
        # class names.
        all_p = soup.find_all("p")
        best_run: list = []
        current_run: list = []
        for p in all_p:
            text = p.get_text(" ", strip=True)
            if len(text) > 40:
                current_run.append(p)
                if len(current_run) > len(best_run):
                    best_run = current_run
            else:
                current_run = []
        candidates = best_run

    paragraphs = [p.get_text(" ", strip=True) for p in candidates]
    paragraphs = [p for p in paragraphs if len(p) > 40]

    text = sanitize_telugu("\n\n".join(paragraphs))
    if not text:
        raise ValueError("ఈ లింక్ నుండి తెలుగు ఆర్టికల్ టెక్స్ట్ దొరకలేదు.")

    return text


# ═══════════════════════════════════════════════════════════════
# HANDLER
# ═══════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_audio(self, audio_bytes: bytes, content_type: str, filename: str):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(audio_bytes)))
        self.end_headers()
        self.wfile.write(audio_bytes)

    def _read_json_body(self) -> dict:
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        return json.loads(body) if body else {}

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        if endpoint == "fonts":
            status, payload = handle_fonts()
        elif endpoint == "font_agent":
            status, payload = handle_font_agent(query)
        else:
            status, payload = 400, {
                "error": "Missing or invalid ?endpoint= param. Use 'fonts' or 'font_agent'."
            }

        self._send_json(status, payload)

    def do_POST(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        endpoint = query.get("endpoint", [""])[0]

        try:
            payload = self._read_json_body()
        except (ValueError, json.JSONDecodeError):
            self._send_json(400, {"error": "Invalid JSON body."})
            return

        if endpoint == "svara":
            text = (payload.get("text") or "").strip()
            voice_choice = payload.get("voice", "male")
            if not text:
                self._send_json(400, {"error": "Missing 'text' field."})
                return
            try:
                audio_bytes, content_type = handle_svara_tts(text, voice_choice)
                self._send_audio(audio_bytes, content_type, "svara_output.wav")
            except Exception as e:
                print(f"[Svara TTS] generation failed: {e}")
                self._send_json(502, {"error": f"Svara TTS generation failed: {e}"})

        elif endpoint == "tts":
            text = (payload.get("text") or "").strip()
            voice = payload.get("voice", "te-IN-ShrutiNeural")
            speed = payload.get("speed", 1.0)
            if not text:
                self._send_json(400, {"detail": "Missing 'text' field."})
                return
            try:
                audio_bytes, content_type, ext = handle_tts(text, voice, float(speed))
                stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                self._send_audio(audio_bytes, content_type, f"telugu_news_{stamp}.{ext}")
            except ValueError as e:
                self._send_json(400, {"detail": str(e)})
            except Exception as e:
                print(f"[News TTS] generation failed: {e}")
                self._send_json(502, {"detail": f"TTS generation failed: {e}"})

        elif endpoint == "extract-news":
            url = (payload.get("url") or "").strip()
            if not url:
                self._send_json(400, {"detail": "Missing 'url' field."})
                return
            try:
                text = handle_extract_news(url)
                self._send_json(200, {"text": text})
            except ValueError as e:
                self._send_json(422, {"detail": str(e)})
            except Exception as e:
                print(f"[extract-news] failed: {e}")
                self._send_json(400, {"detail": f"URL fetch failed: {e}"})

        else:
            self._send_json(
                400, {"error": "POST requires ?endpoint=svara | tts | extract-news"}
            )

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Local-only test runner ──
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8004
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/main?endpoint=fonts")
    print(f"Try: http://localhost:{port}/api/main?endpoint=font_agent&content_type=sloka&width=390")
    print(f"POST http://localhost:{port}/api/main?endpoint=svara        body: {{\"text\": \"...\", \"voice\": \"male\"}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=tts          body: {{\"text\": \"...\", \"voice\": \"te-IN-ShrutiNeural\", \"speed\": 1.0}}")
    print(f"POST http://localhost:{port}/api/main?endpoint=extract-news body: {{\"url\": \"https://...\"}}")
    HTTPServer(("localhost", port), handler).serve_forever()