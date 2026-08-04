"""
generate_audio.py — batch-generates poem audio, free, no daily rate limit
(unlike the Vagbodhini site's 10/day cap). Supports TWO engines so you can
directly compare which sounds more natural for Telugu:

  --engine edge   Microsoft Edge's neural voices (te-IN-MohanNeural male,
                   te-IN-ShrutiNeural female). Two distinct voice
                   characters, but can sound flatter/more robotic.

  --engine gtts   Google Translate's TTS engine (via the gTTS library) —
                   often sounds more natural/fluent for Telugu, but only
                   ONE voice exists per language (no separate male/female
                   choice) — this is a real limitation, not a bug.

SETUP (run once):
    pip install edge-tts gTTS

USAGE:
    # Edge TTS, male voice, shaped slower/deeper for an older reading
    # feel (edge-tts has only ONE Telugu male voice, so "elderly" is
    # approximated via rate/pitch, not a different voice actor):
    python generate_audio.py --engine edge --voice te-IN-MohanNeural --out public/audio/male --rate=-15% --pitch=-10Hz --limit 34

    # gTTS, for comparison against Edge — only one voice, no --voice/--rate/--pitch needed:
    python generate_audio.py --engine gtts --out public/audio/google --limit 34

    # Once you've listened to both 34-poem test batches and picked a
    # favorite, run the winner on the full 1140 (drop --limit):
    python generate_audio.py --engine gtts --out public/audio/google

    # Quick single-line tests BEFORE committing to a batch run:
    #   edge-tts --voice te-IN-MohanNeural --rate=-15% --pitch=-10Hz \
    #     --text "నమస్కారం, ఇది పరీక్ష" --write-media test-edge.mp3
    #   python -c "from gtts import gTTS; gTTS('నమస్కారం, ఇది పరీక్ష', lang='te').save('test-gtts.mp3')"

FILENAME CONVENTION (must match PoemCard.tsx exactly):
    Each output file is named after the poem's title, with the same
    characters stripped that the frontend code strips: \\ / : * ? " < > |
    e.g. a poem titled "అసహనం" -> అసహనం.wav (edge) or అసహనం.mp3 (gtts)
    PoemCard.tsx already tries both .wav and .mp3, so either extension works.

RESUMABLE / SAFE TO RE-RUN:
    Skips any poem whose output file already exists (checking both .wav
    and .mp3) — so if it stops partway through, just run the same command
    again and it picks up where it left off instead of regenerating
    everything.
"""

import argparse
import asyncio
import os
import re
import sys
import urllib.request
import json

import edge_tts
from gtts import gTTS

POEMS_API_URL = "https://ratnalabala.vercel.app/api/poems"

# Same character-stripping rule as audioBaseName() in PoemCard.tsx — keep
# these in sync, or generated filenames won't match what the frontend
# looks for.
UNSAFE_CHARS = re.compile(r'[\\/:*?"<>|]+')


def sanitize_title(title: str) -> str:
    cleaned = UNSAFE_CHARS.sub("", title.strip())
    return cleaned or "poem"


def fetch_poems() -> dict:
    """Poems API returns {title: content, ...} — same shape PoemList.tsx
    consumes. Fetched live so this script always uses current data,
    without needing local access to wherever the poems actually live."""
    print(f"Fetching poems from {POEMS_API_URL} ...")
    with urllib.request.urlopen(POEMS_API_URL) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    print(f"Found {len(data)} poems.")
    return data


def already_generated(out_dir: str, base_name: str) -> bool:
    return os.path.exists(os.path.join(out_dir, base_name + ".wav")) or os.path.exists(
        os.path.join(out_dir, base_name + ".mp3")
    )


async def generate_one_edge(
    title: str, content: str, voice: str, out_dir: str, rate: str, pitch: str
) -> None:
    base_name = sanitize_title(title)
    if already_generated(out_dir, base_name):
        print(f"  ⏭  skip (already exists): {base_name}")
        return

    text = f"{title}. {content}"
    out_path = os.path.join(out_dir, base_name + ".wav")

    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(out_path)
        print(f"  ✅ generated: {base_name}.wav")
    except Exception as e:
        print(f"  ❌ FAILED: {base_name} — {e}", file=sys.stderr)


def generate_one_gtts(title: str, content: str, out_dir: str) -> None:
    base_name = sanitize_title(title)
    if already_generated(out_dir, base_name):
        print(f"  ⏭  skip (already exists): {base_name}")
        return

    text = f"{title}. {content}"
    out_path = os.path.join(out_dir, base_name + ".mp3")

    try:
        tts = gTTS(text=text, lang="te")
        tts.save(out_path)
        print(f"  ✅ generated: {base_name}.mp3")
    except Exception as e:
        print(f"  ❌ FAILED: {base_name} — {e}", file=sys.stderr)


async def main():
    parser = argparse.ArgumentParser(description="Batch-generate poem audio with edge-tts or gTTS.")
    parser.add_argument("--engine", choices=["edge", "gtts"], required=True)
    parser.add_argument("--voice", default="te-IN-MohanNeural", help="edge-tts only: te-IN-MohanNeural or te-IN-ShrutiNeural")
    parser.add_argument("--out", required=True, help="output folder, e.g. public/audio/male")
    parser.add_argument("--limit", type=int, default=None, help="only process the first N poems (for testing)")
    parser.add_argument("--rate", default="+0%", help="edge-tts only: e.g. -15%% for a slower reading")
    parser.add_argument("--pitch", default="+0Hz", help="edge-tts only: e.g. -10Hz for a deeper tone")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    poems = fetch_poems()
    items = list(poems.items())
    if args.limit:
        items = items[: args.limit]
        print(f"Limiting to first {args.limit} poems for this test run.")

    if args.engine == "edge":
        print(f"Generating {len(items)} poems with Edge TTS voice '{args.voice}' "
              f"(rate={args.rate}, pitch={args.pitch}) -> {args.out}/\n")
    else:
        print(f"Generating {len(items)} poems with gTTS (Telugu, single voice) -> {args.out}/\n")

    for i, (title, content) in enumerate(items, start=1):
        print(f"[{i}/{len(items)}] {title}")
        if args.engine == "edge":
            await generate_one_edge(title, content, args.voice, args.out, args.rate, args.pitch)
        else:
            generate_one_gtts(title, content, args.out)

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())