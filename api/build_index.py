# api/build_index.py
#
# RUNS ON VERCEL, NOT LOCALLY. Visit this endpoint's URL once to
# trigger the full indexing pipeline server-side.
#
# Static data below (అక్షరమాల, సంధిమాల, సమాసములు) is fixed content —
# poems are NOT hardcoded here, they're always fetched live via
# fetch_poems_flat() / fetch_shatakamu_all() below, same as before.

import os
import json
import time
import requests
import vercel_blob
from http.server import BaseHTTPRequestHandler

COHERE_API_KEY = os.environ.get("COHERE_API_KEY")
COHERE_EMBED_URL = "https://api.cohere.com/v1/embed"
EMBED_MODEL = "embed-multilingual-v3.0"
BATCH_SIZE = 32  # reduced from 90 as a hedge — trial-tier limits may be
                  # stricter on payload size/count than just calls-per-minute
BLOB_PATHNAME = "embeddings_index.json"

BASE_URL = "https://ratnalabala.vercel.app"


def embed_batch(texts: list[str], retries: int = 5) -> list[list[float]]:
    headers = {"Authorization": f"Bearer {COHERE_API_KEY}", "Content-Type": "application/json"}
    body = {"texts": texts, "model": EMBED_MODEL, "input_type": "search_document"}
    last_error = "(ఎప్పుడూ ఒక్క రెస్పాన్స్ కూడా రాలేదు — నెట్‌వర్క్ సమస్య కావొచ్చు)"

    for attempt in range(retries):
        try:
            res = requests.post(COHERE_EMBED_URL, headers=headers, json=body, timeout=30)
        except requests.exceptions.RequestException as e:
            last_error = f"నెట్‌వర్క్ ఎర్రర్: {e}"
            time.sleep(3)
            continue

        if res.status_code == 200:
            return res.json()["embeddings"]

        # Capture the REAL response body every time, including 429s —
        # this is the bug that hid the actual reason before (it only
        # captured non-429 errors, so repeated rate-limiting showed as
        # "None" instead of Cohere's actual message).
        last_error = f"HTTP {res.status_code}: {res.text[:300]}"

        if res.status_code == 429:
            wait = 8 * (attempt + 1)  # 8s, 16s, 24s, 32s, 40s — growing backoff
            time.sleep(wait)
            continue

        time.sleep(2)

    raise Exception(f"Cohere embed failed after {retries} attempts: {last_error}")


# ================================================================
# STATIC DATA — అక్షరమాల (52), సంధిమాల (5), సమాసములు (6)
# ================================================================

AKSHARALU = [
    # అచ్చులు (Swaralu) — 16
    {"letter": "అ", "word": "అరటి"}, {"letter": "ఆ", "word": "ఆవు"},
    {"letter": "ఇ", "word": "ఇల్లు"}, {"letter": "ఈ", "word": "ఈక"},
    {"letter": "ఉ", "word": "ఉడుత"}, {"letter": "ఊ", "word": "ఊయల"},
    {"letter": "ఋ", "word": "ఋషి"}, {"letter": "ౠ", "word": "ౠ"},
    {"letter": "ఎ", "word": "ఎలుక"}, {"letter": "ఏ", "word": "ఏనుగు"},
    {"letter": "ఐ", "word": "ఐదు"}, {"letter": "ఒ", "word": "ఒంటె"},
    {"letter": "ఓ", "word": "ఓడ"}, {"letter": "ఔ", "word": "ఔషధం"},
    {"letter": "అం", "word": "అంకెలు"}, {"letter": "అః", "word": "అంతఃపురం"},
    # హల్లులు (Vyanjanalu) — 36
    {"letter": "క", "word": "కప్ప"}, {"letter": "ఖ", "word": "ఖడ్గం"},
    {"letter": "గ", "word": "గడియారం"}, {"letter": "ఘ", "word": "ఘంట"},
    {"letter": "ఙ", "word": "జ్ఞానము"}, {"letter": "చ", "word": "చక్రము"},
    {"letter": "ఛ", "word": "ఛత్రము"}, {"letter": "జ", "word": "జడ"},
    {"letter": "ఝ", "word": "ఝషము"}, {"letter": "ఞ", "word": "ఞ"},
    {"letter": "ట", "word": "టపాకాయ"}, {"letter": "ఠ", "word": "కంఠము"},
    {"letter": "డ", "word": "డప్పు"}, {"letter": "ఢ", "word": "ఢంకా"},
    {"letter": "ణ", "word": "వీణ"}, {"letter": "త", "word": "తల"},
    {"letter": "థ", "word": "రథము"}, {"letter": "ద", "word": "దంతము"},
    {"letter": "ధ", "word": "ధనుస్సు"}, {"letter": "న", "word": "నత్త"},
    {"letter": "ప", "word": "పడవ"}, {"letter": "ఫ", "word": "ఫలము"},
    {"letter": "బ", "word": "బండి"}, {"letter": "భ", "word": "భవనము"},
    {"letter": "మ", "word": "మద్దెల"}, {"letter": "య", "word": "యంత్రము"},
    {"letter": "ర", "word": "రంగులు"}, {"letter": "ల", "word": "లత"},
    {"letter": "వ", "word": "వల"}, {"letter": "శ", "word": "శంఖము"},
    {"letter": "ష", "word": "షట్పదము"}, {"letter": "స", "word": "సంచి"},
    {"letter": "హ", "word": "హంస"}, {"letter": "ళ", "word": "తాళము"},
    {"letter": "క్ష", "word": "వృక్షము"}, {"letter": "ఱ", "word": "ఱంపము"},
]

SANDHI_RULES: list[dict] = [
    {
        "name": "సవర్ణదీర్ఘ సంధి", "category": "స్వర సంధి",
        "rule": "అ, ఇ, ఉ, ఋ లకు సవర్ణములగు అచ్చులు పరమైనపుడు వాని దీర్ఘములు ఏకాదేశంబగును",
        "examples": [
            {"before": "సుర + అరులు", "after": "సురారులు"},
            {"before": "ముని + ఇంద్ర", "after": "మునీంద్ర"},
        ],
    },
    {
        "name": "గుణసంధి", "category": "స్వర సంధి",
        "rule": "అకారమునకు ఇ, ఉ, ఋ లు పరమయినపుడు ఏ, ఓ, ఆర్ లు ఏకాదేశముగా వచ్చెను",
        "examples": [
            {"before": "దేవ + ఇంద్ర", "after": "దేవేంద్ర"},
            {"before": "సర్వ + ఉపగతుడు", "after": "సర్వోపగతుడు"},
            {"before": "రాజ + ఋషి", "after": "రాజర్షి"},
        ],
    },
    {
        "name": "వృద్ధి సంధి", "category": "స్వర సంధి",
        "rule": "అకారమునకు ఏ, ఐలు పరమైన ఐ కారమును; ఓ, ఔలు పరమైన ఔ కారమును ఏకాదేశముగా వచ్చును",
        "examples": [
            {"before": "రక్ష + ఏక", "after": "రక్షైక"},
            {"before": "పద + ఔన్నత్యము", "after": "పదౌన్నత్యము"},
        ],
    },
    {
        "name": "యణాదేశ సంధి", "category": "స్వర సంధి",
        "rule": "ఇ,ఉ,ఋ లకు అసవర్ణములగు అచ్చులు పరమగునపుడు వరుసగా య,వ,ర లు ఆదేశముగా వచ్చెను",
        "examples": [
            {"before": "అతి + అంత", "after": "అత్యంత"},
            {"before": "మను + అంతరము", "after": "మన్వంతరము"},
        ],
    },
    {
        # NOTE: this rule's examples weren't visible in the source file
        # (got cut off right after the rule text) — add its examples
        # here in the same {"before": "...", "after": "..."} shape once
        # you have them.
        "name": "అనునాసిక సంధి", "category": "హల్ సంధి",
        "rule": "క,చ,ట,త,ప లకు స,మ లు పరమైనపుడు వరుసగా జ,ణ,జ్ఞ,మ లు వికల్పముగా ఆదేశమగును",
        "examples": [],
    },
    # NOTE: your original file likely has more sandhi rules beyond
    # these 5 — add them here in the same shape if so.
]

SAMASA_TYPES: list[dict] = [
    {
        "name": "తత్పురుష సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "విభక్తి ప్రత్యయము లోపించి ఏర్పడు సమాసము తత్పురుష సమాసము.",
        "examples": [
            {"samasa": "రామబాణము", "vigraha": "రాముని యొక్క బాణము"},
            {"samasa": "రాజభటుడు", "vigraha": "రాజుయొక్క భటుడు"},
            {"samasa": "చెట్టుకొమ్మ", "vigraha": "చెట్టు యొక్క కొమ్మ"},
            {"samasa": "అజ్ఞానము", "vigraha": "జ్ఞానము లేనిది"},
        ],
    },
    {
        "name": "కర్మధారయ సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "విశేషణ, విశేష్యముల తో ఏర్పడు సమాసము కర్మధారయ సమాసము.",
        "examples": [
            {"samasa": "సరసపుమాట", "vigraha": "సరసమైన మాట"},
            {"samasa": "ముఖారవిందము", "vigraha": "అరవిందము వంటి ముఖము"},
            {"samasa": "విద్యాధనము", "vigraha": "విద్యయనెడి ధనము"},
            {"samasa": "మధురానగరము", "vigraha": "మధుర అను పేరుగల నగరము"},
        ],
    },
    {
        "name": "ద్విగు సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "సంఖ్యా వాచకపదము పూర్వమున కలది ద్విగు సమాసము.",
        "examples": [
            {"samasa": "త్రిలోకి", "vigraha": "మూడు లోకముల సమాహారము"},
            {"samasa": "పంచభూతాలు", "vigraha": "ఐదు భూతముల సమాహారము"},
            {"samasa": "అష్టదిక్కులు", "vigraha": "ఎనిమిది దిక్కుల సమాహారము"},
            {"samasa": "సప్తర్షులు", "vigraha": "ఏడుగురు ఋషుల సమాహారము"},
        ],
    },
    {
        "name": "ద్వంద్వ సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "ఉభయ పదముల అర్ధము ప్రధానముగా గలది ద్వంద్వ సమాసము.",
        "examples": [
            {"samasa": "రాధాకృష్ణులు", "vigraha": "రాధ యును కృష్ణుడును"},
            {"samasa": "తల్లిదండ్రులు", "vigraha": "తల్లి యును తండ్రి యును"},
            {"samasa": "సీతారాములు", "vigraha": "సీత యును రాముడును"},
            {"samasa": "శివకేశవులు", "vigraha": "శివుడును కేశవుడును"},
        ],
    },
    {
        "name": "బహువ్రీహి సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "రెండు పదముల అర్థము లేక వేరైన మరొక అర్థము ప్రధానమైన సమాసము బహువ్రీహి.",
        "examples": [
            {"samasa": "పీతాంబరుడు", "vigraha": "పచ్చని వస్త్రము కలవాడు"},
            {"samasa": "కమలాక్షుడు", "vigraha": "కమలముల వంటి కన్నులు కలవాడు"},
            {"samasa": "చతుర్భుజుడు", "vigraha": "నాలుగు భుజములు కలవాడు"},
            {"samasa": "గజాననుడు", "vigraha": "గజము వంటి ముఖము కలవాడు"},
        ],
    },
    {
        "name": "అవ్యయీభావ సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "అవ్యయము పూర్వపదముగా కలది అవ్యయీభావ సమాసము.",
        "examples": [
            {"samasa": "యథావిధి", "vigraha": "విధి ప్రకారం"},
            {"samasa": "ప్రతిదినము", "vigraha": "దినము దినము"},
            {"samasa": "ప్రత్యహము", "vigraha": "ప్రతి రోజు"},
            {"samasa": "యథాశక్తి", "vigraha": "శక్తిని అనుసరించి"},
        ],
    },
]


def static_items() -> list[dict]:
    items = []
    for a in AKSHARALU:
        items.append({"text": f"అక్షరం {a['letter']} — ఉదాహరణ పదం: {a['word']}",
                       "title": a["letter"], "folder": "అక్షరమాల"})
    for rule in SANDHI_RULES:
        ex = "; ".join(f"{e['before']} → {e['after']}" for e in rule.get("examples", []))
        text = f"{rule['name']} ({rule['category']}): {rule['rule']}"
        if ex:
            text += f". ఉదాహరణలు: {ex}"
        items.append({"text": text, "title": rule["name"], "folder": "సంధిమాల"})
    for s in SAMASA_TYPES:
        ex = "; ".join(f"{e['samasa']} = {e['vigraha']}" for e in s.get("examples", []))
        items.append({"text": f"{s['name']}: {s['definition']}. ఉదాహరణలు: {ex}",
                       "title": s["name"], "folder": "సమాసములు"})
    return items




# ================================================================
# POEMS — always fetched live via API, never hardcoded
# ================================================================

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


        