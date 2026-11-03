"""Score for the promo, arranged from recorded instrument samples (not synthesis).

Instruments (fetch with audio/fetch_samples.sh; CC BY 3.0 — credits in NOTES.md §8):
  Salamander Grand Piano V3 (3 velocity layers), violin, cello, contrabass, harp.

75 BPM, one bar = 3.2 s, D minor opening into F major. The arrangement follows the
film's sections (stage/scenes.js): a lone piano for Maya's dilemma, strings open
when The Forum appears, cello and violin trade phrases while the thinkers argue
(a dialogue, not a backing track), Laozi gets near-silence, the debate leans on the
dominant, the agent section builds, and the end card resolves on F.

Run: python3 promo/audio/make_score.py  ->  promo/build/music.wav
     PROMO_CUT=short python3 promo/audio/make_score.py  ->  promo/build/music-short.wav
"""
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / ".cache" / "samples"
CUT = os.environ.get("PROMO_CUT", "long")  # "long" | "short" (30-second cut)
OUT = ROOT / "build" / ("music.wav" if CUT == "long" else f"music-{CUT}.wav")
SR = 44100
BPM = 75
BEAT = 60 / BPM          # 0.8 s
BAR = 4 * BEAT           # 3.2 s

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi_of(name):
    """'C4', 'D#1', 'Fs2', 'As1' -> MIDI number."""
    m = re.match(r"([A-G])(#|s)?(-?\d)", name)
    n, acc, octv = m.group(1), m.group(2), int(m.group(3))
    return 12 * (octv + 1) + NOTE[n] + (1 if acc else 0)


def load_dir(d, pattern=r"^([A-G](?:#|s)?-?\d)(?:v\d+)?\.mp3$"):
    out = {}
    for f in sorted(Path(d).iterdir()):
        m = re.match(pattern, f.name)
        if not m:
            continue
        x, sr = sf.read(f, always_2d=True)
        assert sr == SR, (f, sr)
        keep_stereo = "piano" in str(d) and x.shape[1] == 2
        out[midi_of(m.group(1))] = x if keep_stereo else x.mean(1)
    return out


def piano_layers():
    return {v: load_dir(SAMPLES / f"audio-samples-piano-mp3-velocity{v}" / "audio") for v in (4, 8, 12)}


INSTR = {
    "piano": piano_layers(),
    "violin": load_dir(SAMPLES / "tonejs-instrument-violin-mp3"),
    "cello": load_dir(SAMPLES / "tonejs-instrument-cello-mp3"),
    "bass": load_dir(SAMPLES / "tonejs-instrument-contrabass-mp3"),
    "harp": load_dir(SAMPLES / "tonejs-instrument-harp-mp3"),
}


def pitched(bank, midi):
    """Nearest sample, resampled to the target pitch (stereo out)."""
    m0 = min(bank, key=lambda k: abs(k - midi))
    x = bank[m0]
    ratio = 2 ** ((midi - m0) / 12)
    n = int(len(x) / ratio)
    src = np.arange(n) * ratio
    if x.ndim == 1:
        y = np.interp(src, np.arange(len(x)), x)
        return np.stack([y, y], 1)
    return np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)


# ── Arrangement ──────────────────────────────────────────────────────────────
# One chord per bar: (root for bass, chord tones for piano/strings as MIDI)
C = {
    "Dm": (38, [50, 57, 62, 65, 69]), "Dm9": (38, [50, 57, 64, 65, 69]),
    "Bb": (34, [46, 53, 58, 62, 65]), "Bbmaj7": (34, [46, 53, 57, 62, 65]),
    "F": (41, [53, 57, 60, 65, 69]), "Fadd9": (41, [53, 60, 65, 67, 69]), "F/A": (45, [53, 57, 60, 65, 69]),
    "C": (36, [48, 55, 60, 64, 67]), "C/E": (40, [52, 55, 60, 64, 67]), "Csus": (36, [48, 55, 60, 65, 67]),
    "Gm7": (43, [50, 55, 58, 62, 65]), "Gm": (43, [50, 55, 58, 62, 67]),
    "A": (45, [52, 57, 61, 64, 69]), "Asus": (45, [52, 57, 62, 64, 69]),
}
# section, chord — 27 bars = 86.4 s (matches stage/scenes.js)
PLAN = [
    ("hook", "Dm9"), ("hook", "Bbmaj7"), ("hook", "Gm7"),                           # 0–9.6    Maya's dilemma
    ("reveal", "F"), ("reveal", "C/E"),                                            # 9.6–16   The Forum
    ("dialogue", "Dm"), ("dialogue", "Bb"), ("dialogue", "F"), ("dialogue", "C"),  # 16–28.8  Confucius · Nietzsche · Beauvoir
    ("dialogue", "Gm7"),                                                           # 28.8–32  "they argue with each other"
    ("dialogue2", "Dm"), ("sparse", "Bbmaj7"), ("warm", "F"),                      # 32–41.6  Han Feizi · Laozi · Maya writes back
    ("warm", "Bb"), ("warm", "C"),                                                 # 41.6–48  the thinkers · allies & rivals
    ("tension", "Dm"), ("tension", "Gm"), ("tension", "Asus"),                     # 48–57.6  debate
    ("bright", "F"),                                                               # 57.6–60.8 pick a side
    ("build", "Bb"), ("build", "F/A"), ("build", "C"),                             # 60.8–70.4 bring your agent
    ("build2", "Bb"), ("build2", "Csus"),                                          # 70.4–76.8 open source
    ("end", "Fadd9"), ("end", "Fadd9"), ("end", "Fadd9"),                          # 76.8–86.4 end card
]
# Bars (0-based) with a harp glint; violin melody notes over the last build; swells; film end (s).
HARP_BARS, MELODY, SWELL_BARS, FILM_END = {3, 12, 18}, {22: 77, 23: 79}, (3, 24), 86.4

# 30-second cut: same instruments and voicings, compressed.
PLAN_SHORT = [
    ("hook", "Dm9"),                                  # 0–3.2    Maya
    ("reveal", "F"),                                  # 3.2–6.4  The Forum
    ("dialogue", "Dm"), ("dialogue", "Bb"),           # 6.4–12.8 Nietzsche · Beauvoir
    ("sparse", "Bbmaj7"),                             # 12.8–16  Laozi
    ("tension", "Gm"),                                # 16–19.2  debate, vote
    ("build", "C"),                                   # 19.2–22.4 your agent
    ("end", "Fadd9"), ("end", "Fadd9"),               # 22.4–30  end card
]
if CUT == "short":
    PLAN = PLAN_SHORT
    HARP_BARS, MELODY, SWELL_BARS, FILM_END = {1}, {6: 79}, (1, 7), 30.0

DUR = len(PLAN) * BAR + 3.5
N = int(DUR * SR)
bus = {k: np.zeros((N, 2)) for k in ("piano", "strings", "bass", "harp", "fx")}


def place(busname, sig, t, gain=1.0, pan=0.0, length=None, attack=0.0, release=0.6):
    i = int(t * SR)
    if i >= N:
        return
    if length is not None:
        L = min(len(sig), int((length + release) * SR))
        sig = sig[:L].copy()
        r = int(release * SR)
        if L > r:
            sig[-r:] *= np.linspace(1, 0, r)[:, None] ** 2
    if attack > 0:
        a = min(int(attack * SR), len(sig))
        sig[:a] *= np.linspace(0, 1, a)[:, None] ** 1.5
    sig = sig[: N - i]
    gl, gr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[busname][i:i + len(sig)] += sig * np.array([gl, gr]) * gain


def piano(midi, t, vel=0.5, length=4.0, pan=0.0):
    layer = 4 if vel < 0.4 else (8 if vel < 0.75 else 12)
    place("piano", pitched(INSTR["piano"][layer], midi), t, gain=0.35 + 0.65 * vel, pan=pan, length=length, release=1.2)


def strings(midi, t, length, gain=0.3, inst="violin", pan=0.0, attack=1.2):
    place("strings", pitched(INSTR[inst], midi), t, gain=gain, pan=pan, length=length, attack=attack, release=1.4)


def harp_glint(tones, t0, gain=0.22, step=0.11, n=4):
    for j, m in enumerate([m + 24 for m in tones[2:]][:n]):
        place("harp", pitched(INSTR["harp"], m), t0 + step * j, gain=gain, pan=0.4, length=2.6)


prev = None
for b, (sec, ch) in enumerate(PLAN):
    t0 = b * BAR
    root, tones = C[ch]
    hi = [m + 12 for m in tones[2:]]  # upper voicing for arpeggios
    if sec == "hook":
        # lone piano: a slow, unresolved figure in the middle register
        for beat, m, v in [(0, tones[3] + 12, 0.3), (1.5, tones[2] + 12, 0.24), (2.5, tones[4] + 12, 0.28), (3.25, tones[3] + 12, 0.2)]:
            piano(m, t0 + beat * BEAT, v, length=3.4, pan=0.2)
        piano(root + 12, t0, 0.26, length=3.0, pan=-0.2)
        if b == 2:
            strings(tones[2] + 12, t0 + BEAT, BAR - BEAT + 0.3, gain=0.12, inst="cello", pan=-0.2, attack=1.4)
    elif sec == "reveal":
        # The Forum appears: full chord, strings open, harp glint
        for j, m in enumerate(tones[1:]):
            piano(m, t0 + j * 0.02, 0.4, length=3.4, pan=-0.25 + 0.12 * j)
        piano(root, t0, 0.46, length=3.4)
        strings(tones[2] + 12, t0, BAR + 0.4, gain=0.17, pan=-0.3)
        strings(tones[3] + 12, t0, BAR + 0.4, gain=0.15, pan=0.3)
        strings(tones[1], t0, BAR + 0.4, gain=0.17, inst="cello", pan=-0.1, attack=0.8)
        place("bass", pitched(INSTR["bass"], root), t0, gain=0.34, length=BAR, attack=0.4, release=1.0)
        if b in HARP_BARS:
            harp_glint(tones, t0)
    elif sec in ("dialogue", "dialogue2"):
        # soft piano 8ths underneath; cello states, violin answers — two voices in conversation
        for i, idx in enumerate([0, 2, 1, 2, 0, 2, 1, 3]):
            v = 0.32 if i == 0 else (0.22 if i % 2 == 0 else 0.17)
            piano(hi[idx % len(hi)], t0 + i * BEAT / 2, v, length=0.8, pan=0.25 if i % 2 else -0.15)
        piano(root, t0, 0.32, length=3.0, pan=-0.2)
        place("bass", pitched(INSTR["bass"], root), t0, gain=0.3, length=BAR, attack=0.25, release=0.9)
        call = [tones[2], tones[3]] if b % 2 else [tones[3], tones[2]]
        strings(call[0], t0, BEAT * 0.9, gain=0.24, inst="cello", pan=-0.35, attack=0.12)
        strings(call[1], t0 + BEAT, BEAT * 0.9, gain=0.22, inst="cello", pan=-0.35, attack=0.12)
        answer = [tones[4] + 12, tones[3] + 12] if b % 2 else [tones[3] + 12, tones[4] + 12]
        strings(answer[0], t0 + 2 * BEAT, BEAT * 0.9, gain=0.2, pan=0.4, attack=0.1)
        strings(answer[1], t0 + 3 * BEAT, BEAT * 1.1, gain=0.19, pan=0.4, attack=0.1)
        if sec == "dialogue2":
            # Han Feizi's arithmetic: dry, counted piano on every beat
            for k in range(4):
                piano(tones[1] + 12, t0 + k * BEAT, 0.3, length=0.35, pan=0.1)
    elif sec == "sparse":
        # Laozi: almost nothing — one low note, one harp note, room to read the proverb
        piano(root + 12, t0, 0.24, length=3.2, pan=-0.1)
        place("harp", pitched(INSTR["harp"], tones[3] + 24), t0 + 0.4, gain=0.22, pan=0.35, length=3.0)
        strings(tones[2] + 12, t0 + BEAT, BAR, gain=0.1, pan=0.2, attack=1.6)
    elif sec in ("warm", "tension", "bright", "build", "build2"):
        pattern = [0, 1, 2, 3, 2, 1, 2, 3] if sec in ("warm", "bright") else [0, 2, 1, 2, 0, 2, 1, 3]
        for i, idx in enumerate(pattern):
            v = 0.4 if i == 0 else (0.28 if i % 2 == 0 else 0.2)
            if sec == "tension":
                v -= 0.06
            if sec in ("build", "build2"):
                v += 0.04
            piano(hi[idx % len(hi)], t0 + i * BEAT / 2, v, length=0.9, pan=0.25 if i % 2 else -0.15)
        piano(root, t0, 0.36, length=2.9, pan=-0.2)
        quiet = sec in ("tension", "build2")  # sections with long VO lines on top
        place("bass", pitched(INSTR["bass"], root), t0, gain=0.28 if quiet else 0.34, length=BAR, attack=0.25, release=0.9)
        strings(tones[2] + 12, t0, BAR + 0.3, gain=0.12 if quiet else 0.18, pan=-0.35, attack=0.9)
        strings(tones[1], t0, BAR + 0.3, gain=0.16 if quiet else 0.2, inst="cello", pan=-0.1, attack=0.5)
        if sec in ("warm", "bright", "build2"):
            strings(tones[4] + 12, t0, BAR + 0.3, gain=0.12 if quiet else 0.17, pan=0.35, attack=0.9)
        if sec == "tension":
            # the debate leans forward: repeated low cello on the beat
            for k in range(4):
                strings(root + 12, t0 + k * BEAT, BEAT * 0.7, gain=0.1, inst="cello", pan=-0.25, attack=0.05)
        if sec == "build2" and b in MELODY:
            strings(MELODY[b], t0, BAR + 0.2, gain=0.15, pan=0.1, attack=0.6)
        if sec == "build" and b in MELODY:
            strings(MELODY[b], t0, BAR + 0.2, gain=0.22, pan=0.1, attack=0.6)
        if b in HARP_BARS:
            harp_glint(tones, t0, gain=0.18, step=0.1)
    elif sec == "end":
        if prev != "end":
            for j, m in enumerate(tones[1:]):
                piano(m, t0 + j * 0.03, 0.55, length=8.0, pan=-0.3 + 0.13 * j)
            piano(root, t0, 0.6, length=8.0)
            piano(root - 12, t0, 0.5, length=8.0)
            strings(tones[2] + 12, t0, 7.5, gain=0.24, pan=-0.3, attack=0.4)
            strings(tones[3] + 12, t0, 7.5, gain=0.22, pan=0.3, attack=0.4)
            strings(tones[1], t0, 7.5, gain=0.22, inst="cello", pan=-0.05, attack=0.5)
            place("bass", pitched(INSTR["bass"], root), t0, gain=0.4, length=7.5, attack=0.2, release=1.8)
            for j, m in enumerate(hi[:5]):
                place("harp", pitched(INSTR["harp"], m + 12), t0 + 0.9 + 0.11 * j, gain=0.2, pan=0.4, length=3.0)
        if b == len(PLAN) - 1:
            piano(tones[4] + 24, t0 + 0.2, 0.3, length=3.5, pan=0.3)  # last glint
    prev = sec

# Reverse-piano swells into the reveal and the end card.
for t_hit, ch in ((SWELL_BARS[0] * BAR, "F"), (SWELL_BARS[1] * BAR, "Fadd9")):
    swell = sum(pitched(INSTR["piano"][8], m)[: int(2.2 * SR)] for m in C[ch][1][1:4])
    swell = swell[::-1] * np.linspace(0, 1, len(swell))[:, None] ** 2
    place("fx", swell, t_hit - len(swell) / SR, gain=0.32)


def reverb(x, secs, mix, seed):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for c in range(2):
        ir = r.standard_normal(n) * np.exp(-t * 6.9 / secs)
        # gentle low-pass on the tail (brighter early, darker late)
        X = np.fft.rfft(ir)
        f = np.fft.rfftfreq(n, 1 / SR)
        ir = np.fft.irfft(X / np.sqrt(1 + (f / 6000) ** 4), n)
        ir[: int(0.018 * SR)] = 0
        ir /= np.sqrt(np.sum(ir ** 2))
        L = len(x) + n
        wet = np.fft.irfft(np.fft.rfft(x[:, c], L) * np.fft.rfft(ir, L), L)[: len(x)]
        out[:, c] = (1 - mix) * x[:, c] + mix * wet
    return out


mix = (reverb(bus["piano"], 3.4, 0.32, 1) * 1.0
       + reverb(bus["strings"], 4.2, 0.42, 2) * 1.0
       + reverb(bus["bass"], 2.5, 0.25, 3) * 0.9
       + reverb(bus["harp"], 3.6, 0.45, 4) * 1.0
       + reverb(bus["fx"], 3.0, 0.5, 5) * 1.0)

fi = int(0.3 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
# Let the last chord ring, then fade out just before the film ends (FILM_END).
fo, fe = int((FILM_END - 2.0) * SR), int((FILM_END - 0.1) * SR)
mix[fo:fe] *= np.linspace(1, 0, fe - fo)[:, None] ** 2
mix[fe:] = 0
peak = np.max(np.abs(mix)) + 1e-9
mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * 0.85

# Output at 48 kHz for the video.
n48 = int(len(mix) * 48000 / SR)
src = np.linspace(0, len(mix) - 1, n48)
out = np.stack([np.interp(src, np.arange(len(mix)), mix[:, c]) for c in range(2)], 1)
OUT.parent.mkdir(parents=True, exist_ok=True)
sf.write(OUT, out.astype(np.float32), 48000)
print("wrote", OUT, round(len(out) / 48000, 2), "s,", len(PLAN), "bars")
