# api/aksharamala.py
#
# Owns filtering/pagination logic. Data itself now lives in
# aksharamala_data.py (a plain module, not a handler) — see that
# file's header comment for why this split matters for build size.
#
# GET /api/aksharamala?search=&type=all&page=1&page_size=4

import json
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

from aksharamala_data import AKSHARALU


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