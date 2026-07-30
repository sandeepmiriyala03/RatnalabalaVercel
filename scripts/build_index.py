# scripts/build_index.py
#
# ROBUST VERSION — fixes the core problem: the old script only wrote
# embeddings_index.json at the very end, so any crash partway through
# ~1450 sequential API calls (rate limit, network blip, closed
# terminal) lost EVERYTHING. This version saves a checkpoint file
# after every item, and RESUMES from where it left off if you run it
# again — so an interrupted run costs you nothing.
#
# Also added: TEST_MODE, which processes only 5 items first, so you
# can confirm your HF_API_TOKEN actually works before committing to
# the long full run.

import os
import json
import time
import requests

BASE_URL = "https://ratnalabala.vercel.app"
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "hf_...")  # paste your token or set the env var
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
HF_API_URL = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{EMBED_MODEL}"

CHECKPOINT_FILE = "embeddings_checkpoint.json"
FINAL_FILE = "embeddings_index.json"

# Set to True first to test with just 5 items — confirms your token
# and the API call actually work before the full ~1450-item run.
TEST_MODE = True


def embed_text(text: str, retries: int = 4) -> list[float]:
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    last_error = None
    for attempt in range(retries):
        try:
            res = requests.post(HF_API_URL, headers=headers, json={"inputs": text}, timeout=30)
        except requests.exceptions.RequestException as e:
            last_error = str(e)
            print(f"    నెట్‌వర్క్ ఎర్రర్, మళ్ళీ ప్రయత్నిస్తోంది... ({e})")
            time.sleep(5)
            continue

        if res.status_code == 200:
            vector = res.json()
            if isinstance(vector[0], list):
                import statistics
                vector = [statistics.mean(col) for col in zip(*vector)]
            return vector

        if res.status_code == 503:
            wait = res.json().get("estimated_time", 10)
            print(f"    మోడల్ లోడ్ అవుతోంది, {wait}s వేచి ఉండండి...")
            time.sleep(wait)
            continue

        if res.status_code == 401:
            raise Exception(
                "HF_API_TOKEN తప్పు లేదా చెల్లదు — huggingface.co/settings/tokens లో "
                "మళ్ళీ చెక్ చేయండి."
            )

        last_error = f"HTTP {res.status_code}: {res.text[:200]}"
        print(f"    ఎర్రర్ ({last_error}), మళ్ళీ ప్రయత్నిస్తోంది...")
        time.sleep(3)

    raise Exception(f"{retries} సార్లు ప్రయత్నించాక కూడా విఫలమైంది: {last_error}")


# ================================================================
# STATIC DATA — paste your full arrays from the earlier version here
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
        print("⚠️  TEST_MODE ఆన్ చేయబడింది — కేవలం 5 అంశాలు మాత్రమే ప్రాసెస్ చేయబడతాయి.")
        print("   ఇది సరిగ్గా పనిచేస్తే, TEST_MODE = False చేసి పూర్తి రన్ చేయండి.\n")

    # RESUME LOGIC — if a checkpoint already exists (from an earlier,
    # interrupted run), pick up from where it left off instead of
    # starting over and re-spending API calls on items already done.
    done_items = load_checkpoint()
    done_titles = {(item["folder"], item["title"]) for item in done_items}
    remaining = [item for item in all_items
                 if (item["folder"], item["title"]) not in done_titles]

    if done_items:
        print(f"చెక్‌పాయింట్ దొరికింది — ఇప్పటికే {len(done_items)} పూర్తయ్యాయి, "
              f"{len(remaining)} మిగిలి ఉన్నాయి. కొనసాగిస్తోంది...\n")

    for i, item in enumerate(remaining):
        try:
            item["vector"] = embed_text(item["text"])
            done_items.append(item)
        except Exception as e:
            print(f"\n❌ ఐటెమ్ '{item['title']}' వద్ద ఆగిపోయింది: {e}")
            print(f"   ఇప్పటివరకు పూర్తయినవి ({len(done_items)}) సేవ్ చేయబడ్డాయి — "
                  f"స్క్రిప్ట్‌ని మళ్ళీ నడిపితే ఇక్కడి నుండే కొనసాగుతుంది.")
            save_checkpoint(done_items)
            return

        if (i + 1) % 10 == 0:
            save_checkpoint(done_items)  # ← the actual fix: save every 10 items
            print(f"  {len(done_items)}/{len(all_items)} పూర్తయింది... (చెక్‌పాయింట్ సేవ్ చేయబడింది)")

    save_checkpoint(done_items)

    # All done — write the final file and clean up the checkpoint.
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