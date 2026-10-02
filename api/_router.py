# ==================================================================
# api/_router.py — 6 Python functions → 1 (main.py)
#
# "_" తో మొదలవుతుంది కాబట్టి Vercel దీన్ని function గా తయారు చేయదు.
# main.py కి వచ్చిన request ఏ పాత endpoint దో గుర్తించి,
# ఆ file లోని handler కే పంపిస్తుంది — ఆ files లోపలి code మారదు.
# ==================================================================

import importlib
import os
import sys
from urllib.parse import parse_qs, urlparse

# _aksharamala.py వంటి modules దొరకడానికి
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# పాత URL పేరు → కొత్త module పేరు
ROUTES = {
    "aksharamala": "_aksharamala",
    "gita": "_gita",
    "rag_chat": "_rag_chat",
    "reading_recommendations": "_reading_recommendations",
    "sametalu_agent": "_sametalu_agent",
}
# అవసరమైనప్పుడు మాత్రమే import —
# langgraph వంటి భారీవి main endpoints ని నెమ్మది చేయవు
_loaded = {}


def _route_for(path: str):
    parsed = urlparse(path)

    # vercel.json rewrite ఇచ్చే గుర్తు:
    # /api/main?__fn=aksharamala
    fn = (parse_qs(parsed.query).get("__fn") or [""])[0]

    if fn in ROUTES:
        return fn

    # లేదా అసలు path:
    # /api/aksharamala
    last = parsed.path.rstrip("/").rsplit("/", 1)[-1]

    return last if last in ROUTES else None


def delegate(handler_self, method: str) -> bool:
    """
    పాత endpoint request అయితే
    ఆ module handler కి పంపి True;
    లేకపోతే False (main.py నే చూసుకుంటుంది).
    """

    name = _route_for(handler_self.path)

    if not name:
        return False

    module = _loaded.get(name)

    if module is None:
        module = importlib.import_module(ROUTES[name])
        _loaded[name] = module

    target = module.handler

    func = getattr(target, method, None)

    if func is None:
        handler_self.send_response(405)
        handler_self.send_header(
            "Allow",
            ", ".join(
                m[3:]
                for m in dir(target)
                if m.startswith("do_")
            )
        )
        handler_self.end_headers()
        return True

    # ఈ request ని ఆ file యొక్క handler లాగే నడిపిస్తాం
    # దాని helper methods అన్నీ పనిచేస్తాయి
    handler_self.__class__ = target

    func(handler_self)

    return True