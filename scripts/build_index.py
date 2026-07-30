# scripts/build_index.py
#
# Extended from the poems-only version — now combines FIVE static
# malas (అక్షరమాల, గుణింతమాల, పదాలమాల, సంధిమాల, సమాసములు) with the
# three poem APIs, into one Chroma index. Every document carries a
# `folder` metadata tag so retrieval results (and later, the frontend)
# always know which మాల an answer came from — this is the "metadata
# tagging" idea from our RAG discussion, now actually implemented.
#
# Run this locally (not on Vercel):
#   pip install langchain langchain-community langchain-huggingface chromadb requests
#   python scripts/build_index.py

import requests
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

BASE_URL = "https://ratnalabala.vercel.app"

EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
)

# ================================================================
# STATIC DATA — from your అక్షరమాల/గుణింతమాల/పదాలమాల/సంధిమాల/సమాసములు
# file. Kept here directly since it's small and doesn't change often;
# unlike poems, no API call needed for these.
# ================================================================

AKSHARALU = [
    {"letter": "అ", "word": "అరటి"}, {"letter": "ఆ", "word": "ఆవు"},
    {"letter": "ఇ", "word": "ఇల్లు"}, {"letter": "ఈ", "word": "ఈక"},
    {"letter": "ఉ", "word": "ఉడుత"}, {"letter": "ఊ", "word": "ఊయల"},
    {"letter": "ఋ", "word": "ఋషి"}, {"letter": "ఎ", "word": "ఎలుక"},
    {"letter": "ఏ", "word": "ఏనుగు"}, {"letter": "ఐ", "word": "ఐదు"},
    {"letter": "ఒ", "word": "ఒంటె"}, {"letter": "ఓ", "word": "ఓడ"},
    {"letter": "ఔ", "word": "ఔషధం"}, {"letter": "అం", "word": "అంకెలు"},
    {"letter": "అః", "word": "అంతఃపురం"},
    {"letter": "క", "word": "కప్ప"}, {"letter": "ఖ", "word": "ఖడ్గం"},
    {"letter": "గ", "word": "గడియారం"}, {"letter": "ఘ", "word": "ఘంట"},
    {"letter": "ఙ", "word": "జ్ఞానము"}, {"letter": "చ", "word": "చక్రము"},
    {"letter": "ఛ", "word": "ఛత్రము"}, {"letter": "జ", "word": "జడ"},
    {"letter": "ఝ", "word": "ఝషము"}, {"letter": "ట", "word": "టపాకాయ"},
    {"letter": "ఠ", "word": "కంఠము"}, {"letter": "డ", "word": "డప్పు"},
    {"letter": "ఢ", "word": "ఢంకా"}, {"letter": "ణ", "word": "వీణ"},
    {"letter": "త", "word": "తల"}, {"letter": "థ", "word": "రథము"},
    {"letter": "ద", "word": "దంతము"}, {"letter": "ధ", "word": "ధనుస్సు"},
    {"letter": "న", "word": "నత్త"}, {"letter": "ప", "word": "పడవ"},
    {"letter": "ఫ", "word": "ఫలము"}, {"letter": "బ", "word": "బండి"},
    {"letter": "భ", "word": "భవనము"}, {"letter": "మ", "word": "మద్దెల"},
    {"letter": "య", "word": "యంత్రము"}, {"letter": "ర", "word": "రంగులు"},
    {"letter": "ల", "word": "లత"}, {"letter": "వ", "word": "వల"},
    {"letter": "శ", "word": "శంఖము"}, {"letter": "ష", "word": "షట్పదము"},
    {"letter": "స", "word": "సంచి"}, {"letter": "హ", "word": "హంస"},
    {"letter": "ళ", "word": "తాళము"}, {"letter": "క్ష", "word": "వృక్షము"},
    {"letter": "ఱ", "word": "ఱంపము"},
]

GUNINTA_NAMES = [
    "అకారము", "ఆకారము", "ఇకారము", "ఈకారము", "ఉకారము", "ఊకారము",
    "ఋకారము", "ౠకారము", "ఎకారము", "ఏకారము", "ఐకారము", "ఒకారము",
    "ఓకారము", "ఔకారము", "పూర్ణానుస్వారము", "విసర్గ",
]
VYANJANALU = [
    "క", "ఖ", "గ", "ఘ", "చ", "ఛ", "జ", "ఝ", "ట", "ఠ", "డ", "ఢ", "ణ",
    "త", "థ", "ద", "ధ", "న", "ప", "ఫ", "బ", "భ", "మ", "య", "ర", "ల",
    "వ", "శ", "ష", "స", "హ", "ళ", "క్ష", "ఱ",
]

TWO_LETTER_WORDS = [
    "అల", "అర", "ఆన", "ఆట", "ఇల", "ఈల", "ఈగ", "ఈక", "ఉమ", "ఊక", "ఋణ",
    "ఎర", "ఎద", "ఏతం", "ఐదు", "ఒర", "ఒక", "ఓడ", "కల", "కథ", "ఖరం",
    "గద", "గంట", "గంప", "ఘన", "చర", "ఛత్రం", "జపం", "జనం", "ఝరి",
    "జ్ఞప్తి", "టపా", "టక్కు", "ఠీవి", "ఠావు", "ఠాణా", "డబ్బు", "ఢంక",
    "కణ", "తల", "దడ", "దయ", "ధన", "నగ", "పగ", "ఫలం", "బడి", "బలం",
    "భక్తి", "మర", "మనం", "యమ", "యతి", "రసం", "లత", "వల", "శరం",
    "షట్", "సజ్జ", "హల", "కళ", "క్షమ", "ఱంపం",
]

SANDHI_RULES = [
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
    # NOTE: your source file had more sandhi rules beyond line 170 that
    # got truncated in what I could read — add the rest here following
    # this same {name, category, rule, examples} shape.
]

SAMASA_TYPES = [
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
        ],
    },
    {
        "name": "ద్విగు సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "సంఖ్యా వాచకపదము పూర్వమున కలది ద్విగు సమాసము.",
        "examples": [
            {"samasa": "త్రిలోకి", "vigraha": "మూడు లోకముల సమాహారము"},
            {"samasa": "పంచభూతాలు", "vigraha": "ఐదు భూతముల సమాహారము"},
            {"samasa": "అష్టదిక్కులు", "vigraha": "ఎనిమిది దిక్కుల సమాహారము"},
        ],
    },
    {
        "name": "ద్వంద్వ సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "ఉభయ పదముల అర్ధము ప్రధానముగా గలది ద్వంద్వ సమాసము.",
        "examples": [
            {"samasa": "రాధాకృష్ణులు", "vigraha": "రాధ యును కృష్ణుడును"},
            {"samasa": "తల్లిదండ్రులు", "vigraha": "తల్లి యును తండ్రి యును"},
            {"samasa": "సీతారాములు", "vigraha": "సీత యును రాముడును"},
        ],
    },
    {
        "name": "బహువ్రీహి సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "రెండు పదముల అర్థము లేక వేరైన మరొక అర్థము ప్రధానమైన సమాసము బహువ్రీహి.",
        "examples": [
            {"samasa": "పీతాంబరుడు", "vigraha": "పచ్చని వస్త్రము కలవాడు"},
            {"samasa": "కమలాక్షుడు", "vigraha": "కమలముల వంటి కన్నులు కలవాడు"},
            {"samasa": "చతుర్భుజుడు", "vigraha": "నాలుగు భుజములు కలవాడు"},
        ],
    },
    {
        "name": "అవ్యయీభావ సమాసము", "category": "ముఖ్య సమాసాలు",
        "definition": "అవ్యయము పూర్వపదముగా కలది అవ్యయీభావ సమాసము.",
        "examples": [
            {"samasa": "యథావిధి", "vigraha": "విధి ప్రకారం"},
            {"samasa": "ప్రతిదినము", "vigraha": "దినము దినము"},
            {"samasa": "యథాశక్తి", "vigraha": "శక్తిని అనుసరించి"},
        ],
    },
]


def static_docs() -> list[Document]:
    """Converts each static mala's data into Documents tagged with its
    folder name, so retrieval always knows which మాల an answer came
    from — same metadata pattern used for the poem docs below."""
    docs = []

    for item in AKSHARALU:
        docs.append(Document(
            page_content=f"అక్షరం {item['letter']} — ఉదాహరణ పదం: {item['word']}",
            metadata={"title": item["letter"], "folder": "అక్షరమాల"},
        ))

    for consonant in VYANJANALU:
        forms = ", ".join(f"{consonant}{name}" for name in GUNINTA_NAMES[:4])
        docs.append(Document(
            page_content=f"{consonant} హల్లు యొక్క గుణింత రూపాలు: {forms}...",
            metadata={"title": f"{consonant} గుణింతాలు", "folder": "గుణింతమాల"},
        ))

    for word in TWO_LETTER_WORDS:
        docs.append(Document(
            page_content=f"రెండక్షరాల పదం: {word}",
            metadata={"title": word, "folder": "పదాలమాల"},
        ))

    for rule in SANDHI_RULES:
        examples_text = "; ".join(f"{e['before']} → {e['after']}" for e in rule["examples"])
        docs.append(Document(
            page_content=f"{rule['name']} ({rule['category']}): {rule['rule']}. ఉదాహరణలు: {examples_text}",
            metadata={"title": rule["name"], "folder": "సంధిమాల"},
        ))

    for samasa in SAMASA_TYPES:
        examples_text = "; ".join(f"{e['samasa']} = {e['vigraha']}" for e in samasa["examples"])
        docs.append(Document(
            page_content=f"{samasa['name']}: {samasa['definition']}. ఉదాహరణలు: {examples_text}",
            metadata={"title": samasa["name"], "folder": "సమాసములు"},
        ))

    return docs


# ================================================================
# API DATA — poems, unchanged from the previous version
# ================================================================

def fetch_poems_flat(path: str, folder: str) -> list[Document]:
    res = requests.get(f"{BASE_URL}{path}")
    res.raise_for_status()
    data = res.json()
    return [
        Document(
            page_content=f"{title}\n{content}",
            metadata={"title": title, "folder": folder},
        )
        for title, content in data.items()
    ]


def fetch_shatakamu_all() -> list[Document]:
    res = requests.get(f"{BASE_URL}/api/shatakamu?key=all")
    res.raise_for_status()
    data = res.json()
    poems = data.get("poems", data)
    return [
        Document(
            page_content=f"{title}\n{content}",
            metadata={"title": title, "folder": "శతకాలమాల"},
        )
        for title, content in poems.items()
    ]


def main():
    print("స్టాటిక్ డేటా (అక్షరమాల, గుణింతమాల, పదాలమాల, సంధిమాల, సమాసములు) తయారు చేస్తోంది...")
    all_docs: list[Document] = static_docs()
    print(f"  → {len(all_docs)} స్టాటిక్ అంశాలు తయారయ్యాయి.")

    print("పద్యాలు fetch చేస్తోంది...")
    all_docs += fetch_poems_flat("/api/poems", "పద్యాలవాల")
    all_docs += fetch_poems_flat("/api/mirapoems", "మిరా")
    all_docs += fetch_shatakamu_all()

    print(f"మొత్తం {len(all_docs)} అంశాలు (అన్ని మాలలు కలిపి). embeddings తయారు చేస్తోంది...")
    print("(ఇది కొన్ని నిమిషాలు పట్టవచ్చు — ఓపిక పట్టండి)")

    vectorstore = Chroma.from_documents(
        documents=all_docs,
        embedding=EMBEDDINGS,
        persist_directory="./chroma_index",
    )
    vectorstore.persist()

    print("✅ పూర్తయింది — ./chroma_index లో అన్ని మాలలూ కలిపిన ఇండెక్స్ సేవ్ చేయబడింది.")


if __name__ == "__main__":
    main()