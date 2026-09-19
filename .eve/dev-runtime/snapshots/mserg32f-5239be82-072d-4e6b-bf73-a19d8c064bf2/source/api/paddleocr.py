# api/paddleocr.py
#


import base64
import json
from http.server import BaseHTTPRequestHandler
from paddleocr import PaddleOCR

# Loaded once per warm function instance, not per-request — this is
# what makes subsequent (non-cold-start) requests reasonably fast.
# use_angle_cls=False and the "mobile" model variants keep the download
# small; drop use_angle_cls entirely if you don't need rotated-text
# detection, to save a little more size/time.
_ocr_engine = None


def get_engine():
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(
            lang="te",  # Telugu — check PaddleOCR's docs for current language code support
            use_angle_cls=False,
            det_model_dir=None,  # uses PaddleOCR's default mobile detection model
            rec_model_dir=None,  # uses PaddleOCR's default mobile recognition model
            show_log=False,
        )
    return _ocr_engine


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            content_type = self.headers.get("Content-Type", "")

            if "multipart/form-data" not in content_type:
                self._send_json(400, {"error": "multipart/form-data ఆశించబడింది"})
                return

            # Minimal multipart parser — good enough for a single file
            # field named "file", which is what the frontend sends.
            body = self.rfile.read(content_length)
            boundary = content_type.split("boundary=")[-1].encode()
            parts = body.split(b"--" + boundary)

            image_bytes = None
            for part in parts:
                if b'name="file"' in part:
                    # header/body split on the first blank line (\r\n\r\n)
                    _, _, file_data = part.partition(b"\r\n\r\n")
                    image_bytes = file_data.rstrip(b"\r\n--")
                    break

            if not image_bytes:
                self._send_json(400, {"error": "ఫైల్ కనుగొనబడలేదు"})
                return

            engine = get_engine()
            result = engine.ocr(image_bytes, cls=False)

            lines = []
            for block in result:
                if not block:
                    continue
                for line in block:
                    lines.append(line[1][0])

            self._send_json(200, {"text": "\n".join(lines)})

        except Exception as e:
            self._send_json(500, {"error": f"PaddleOCR లోపం: {str(e)}"})

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))