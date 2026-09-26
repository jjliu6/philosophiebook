"""Score for the promo, arranged from recorded instrument samples (not synthesis).

Instruments: VS Chamber Orchestra Community Edition (VSCO-2 CE) — CC0 1.0, public
domain, no attribution required. Fetch with audio/fetch_samples.sh.
  Upright piano (pp / mf / f), violin section, cello section, solo contrabass, harp.

80 BPM, one bar = 3.0 s, D major. The arrangement follows the film's sections
(stage/scenes.js): a lone piano for the hook, strings open up when the Forum appears,
a light piano pulse carries the threads, the human/agent section builds,
and the end card resolves on D.

Run: python3 promo/audio/make_score.py  ->  promo/build/music.wav
"""
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / ".cache" / "vsco"
CUT = os.environ.get("PROMO_CUT", "long")  # "long" | "short" (30-second cut)
OUT = ROOT / "build" / ("music.wav" if CUT == "long" else f"music-{CUT}.wav")
SR = 44100
BPM = 80
BEAT = 60 / BPM          # 0.75 s
BAR = 4 * BEAT           # 3.0 s
rng = np.random.default_rng(3)

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def midi_of(name):
    """'C4', 'D#1', 'Fs2', 'As1' -> MIDI number."""
    m = re.match(r"([A-G])(#|s)?(-?\d)", name)
    n, acc, octv = m.group(1), m.group(2), int(m.group(3))
    return 12 * (octv + 1) + NOTE[n] + (1 if acc else 0)


def load_dir(d, must=""):
    """One sample per note from a VSCO-2 CE folder; the note name is the `_C4_` token."""
    out = {}
    for f in sorted(Path(d).glob("*.wav")):
        m = re.search(r"_([A-G]#?-?\d)_", f.name)
        if not m or must not in f.name:
            continue
        midi = midi_of(m.group(1))
        if midi in out:
            continue
        x, sr = sf.read(f, always_2d=True)
        if sr != SR:
            n = int(len(x) * SR / sr)
            x = np.stack([np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x[:, c]) for c in range(x.shape[1])], 1)
        out[midi] = x if x.shape[1] == 2 else x.mean(1)
    assert out, (d, must)
    return out


V = SAMPLES
INSTR = {
    "piano": {4: load_dir(V / "Keys/Upright Nr1", "_pp_"), 8: load_dir(V / "Keys/Upright Nr1", "_mf_"),
              12: load_dir(V / "Keys/Upright Nr1", "_f_")},
    "violin": load_dir(V / "Strings/Violin Section/susVib", "_v1"),
    "cello": load_dir(V / "Strings/Cello Section/susvib", "_v1"),
    "bass": load_dir(V / "Strings/Solo Contrabass/SusVib", "_v1"),
    "harp": load_dir(V / "Strings/Harp"),
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
    "D": (38, [50, 57, 62, 66, 69]), "Dadd9": (38, [50, 57, 64, 66, 69]),
    "A/C#": (37, [49, 57, 61, 64, 69]), "A": (45, [45, 57, 61, 64, 69]), "Asus": (45, [45, 57, 62, 64, 69]),
    "Bm": (47, [47, 54, 59, 62, 66]), "Bm7": (47, [47, 54, 57, 62, 66]),
    "G": (43, [43, 55, 59, 62, 67]), "Gmaj7": (43, [43, 55, 59, 62, 66]),
    "D/F#": (42, [42, 57, 62, 66, 69]), "Em7": (40, [40, 55, 59, 62, 67]),
}
# section, chord — 27 bars = 81 s (matches stage/scenes.js)
PLAN = [
    ("hook", "Bm7"), ("hook", "Gmaj7"),                                    # 0–6   black cards
    ("reveal", "Dadd9"), ("reveal", "Asus"),                               # 6–12  The Forum
    ("pulse", "Bm7"), ("pulse", "G"), ("pulse", "D"), ("pulse", "A/C#"), ("pulse", "Bm7"),  # 12–27 AI love thread
    ("pulse", "G"), ("pulse", "D"), ("pulse", "A"),                        # 27–36 thinkers
    ("pulse2", "Bm7"), ("pulse2", "G"), ("pulse2", "Em7"), ("pulse2", "Asus"),  # 36–48 debate
    ("warm", "G"), ("warm", "D/F#"), ("warm", "Em7"), ("warm", "A"),       # 48–60 you join
    ("build", "G"), ("build", "A"), ("build", "Asus"),                      # 60–69 your agent
    ("end", "Dadd9"), ("end", "Dadd9"), ("end", "Dadd9"),                   # 69–78 end card
]
HARP_BARS, MELODY, SWELL_BARS, FILM_END = {2, 16, 18}, {20: 74, 21: 76, 22: 78}, (2, 23), 79.5

# 30-second cut: 10 bars, same instruments and voicings.
PLAN_SHORT = [
    ("hook", "Bm7"),                                                      # 0–3   card
    ("reveal", "Dadd9"),                                                  # 3–6   The Forum
    ("pulse", "D"), ("pulse", "A/C#"), ("pulse2", "Bm7"),                 # 6–15  forum · debate
    ("warm", "G"), ("build", "A"),                                        # 15–21 human · agent
    ("end", "Dadd9"), ("end", "Dadd9"), ("end", "Dadd9"),                 # 21–30 end card
]
if CUT == "short":
    PLAN = PLAN_SHORT
    HARP_BARS, MELODY, SWELL_BARS, FILM_END = {1, 5}, {6: 76}, (1, 7), 30.0

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


prev = None
for b, (sec, ch) in enumerate(PLAN):
    t0 = b * BAR
    root, tones = C[ch]
    hi = [m + 12 for m in tones[2:]]  # upper voicing for arpeggios
    if sec == "hook":
        # lone piano: a slow, questioning figure
        for k, (beat, m, v) in enumerate([(0, tones[3] + 12, 0.32), (1.5, tones[2] + 12, 0.26), (2.5, tones[4] + 12, 0.3)]):
            piano(m, t0 + beat * BEAT, v, length=3.5, pan=0.2)
        piano(root + 12, t0, 0.28, length=3.0, pan=-0.2)
    elif sec == "reveal":
        # The Forum appears: full chord, strings open, harp glint
        for j, m in enumerate(tones[1:]):
            piano(m, t0 + j * 0.02, 0.45, length=3.2, pan=-0.25 + 0.12 * j)
        piano(root, t0, 0.5, length=3.2)
        strings(tones[2] + 12, t0, BAR + 0.4, gain=0.22, pan=-0.3)
        strings(tones[3] + 12, t0, BAR + 0.4, gain=0.2, pan=0.3)
        place("bass", pitched(INSTR["bass"], root), t0, gain=0.35, length=BAR, attack=0.4, release=1.0)
        if b in HARP_BARS:
            for j, m in enumerate(hi[:4]):
                place("harp", pitched(INSTR["harp"], m + 12), t0 + 0.12 * j, gain=0.25, pan=0.4, length=2.5)
    elif sec in ("pulse", "pulse2", "warm", "build"):
        # piano 8th-note pulse on the upper voicing; accent on 1
        pattern = [0, 2, 1, 2, 0, 2, 1, 3] if sec != "warm" else [0, 1, 2, 3, 2, 1, 2, 3]
        for i, idx in enumerate(pattern):
            v = 0.42 if i == 0 else (0.3 if i % 2 == 0 else 0.22)
            if sec == "build":
                v += 0.08
            piano(hi[idx % len(hi)], t0 + i * BEAT / 2, v, length=0.9, pan=0.25 if i % 2 else -0.15)
        piano(root, t0, 0.38, length=2.8, pan=-0.2)
        place("bass", pitched(INSTR["bass"], root), t0, gain=0.3 if sec == "pulse" else 0.36, length=BAR, attack=0.25, release=0.9)
        if sec in ("pulse2", "warm", "build"):
            strings(tones[2] + 12, t0, BAR + 0.3, gain=0.16 if sec == "pulse2" else 0.22, pan=-0.35, attack=0.9)
        if sec in ("warm", "build"):
            strings(tones[4] + 12, t0, BAR + 0.3, gain=0.18, pan=0.35, attack=0.9)
            strings(tones[1], t0, BAR + 0.3, gain=0.2, inst="cello", pan=-0.1, attack=0.5)
        if sec == "build":
            # melody in violin octave above, rising across the three bars
            mel = MELODY.get(b)
            if mel:
                strings(mel, t0, BAR + 0.2, gain=0.24, pan=0.1, attack=0.6)
        if sec == "warm" and b in HARP_BARS:
            for j, m in enumerate(hi[:4]):
                place("harp", pitched(INSTR["harp"], m + 12), t0 + 0.1 * j, gain=0.18, pan=0.4, length=2.0)
    elif sec == "end":
        if prev != "end":
            for j, m in enumerate(tones[1:]):
                piano(m, t0 + j * 0.03, 0.55, length=7.5, pan=-0.3 + 0.13 * j)
            piano(root, t0, 0.6, length=7.5)
            piano(root - 12, t0, 0.5, length=7.5)
            strings(tones[2] + 12, t0, 7.0, gain=0.24, pan=-0.3, attack=0.4)
            strings(tones[3] + 12, t0, 7.0, gain=0.22, pan=0.3, attack=0.4)
            strings(tones[4] + 12, t0, 7.0, gain=0.18, pan=0.05, attack=0.6)
            place("bass", pitched(INSTR["bass"], root), t0, gain=0.4, length=7.0, attack=0.2, release=1.8)
            for j, m in enumerate(hi[:5]):
                place("harp", pitched(INSTR["harp"], m + 12), t0 + 0.9 + 0.11 * j, gain=0.2, pan=0.4, length=3.0)
        if b == len(PLAN) - 1:
            piano(tones[3] + 24, t0 + 0.2, 0.3, length=3.5, pan=0.3)  # last glint
    prev = sec

# Reverse-piano swells into the reveal (6 s) and the end card (72 s).
for t_hit, ch in ((SWELL_BARS[0] * BAR, "Dadd9"), (SWELL_BARS[1] * BAR, "Dadd9")):
    swell = sum(pitched(INSTR["piano"][8], m)[: int(2.2 * SR)] for m in C[ch][1][1:4])
    swell = swell[::-1] * np.linspace(0, 1, len(swell))[:, None] ** 2
    place("fx", swell, t_hit - len(swell) / SR, gain=0.35)


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


mix = (reverb(bus["piano"], 3.2, 0.30, 1) * 1.0
       + reverb(bus["strings"], 4.0, 0.42, 2) * 1.0
       + reverb(bus["bass"], 2.5, 0.25, 3) * 0.9
       + reverb(bus["harp"], 3.5, 0.45, 4) * 1.0
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
