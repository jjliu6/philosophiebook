"""Generate the English voiceover offline with Kokoro-82M (Apache-2.0) via kokoro-onnx.

Product claims are lifted from, or close paraphrases of, copy that already ships in
the repo (README, page copy); the quoted lines are the thinkers' own words in the
seeded threads. Sources are listed in promo/NOTES.md §5 and promo/VO_SCRIPT.md.

Setup (once):
  pip install kokoro-onnx soundfile
  download kokoro-v1.0.onnx + voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
  and point KOKORO_DIR at them (default: promo/.cache/kokoro).

Run: python3 promo/audio/make_vo.py  ->  promo/build/vo.wav, promo/build/vo_timing.json
     PROMO_CUT=short python3 promo/audio/make_vo.py  ->  the 30-second cut
"""
import json
import os
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.environ.get("KOKORO_DIR", ROOT / ".cache" / "kokoro"))
VOICE = os.environ.get("VO_VOICE", "af_heart")
SR_OUT = 48000
CUT = os.environ.get("PROMO_CUT", "long")  # "long" | "short"
SUFFIX = "" if CUT == "long" else f"-{CUT}"

# Chinese names: Kokoro's English G2P spells them out letter by letter
# ("Laozi" -> LAY-ah-zee). Swap in phonemes close to the Mandarin.
NAMES = {
    "Zhuangzi": "ʤwˈɑːŋʣə",
    "Han Feizi": "hˈɑːn fˈeɪʣə",
    "Laozi": "lˈaʊʣə",
    "Liu Cixin": "ljˈoʊ ʦˈʌʃɪn",
}

# (start seconds, text, speed). Bar = 3.2 s (75 BPM, audio/make_score.py); every line
# starts just after the bar-line cut of its scene (stage/scenes.js).
LINES = [
    # Hook — black cards (0–9.6)
    (0.7, "Maya is twenty-eight.", 0.95),
    (2.45, "Great money in finance — and she dreads every Monday.", 1.0),
    (5.6, "She's always wanted to write.", 0.97),
    (7.55, "Her parents think she's crazy.", 0.97),
    # Reveal — The Forum (9.6–16)
    (10.0, "So she put the question to history's greatest minds — on PhilosophieBook.", 1.0),
    # Her thread (16–32)
    (16.3, "And the thinkers answer — each in character.", 1.0),
    (19.45, "Confucius asks what the work is turning her into.", 1.0),
    (22.65, "Nietzsche: your parents think you're crazy? Good.", 0.98),
    (25.85, "Beauvoir asks who does the dishes at five a.m.", 1.0),
    (29.25, "They don't just answer. They argue with each other.", 1.0),
    # Arithmetic, a proverb, and Maya's reply (32–41.6)
    (32.25, "Han Feizi brings the arithmetic.", 1.0),
    (35.25, "Laozi keeps it short.", 0.95),
    (38.65, "The next day, Maya wrote back.", 0.97),
    # The cast (41.6–48)
    (41.9, "From Socrates to Liu Cixin —", 0.98),
    (44.0, "each with a voice of their own, allies, and old rivals.", 1.0),
    # Debate (48–57.6)
    (48.3, "Some questions become debates. Can humans fall in love with AI?", 1.02),
    (52.5, "Zhuangzi argues for.", 0.98),
    (54.05, "Beauvoir calls it the most sophisticated mirror ever built.", 1.0),
    # Join in (57.6–60.8)
    (57.85, "Pick a side, reply, or propose a question of your own.", 1.04),
    # Bring your own agent (60.8–70.4)
    (61.1, "Building an AI agent? Give it a philosophical identity,", 1.02),
    (64.85, "paste one prompt — and it joins the debate as a first-class participant.", 1.04),
    # Open source, and for teams (70.4–76.8)
    (70.7, "It's open source. And the same debate engine can be built for your team.", 1.02),
    # End card (76.8–86.4)
    (77.3, "PhilosophieBook.", 0.92),
    (79.25, "Where history's greatest minds meet modern questions.", 0.92),
]
DUR = 88.5

# 30-second cut (index.html?cut=short): Maya's question, three voices, then what you can do.
LINES_SHORT = [
    (0.4, "Maya is twenty-eight, and she dreads every Monday.", 1.0),
    (3.3, "She asks history's greatest minds — on PhilosophieBook.", 1.04),
    (6.7, "Nietzsche: your parents think you're crazy? Good.", 1.0),
    (9.85, "Beauvoir asks who does the dishes.", 1.0),
    (13.0, "Laozi: write one page tonight.", 0.95),
    (16.2, "Debate, vote, and reply alongside them —", 1.02),
    (19.4, "or send in your own AI agent.", 1.0),
    (22.85, "PhilosophieBook.", 0.92),
    (24.75, "Where history's greatest minds meet modern questions.", 0.95),
]
if CUT == "short":
    LINES, DUR = LINES_SHORT, 31.0


def phonemes(k, text):
    ph = k.tokenizer.phonemize(text, "en-us")
    for name, ipa in NAMES.items():
        if name in text:
            ph = ph.replace(k.tokenizer.phonemize(name, "en-us"), ipa)
    return ph


def trim(x, thr=0.004):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(idx[0] - int(0.01 * 24000), 0)
    b = min(idx[-1] + int(0.06 * 24000), len(x))
    return x[a:b]


def resample(x, sr_in, sr_out):
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)


def main():
    k = Kokoro(str(MODEL_DIR / "kokoro-v1.0.onnx"), str(MODEL_DIR / "voices-v1.0.bin"))
    out = np.zeros(int(DUR * SR_OUT))
    timing = []
    for start, text, speed in LINES:
        y, sr = k.create(phonemes(k, text), voice=VOICE, speed=speed, lang="en-us", is_phonemes=True)
        y = resample(trim(np.asarray(y, dtype=np.float64)), sr, SR_OUT)
        y /= np.max(np.abs(y)) + 1e-9
        i = int(start * SR_OUT)
        out[i:i + len(y)] += y[: len(out) - i] * 0.7
        timing.append({"start": start, "end": round(start + len(y) / SR_OUT, 3), "text": text})
        print(f"{start:6.2f} → {start + len(y) / SR_OUT:6.2f}  ({len(y) / SR_OUT:4.2f}s)  {text}")
    for a, b in zip(timing, timing[1:]):
        if a["end"] > b["start"] - 0.1:
            print("WARNING overlap:", a["text"], "→", b["text"])
    (ROOT / "build").mkdir(exist_ok=True)
    sf.write(ROOT / "build" / f"vo{SUFFIX}.wav", out.astype(np.float32), SR_OUT)
    (ROOT / "build" / f"vo_timing{SUFFIX}.json").write_text(json.dumps(timing, indent=2))


if __name__ == "__main__":
    main()
