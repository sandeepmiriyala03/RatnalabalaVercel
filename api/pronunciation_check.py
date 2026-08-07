# api/pronunciation_check.py
#
# Pronunciation practice for Aksharamala — NO LLM, zero API cost.
# Browser speaks the word, child repeats, browser transcribes via
# SpeechRecognition, sends the transcribed text here. This endpoint
# just compares it against the target word using difflib (Python's
# built-in string similarity — no new dependency needed).
#
# POST /api/pronunciation_check
# Body: {"target_word": "అమ్మ", "spoken_text": "అమ్మ"}

import json
import difflib
from http.server import BaseHTTPRequestHandler

# Below this similarity score, we don't count it as correct.
# 1.0 = exact match, 0.0 = completely different.
# 0.75 allows for minor speech-recognition transcription noise
# (extra space, slightly different vowel mark) without being too
# lenient. Tune this if it feels too strict or too forgiving.
SIMILARITY_THRESHOLD = 0.75


def check_pronunciation(target_word: str, spoken_text: str) -> dict:
    target = target_word.strip()
    spoken = spoken_text.strip()

    if not target or not spoken:
        return {
            "correct": False,
            "similarity": 0.0,
            "message": "ఏమీ వినిపించలేదు, మళ్ళీ ప్రయత్నించండి.",
        }

    # Exact match — fastest, most common case for a correct attempt
    if target == spoken:
        return {
            "correct": True,
            "similarity": 1.0,
            "message": "సరైనది! 🎉",
        }

    # Fuzzy match — catches near-misses from transcription noise
    similarity = difflib.SequenceMatcher(None, target, spoken).ratio()

    if similarity >= SIMILARITY_THRESHOLD:
        return {
            "correct": True,
            "similarity": round(similarity, 2),
            "message": "సరైనది! 🎉",
        }

    return {
        "correct": False,
        "similarity": round(similarity, 2),
        "message": "కాదు, మళ్ళీ ప్రయత్నించండి.",
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

            target_word = data.get("target_word", "")
            spoken_text = data.get("spoken_text", "")

            if not target_word:
                self._send_json(400, {"error": "'target_word' ఖాళీగా ఉంది"})
                return

            result = check_pronunciation(target_word, spoken_text)
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