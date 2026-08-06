# api/aksharamala.py
#
# Owns ALL business logic for Aksharamala: the data itself, search,
# type filtering, and pagination. Next.js calls this and only
# renders whatever comes back — no filtering/pagination in the UI.
#
# GET /api/aksharamala?search=&type=all&page=1&page_size=4

import json
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

# Full dataset — moved out of AksharamalaParent.tsx entirely.
# This IS the business data now; Next.js no longer owns it.
AKSHARALU = [
    {"id": "s1", "type": "swaralu", "letter": "అ", "word": "అరటి", "image": "/akshara/1.jpg"},
    {"id": "s2", "type": "swaralu", "letter": "ఆ", "word": "ఆవు", "image": "/akshara/2.jpg"},
    {"id": "s3", "type": "swaralu", "letter": "ఇ", "word": "ఇల్లు", "image": "/akshara/3.jpg"},
    {"id": "s4", "type": "swaralu", "letter": "ఈ", "word": "ఈక", "image": "/akshara/4.jpg"},
    {"id": "s5", "type": "swaralu", "letter": "ఉ", "word": "ఉడుత", "image": "/akshara/5.jpg"},
    {"id": "s6", "type": "swaralu", "letter": "ఊ", "word": "ఊయల", "image": "/akshara/6.jpg"},
    {"id": "s7", "type": "swaralu", "letter": "ఋ", "word": "ఋషి"},
    {"id": "s8", "type": "swaralu", "letter": "ౠ", "word": "ౠ"},
    {"id": "s9", "type": "swaralu", "letter": "ఎ", "word": "ఎలుక", "image": "/akshara/7.jpg"},
    {"id": "s10", "type": "swaralu", "letter": "ఏ", "word": "ఏనుగు", "image": "/akshara/8.jpg"},
    {"id": "s11", "type": "swaralu", "letter": "ఐ", "word": "ఐదు", "image": "/akshara/9.jpg"},
    {"id": "s12", "type": "swaralu", "letter": "ఒ", "word": "ఒంటె", "image": "/akshara/10.jpg"},
    {"id": "s13", "type": "swaralu", "letter": "ఓ", "word": "ఓడ", "image": "/akshara/11.jpg"},
    {"id": "s14", "type": "swaralu", "letter": "ఔ", "word": "ఔషధం", "image": "/akshara/12.jpg"},
    {"id": "s15", "type": "swaralu", "letter": "అం", "word": "అంకెలు", "image": "/akshara/13.jpg"},
    {"id": "s16", "type": "swaralu", "letter": "అః", "word": "అంతఃపురం"},
    {"id": "v1", "type": "vyanjanalu", "letter": "క", "word": "కప్ప", "image": "/akshara/14.jpg"},
    {"id": "v2", "type": "vyanjanalu", "letter": "ఖ", "word": "ఖడ్గం", "image": "/akshara/15.jpg"},
    {"id": "v3", "type": "vyanjanalu", "letter": "గ", "word": "గడియారం", "image": "/akshara/16.jpg"},
    {"id": "v4", "type": "vyanjanalu", "letter": "ఘ", "word": "ఘంట", "image": "/akshara/17.jpg"},
    {"id": "v5", "type": "vyanjanalu", "letter": "ఙ", "word": "జ్ఞానము"},
    {"id": "v6", "type": "vyanjanalu", "letter": "చ", "word": "చక్రము", "image": "/akshara/18.jpg"},
    {"id": "v7", "type": "vyanjanalu", "letter": "ఛ", "word": "ఛత్రము", "image": "/akshara/19.jpg"},
    {"id": "v8", "type": "vyanjanalu", "letter": "జ", "word": "జడ", "image": "/akshara/20.jpg"},
    {"id": "v9", "type": "vyanjanalu", "letter": "ఝ", "word": "ఝషము", "image": "/akshara/21.jpg"},
    {"id": "v10", "type": "vyanjanalu", "letter": "ఞ", "word": "ఞ"},
    {"id": "v11", "type": "vyanjanalu", "letter": "ట", "word": "టపాకాయ", "image": "/akshara/22.jpg"},
    {"id": "v12", "type": "vyanjanalu", "letter": "ఠ", "word": "కంఠము", "image": "/akshara/23.jpg"},
    {"id": "v13", "type": "vyanjanalu", "letter": "డ", "word": "డప్పు", "image": "/akshara/24.jpg"},
    {"id": "v14", "type": "vyanjanalu", "letter": "ఢ", "word": "ఢంకా", "image": "/akshara/25.jpg"},
    {"id": "v15", "type": "vyanjanalu", "letter": "ణ", "word": "వీణ", "image": "/akshara/26.jpg"},
    {"id": "v16", "type": "vyanjanalu", "letter": "త", "word": "తల", "image": "/akshara/27.jpg"},
    {"id": "v17", "type": "vyanjanalu", "letter": "థ", "word": "రథము", "image": "/akshara/28.jpg"},
    {"id": "v18", "type": "vyanjanalu", "letter": "ద", "word": "దంతము", "image": "/akshara/29.jpg"},
    {"id": "v19", "type": "vyanjanalu", "letter": "ధ", "word": "ధనుస్సు", "image": "/akshara/30.jpg"},
    {"id": "v20", "type": "vyanjanalu", "letter": "న", "word": "నత్త", "image": "/akshara/31.jpg"},
    {"id": "v21", "type": "vyanjanalu", "letter": "ప", "word": "పడవ", "image": "/akshara/32.jpg"},
    {"id": "v22", "type": "vyanjanalu", "letter": "ఫ", "word": "ఫలము", "image": "/akshara/33.jpg"},
    {"id": "v23", "type": "vyanjanalu", "letter": "బ", "word": "బండి", "image": "/akshara/34.jpg"},
    {"id": "v24", "type": "vyanjanalu", "letter": "భ", "word": "భవనము", "image": "/akshara/35.jpg"},
    {"id": "v25", "type": "vyanjanalu", "letter": "మ", "word": "మద్దెల", "image": "/akshara/36.jpg"},
    {"id": "v26", "type": "vyanjanalu", "letter": "య", "word": "యంత్రము", "image": "/akshara/37.jpg"},
    {"id": "v27", "type": "vyanjanalu", "letter": "ర", "word": "రంగులు", "image": "/akshara/38.jpg"},
    {"id": "v28", "type": "vyanjanalu", "letter": "ల", "word": "లత", "image": "/akshara/39.jpg"},
    {"id": "v29", "type": "vyanjanalu", "letter": "వ", "word": "వల", "image": "/akshara/40.jpg"},
    {"id": "v30", "type": "vyanjanalu", "letter": "శ", "word": "శంఖము", "image": "/akshara/41.jpg"},
    {"id": "v31", "type": "vyanjanalu", "letter": "ష", "word": "షట్పదము", "image": "/akshara/42.jpg"},
    {"id": "v32", "type": "vyanjanalu", "letter": "స", "word": "సంచి", "image": "/akshara/43.jpg"},
    {"id": "v33", "type": "vyanjanalu", "letter": "హ", "word": "హంస", "image": "/akshara/44.jpg"},
    {"id": "v34", "type": "vyanjanalu", "letter": "ళ", "word": "తాళము", "image": "/akshara/45.jpg"},
    {"id": "v35", "type": "vyanjanalu", "letter": "క్ష", "word": "వృక్షము"},
    {"id": "v36", "type": "vyanjanalu", "letter": "ఱ", "word": "ఱంపము"},
]


def filter_and_paginate(search: str, type_filter: str, page: int, page_size: int) -> dict:
    """All logic that used to live in AksharamalaParent's useMemo hooks."""
    search = search.strip()

    filtered = [
        a for a in AKSHARALU
        if (not search or search in a["letter"] or (a.get("word") and search in a["word"]))
        and (type_filter == "all" or a["type"] == type_filter)
    ]

    total_count = len(filtered)
    page_count = max(1, (total_count + page_size - 1) // page_size)
    page = max(1, min(page, page_count))

    start = (page - 1) * page_size
    items = filtered[start:start + page_size]

    return {
        "items": items,
        "total_count": total_count,
        "page_count": page_count,
        "current_page": page,
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        try:
            query = parse_qs(urlparse(self.path).query)

            search = query.get("search", [""])[0]
            type_filter = query.get("type", ["all"])[0]
            page = int(query.get("page", ["1"])[0])
            page_size = int(query.get("page_size", ["4"])[0])

            result = filter_and_paginate(search, type_filter, page, page_size)
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))