"""
compare_voices.py — generates the SAME poem ("అసహనం") in all 3 candidate
voices, so you can play them back-to-back against your reference file
(అసహన_.wav) and tell me exactly which one matches. Pitch/pace analysis
alone couldn't confirm this with certainty — this settles it definitively
by ear instead of by guessing.

SETUP (run once):
    pip install edge-tts gTTS

USAGE:
    python compare_voices.py

OUTPUT:
    compare-1-mohan.wav   (Edge TTS, te-IN-MohanNeural, default settings)
    compare-2-shruti.wav  (Edge TTS, te-IN-ShrutiNeural, default settings)
    compare-3-gtts.mp3    (Google Translate TTS, single voice)

Play all three next to your uploaded అసహన_.wav and tell me which matches
— then the real generate_audio.py run gets locked to that exact engine
and voice, no more guessing.
"""

import asyncio
import edge_tts
from gtts import gTTS

# Exact same text as your reference file, so pitch/pace compare fairly —
# not a different poem or a shortened test phrase.
POEM_TEXT = (
    "అసహనం. గొప్పవారి జూచి క్రూరులు కొందరు "
    "సహనబుద్ధి లేక సణుగుచుంద్రు ! "
    "హంస జూచి కాకి హింసించబూనదా ? "
    "భావరత్నబాల ! భాగ్యలీల !"
)


async def generate_edge(voice: str, out_path: str):
    communicate = edge_tts.Communicate(POEM_TEXT, voice)
    await communicate.save(out_path)
    print(f"✅ {out_path}")


def generate_gtts(out_path: str):
    tts = gTTS(text=POEM_TEXT, lang="te")
    tts.save(out_path)
    print(f"✅ {out_path}")


async def main():
    print("Generating 3 comparison clips using the exact same poem text...\n")
    await generate_edge("te-IN-MohanNeural", "compare-1-mohan.wav")
    await generate_edge("te-IN-ShrutiNeural", "compare-2-shruti.wav")
    generate_gtts("compare-3-gtts.mp3")
    print("\nDone. Now play all 3 files next to అసహన_.wav (your reference)")
    print("and tell me which one matches — I'll lock the final script to that.")


if __name__ == "__main__":
    asyncio.run(main())