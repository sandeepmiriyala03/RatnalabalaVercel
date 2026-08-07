# api/trace_check.py
#
# Compares a child's hand-drawn letter against the actual letter
# shape, rendered from a real Telugu font. NO LLM — pure image
# processing with Pillow, same cost-free approach as
# pronunciation_check.py (difflib) but for shapes instead of text.
#
# Approach: render the target letter as a filled mask using the same
# font file the frontend displays as the "guide" letter, then compute
# how much of the drawn strokes overlap with that guide shape.
#
# POST /api/trace_check
# Body: {"letter": "అ", "image_data": "data:image/png;base64,...", 
#        "canvas_size": 260}

import json
import base64
import io
from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont

# Reuses one of the existing Telugu fonts already shipped in
# /public/fonts — same font family used elsewhere on the site.
# Path is relative to Vercel's function working directory; adjust if
# your actual deployed font path differs.
FONT_PATH = "public/fonts/NTR-Regular.ttf"

# Below this overlap score, the trace isn't considered a good match.
# Handwriting is naturally imprecise — this is deliberately forgiving,
# tuned for "recognizable attempt" rather than "pixel-perfect."
OVERLAP_THRESHOLD = 0.35

_font_cache: dict = {}


def get_font(size: int) -> ImageFont.FreeTypeFont:
    if size in _font_cache:
        return _font_cache[size]
    font = ImageFont.truetype(FONT_PATH, size)
    _font_cache[size] = font
    return font


def render_guide_mask(letter: str, canvas_size: int) -> Image.Image:
    """Renders the target letter as a black-on-white mask, same
    proportions as the guide letter shown in the frontend (roughly
    35% of canvas size, centered) — matches AksharaTraceBoard.tsx's
    fontSize calculation."""
    img = Image.new("L", (canvas_size, canvas_size), color=255)
    draw = ImageDraw.Draw(img)

    font_size = int(canvas_size * 0.55)  # letter glyph fills most of its bbox
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), letter, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (canvas_size - text_w) / 2 - bbox[0]
    y = (canvas_size - text_h) / 2 - bbox[1]

    draw.text((x, y), letter, font=font, fill=0)
    return img


def decode_drawn_image(image_data: str, canvas_size: int) -> Image.Image:
    """Decodes the base64 PNG from the canvas into a grayscale mask
    matching the guide's dimensions."""
    header, encoded = image_data.split(",", 1)
    raw = base64.b64decode(encoded)
    img = Image.open(io.BytesIO(raw)).convert("L")

    if img.size != (canvas_size, canvas_size):
        img = img.resize((canvas_size, canvas_size))

    return img


def compute_overlap(guide: Image.Image, drawn: Image.Image, canvas_size: int) -> float:
    """Overlap score: what fraction of the GUIDE letter's ink was
    covered by the child's strokes. Using the guide as the denominator
    (not the drawn strokes) means messy/extra strokes outside the
    letter don't unfairly boost the score, and don't unfairly punish
    it either — only coverage of the actual letter shape counts."""
    guide_px = guide.load()
    drawn_px = drawn.load()

    guide_ink = 0
    covered = 0

    # Canvas has a transparent/white background; drawn strokes are the
    # blue line, which after grayscale conversion is meaningfully
    # darker than the white background. Threshold at 200 to count a
    # pixel as "ink" on either image.
    INK_THRESHOLD = 200

    for x in range(0, canvas_size, 2):  # step by 2 — good enough
        for y in range(0, canvas_size, 2):  # accuracy, much faster
            is_guide_ink = guide_px[x, y] < INK_THRESHOLD
            if is_guide_ink:
                guide_ink += 1
                is_drawn_ink = drawn_px[x, y] < INK_THRESHOLD
                if is_drawn_ink:
                    covered += 1

    if guide_ink == 0:
        return 0.0

    return covered / guide_ink


def check_trace(letter: str, image_data: str, canvas_size: int) -> dict:
    try:
        guide = render_guide_mask(letter, canvas_size)
        drawn = decode_drawn_image(image_data, canvas_size)
        score = compute_overlap(guide, drawn, canvas_size)
    except Exception as e:
        return {
            "correct": False,
            "score": 0.0,
            "message": "తనిఖీ చేయడంలో సమస్య వచ్చింది.",
            "error": str(e),
        }

    correct = score >= OVERLAP_THRESHOLD

    return {
        "correct": correct,
        "score": round(score, 2),
        "message": "బాగా రాశారు! 🎉" if correct else "మరింత సాధన చేయండి, మళ్ళీ ప్రయత్నించండి.",
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(content_length))

            letter = data.get("letter", "")
            image_data = data.get("image_data", "")
            canvas_size = int(data.get("canvas_size", 260))

            if not letter or not image_data:
                self._send_json(400, {"error": "'letter' లేదా 'image_data' ఖాళీగా ఉంది"})
                return

            result = check_trace(letter, image_data, canvas_size)
            self._send_json(200, result)

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))