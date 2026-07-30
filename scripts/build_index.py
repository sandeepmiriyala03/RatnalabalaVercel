# scripts/build_index.py
#
# SWITCHED TO COHERE — api-inference.huggingface.co was deprecated
# by Hugging Face (moved to router.huggingface.co, and embeddings
# support on the new router was still rolling out at time of writing).
# Cohere's Embed model has been free since May 10, 2026 — no credit
# card, 2,000 inputs/minute, strong multilingual quality. It also
# accepts a BATCH of texts per call (up to 96), not one-at-a-time —
# so the whole dataset now takes ~16 calls instead of ~1450.
#
# Setup:
#   1. Free key: dashboard.cohere.com/api-keys (no card)
#   2. pip install requests
#   3. Set COHERE_API_KEY as an environment variable
#   4. python scripts/build_index.py

import os
import json
import time
import requests

BASE_URL = "https://ratnalabala.vercel.app"
COHERE_API_KEY = os.environ.get("COHERE_API_KEY", "your-key-here")
COHERE_EMBED_URL = "https://api.cohere.com/v1/embed"
EMBED_MODEL = "embed-multilingual-v3.0"

CHECKPOINT_FILE = "embeddings_checkpoint.json"
FINAL_FILE = "embeddings_index.json"
BATCH_SIZE = 90  # under Cohere's per-call limit, safe margin

TEST_MODE = True  # test with a small batch first, same idea as before


def embed_batch(texts: list[str], retries: int = 4) -> list[list[float]]:
    """One call embeds up to BATCH_SIZE texts at once — this is what
    makes this version much faster/more robust than the old
    one-call-per-item HF approach."""
    headers = {
        "Authorization": f"Bearer {COHERE_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "texts": texts,
        "model": EMBED_MODEL,
        "input_type": "search_document",  # use "search_query" at query time instead
    }

    last_error = None
    for attempt in range(retries):
        try:
            res = requests.post(COHERE_EMBED_URL, headers=headers, json=body, timeout=60)
        except requests.exceptions.RequestException as e:
            last_error = str(e)
            print(f"    నెట్‌వర్క్ ఎర్రర్, మళ్ళీ ప్రయత్నిస్తోంది... ({e})")
            time.sleep(5)
            continue

        if res.status_code == 200:
            return res.json()["embeddings"]

        if res.status_code == 401:
            raise Exception(
                "COHERE_API_KEY తప్పు లేదా చెల్లదు — dashboard.cohere.com/api-keys లో చెక్ చేయండి."
            )

        if res.status_code == 429:
            print("    రేట్ లిమిట్ — 10 సెకన్లు వేచి ఉండి మళ్ళీ ప్రయత్నిస్తోంది...")
            time.sleep(10)
            continue

        last_error = f"HTTP {res.status_code}: {res.text[:300]}"
        print(f"    ఎర్రర్ ({last_error}), మళ్ళీ ప్రయత్నిస్తోంది...")
        time.sleep(3)

    raise Exception(f"{retries} సార్లు ప్రయత్నించాక కూడా విఫలమైంది: {last_error}")


# ================================================================
# STATIC DATA — paste your full arrays here (same as before)
# ================================================================

AKSHARALU = [
    {"letter": "అ", "word": "అరటి"}, {"letter": "ఆ", "word": "ఆవు"},
    {"letter": "ఇ", "word": "ఇల్లు"}, {"letter": "ఈ", "word": "ఈక"},
    {"letter": "ఉ", "word": "ఉడుత"},
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
    res = requests.get(f"{BASE_URL}{path}", timeout=30)
    res.raise_for_status()
    data = res.json()
    return [{"text": f"{title}\n{content}", "title": title, "folder": folder}
            for title, content in data.items()]


def fetch_shatakamu_all() -> list[dict]:
    res = requests.get(f"{BASE_URL}/api/shatakamu?key=all", timeout=30)
    res.raise_for_status()
    poems = res.json().get("poems", res.json())
    return [{"text": f"{title}\n{content}", "title": title, "folder": "శతకాలమాల"}
            for title, content in poems.items()]


def load_checkpoint() -> list[dict]:
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_checkpoint(items: list[dict]):
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False)


def main():
    print("డేటా సేకరిస్తోంది...")
    all_items = static_items()

    if not TEST_MODE:
        all_items += fetch_poems_flat("/api/poems", "పద్యాలవాల")
        all_items += fetch_poems_flat("/api/mirapoems", "మిరా")
        all_items += fetch_shatakamu_all()

    if TEST_MODE:
        all_items = all_items[:5]
        print("⚠️  TEST_MODE ఆన్ చేయబడింది — కేవలం 5 అంశాలు.\n")

    done_items = load_checkpoint()
    done_titles = {(item["folder"], item["title"]) for item in done_items}
    remaining = [item for item in all_items
                 if (item["folder"], item["title"]) not in done_titles]

    if done_items:
        print(f"చెక్‌పాయింట్ దొరికింది — {len(done_items)} పూర్తయ్యాయి, "
              f"{len(remaining)} మిగిలి ఉన్నాయి. కొనసాగిస్తోంది...\n")

    print(f"మొత్తం {len(remaining)} అంశాలు, {BATCH_SIZE}-బ్యాచ్‌లుగా embed చేస్తోంది...")

    for i in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[i:i + BATCH_SIZE]
        texts = [item["text"] for item in batch]

        try:
            vectors = embed_batch(texts)
        except Exception as e:
            print(f"\n❌ బ్యాచ్ {i}-{i+len(batch)} వద్ద ఆగిపోయింది: {e}")
            print(f"   ఇప్పటివరకు పూర్తయినవి ({len(done_items)}) సేవ్ చేయబడ్డాయి.")
            save_checkpoint(done_items)
            return

        for item, vector in zip(batch, vectors):
            item["vector"] = vector
            done_items.append(item)

        save_checkpoint(done_items)
        print(f"  {len(done_items)}/{len(all_items)} పూర్తయింది... (చెక్‌పాయింట్ సేవ్ చేయబడింది)")

    with open(FINAL_FILE, "w", encoding="utf-8") as f:
        json.dump(done_items, f, ensure_ascii=False)

    size_mb = os.path.getsize(FINAL_FILE) / (1024 * 1024)
    print(f"\n✅ పూర్తయింది — {FINAL_FILE} ({size_mb:.2f} MB, {len(done_items)} అంశాలు) సేవ్ చేయబడింది.")

    if TEST_MODE:
        print("\n👉 ఇది టెస్ట్ రన్ మాత్రమే. పూర్తి డేటా కోసం TEST_MODE = False చేసి మళ్ళీ నడపండి.")
    else:
        os.remove(CHECKPOINT_FILE)
        print("ఈ ఫైల్‌ని api/ ఫోల్డర్‌లో పెట్టండి, rag_chat.py పక్కనే.")


if __name__ == "__main__":
    main()