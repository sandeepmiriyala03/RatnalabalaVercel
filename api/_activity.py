# ==================================================================
# api/_activity.py — వినియోగదారుల కార్యకలాపాల ఏజెంట్
#
# బ్రౌజర్ పంపే events (పేజీ చూడటం, వినడం, PDF, వెతకడం…) ని
# సరిచూసి, ఒకేసారి గుంపుగా PostgreSQL లో నమోదు చేస్తుంది.
#
# గోప్యత (privacy):
#   • పేరు, email, IP, ఫోన్ — ఏవీ నిల్వ చేయము
#   • session_id = ప్రతి సందర్శనకు యాదృచ్ఛిక సంఖ్య (వ్యక్తిని గుర్తించదు)
#   • వెతికిన పదాలు నిల్వ చేయము — event పేరు మాత్రమే
#
# "_" తో మొదలవుతుంది → Vercel దీన్ని వేరే function గా చేయదు;
# main.py import చేసుకుని వాడుతుంది.
# ==================================================================

import json
import os
import re
import time
from datetime import datetime, timedelta, timezone

import psycopg
from psycopg.rows import dict_row

DB_URL = os.environ.get("NEON_DATABASE_URL", "")
# సారాంశం (summary) చూడటానికి రహస్య key — Vercel Environment Variables లో పెట్టండి
ADMIN_KEY = os.environ.get("ACTIVITY_ADMIN_KEY", "")

MAX_BODY_BYTES = 64_000
MAX_EVENTS_PER_BATCH = 50
# ఒక session కి 10 నిమిషాల్లో గరిష్ఠం (దుర్వినియోగం ఆపడానికి)
RATE_WINDOW_SECONDS = 600
RATE_MAX_EVENTS = 400

_EVENT_RE = re.compile(r"^[a-z][a-z0-9_]{1,39}$")
_SESSION_RE = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
_DEVICES = {"phone", "tablet", "desktop"}

# server instance వారీగా (best effort — serverless లో ప్రతి instance కి వేరు)
_rate: dict[str, tuple[float, int]] = {}

INSERT_SQL = """
    INSERT INTO user_activity
        (session_id, event_name, page_path, letter, detail, success, device, language, client_time)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
"""


def _log(message: str):
    print(f"[Activity] {message}")


def _clip(value, limit: int):
    if value is None:
        return None
    text = str(value).strip()
    return text[:limit] or None


def _bool(value):
    return value if isinstance(value, bool) else None


def _client_time(value):
    """ms (JS Date.now()) లేదా ISO; ఒక రోజు కంటే ఎక్కువ తేడా ఉంటే పట్టించుకోము."""
    try:
        if isinstance(value, (int, float)):
            ts = datetime.fromtimestamp(value / 1000, tz=timezone.utc)
        elif isinstance(value, str) and value:
            ts = datetime.fromisoformat(value.replace("Z", "+00:00"))
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        else:
            return None
    except (ValueError, OverflowError, OSError):
        return None
    now = datetime.now(timezone.utc)
    return ts if abs(now - ts) <= timedelta(days=1) else None


def _rate_ok(session_id: str, count: int) -> bool:
    now = time.time()
    start, used = _rate.get(session_id, (now, 0))
    if now - start > RATE_WINDOW_SECONDS:
        start, used = now, 0
    if used + count > RATE_MAX_EVENTS:
        return False
    _rate[session_id] = (start, used + count)
    if len(_rate) > 5000:  # memory పెరగకుండా
        _rate.clear()
    return True


def parse_batch(raw: bytes) -> tuple[str, list[tuple]]:
    """బ్రౌజర్ పంపిన JSON → database వరుసలు. తప్పు రూపం అయితే ValueError."""
    if not raw:
        raise ValueError("empty body")
    if len(raw) > MAX_BODY_BYTES:
        raise ValueError("body too large")

    data = json.loads(raw.decode("utf-8"))  # sendBeacon text/plain గా పంపినా సరే
    if not isinstance(data, dict):
        raise ValueError("body must be an object")

    session_id = str(data.get("session_id") or "")
    if not _SESSION_RE.match(session_id):
        raise ValueError("invalid session_id")

    device = data.get("device") if data.get("device") in _DEVICES else None
    language = _clip(data.get("language"), 20)

    events = data.get("events")
    if not isinstance(events, list) or not events:
        raise ValueError("events must be a non-empty list")

    rows = []
    for e in events[:MAX_EVENTS_PER_BATCH]:
        if not isinstance(e, dict):
            continue
        name = str(e.get("name") or "")
        if not _EVENT_RE.match(name):
            continue  # తెలియని / తప్పు పేరు — వదిలేస్తాం
        rows.append((
            session_id,
            name,
            _clip(e.get("path"), 300),
            _clip(e.get("letter"), 20),
            _clip(e.get("detail"), 200),
            _bool(e.get("success")),
            device,
            language,
            _client_time(e.get("ts")),
        ))
    return session_id, rows


def save_activity(raw: bytes) -> tuple[int, dict]:
    """POST /api/main?endpoint=track — వినియోగదారుకు ఎప్పుడూ వేగంగా జవాబు."""
    try:
        session_id, rows = parse_batch(raw)
    except (ValueError, json.JSONDecodeError, UnicodeDecodeError) as e:
        return 400, {"saved": 0, "error": str(e)}

    if not rows:
        return 200, {"saved": 0}
    if not _rate_ok(session_id, len(rows)):
        return 429, {"saved": 0, "error": "too many events"}
    if not DB_URL:
        return 503, {"saved": 0, "error": "database not configured"}

    try:
        with psycopg.connect(DB_URL, connect_timeout=5) as conn:
            with conn.cursor() as cursor:
                cursor.executemany(INSERT_SQL, rows)
        return 200, {"saved": len(rows)}
    except Exception as e:  # tracking విఫలమైనా సైట్ ఆగకూడదు
        _log(f"insert failed: {type(e).__name__}: {e}")
        return 503, {"saved": 0, "error": "could not save"}


def activity_summary(query: dict, admin_key: str) -> tuple[int, dict]:
    """GET /api/main?endpoint=activity_summary&days=7  (header: X-Admin-Key)"""
    if not ADMIN_KEY or admin_key != ADMIN_KEY:
        return 401, {"error": "unauthorized"}
    if not DB_URL:
        return 503, {"error": "database not configured"}

    try:
        days = int((query.get("days") or ["7"])[0])
    except ValueError:
        days = 7
    days = max(1, min(days, 90))

    sql = {
        "totals": """
            SELECT COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions
            FROM user_activity WHERE created_at >= NOW() - make_interval(days => %s)
        """,
        "top_events": """
            SELECT event_name, COUNT(*) AS count
            FROM user_activity WHERE created_at >= NOW() - make_interval(days => %s)
            GROUP BY event_name ORDER BY count DESC LIMIT 20
        """,
        "top_pages": """
            SELECT page_path, COUNT(*) AS count
            FROM user_activity
            WHERE created_at >= NOW() - make_interval(days => %s) AND page_path IS NOT NULL
            GROUP BY page_path ORDER BY count DESC LIMIT 20
        """,
        "devices": """
            SELECT COALESCE(device, 'unknown') AS device, COUNT(DISTINCT session_id) AS sessions
            FROM user_activity WHERE created_at >= NOW() - make_interval(days => %s)
            GROUP BY 1 ORDER BY sessions DESC
        """,
        "daily": """
            SELECT created_at::date AS day, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions
            FROM user_activity WHERE created_at >= NOW() - make_interval(days => %s)
            GROUP BY 1 ORDER BY 1
        """,
    }
    try:
        result: dict = {"days": days}
        with psycopg.connect(DB_URL, row_factory=dict_row, connect_timeout=5) as conn:
            with conn.cursor() as cursor:
                for key, q in sql.items():
                    cursor.execute(q, (days,))
                    rows = [dict(r) for r in cursor.fetchall()]
                    result[key] = rows[0] if key == "totals" else rows
        for row in result.get("daily", []):
            row["day"] = str(row["day"])
        return 200, result
    except Exception as e:
        _log(f"summary failed: {type(e).__name__}: {e}")
        return 500, {"error": "summary failed"}