"""
api/fonts.py

Single source of truth for the Telugu font catalog. FontControlsTelugu.tsx
fetches this instead of hardcoding the font list — adding/removing a font
means editing FONT_CATALOG below, no frontend redeploy needed.

DEPLOYED:
  GET /api/fonts  →  [{ "label": "గురజాడ", "value": "Gurajada" }, ...]

LOCAL TEST:
  python fonts.py
  → http://localhost:8003/api/fonts
"""

import json
from http.server import BaseHTTPRequestHandler

# The full catalog — moved here from the frontend's TELUGU_FONTS array.
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


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps(FONT_CATALOG, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        # Cache at the edge/browser for an hour — this data changes rarely.
        self.send_header("Cache-Control", "public, max-age=3600")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    from http.server import HTTPServer

    port = 8003
    print(f"Starting local test server at http://localhost:{port}")
    print(f"Try: http://localhost:{port}/api/fonts")
    HTTPServer(("localhost", port), handler).serve_forever()