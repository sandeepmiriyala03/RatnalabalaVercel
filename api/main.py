"""
api/main.py

Merges fonts.py and font_agent.py into ONE serverless function
instead of two — reduces total function count by 1 toward the
Hobby plan's 12-function limit.

GET /api/main?endpoint=fonts
    → same response as the old /api/fonts

GET /api/main?endpoint=font_agent&content_type=sloka&width=390
    → same response as the old /api/font_agent (reason field now in Telugu)
"""

import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# ═══════════════════════════════════════════════════════════════
# FONTS ENDPOINT — was api/fonts.py
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
]


def handle_fonts():
    return 200, FONT_CATALOG


# ═══════════════════════════════════════════════════════════════
# FONT AGENT ENDPOINT — was api/font_agent.py
# reason field now returned in Telugu instead of English
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
# HANDLER — one function, dispatches by ?endpoint= query param
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

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


# ── Local-only test runner ──
if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8004
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/main?endpoint=fonts")
    print(f"Try: http://localhost:{port}/api/main?endpoint=font_agent&content_type=sloka&width=390")
    HTTPServer(("localhost", port), handler).serve_forever()