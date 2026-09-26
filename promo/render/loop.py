"""Silent, looping WebM of the 30-second cut for a landing page / README
(<video autoplay muted loop playsinline>, the way Token Police embeds its demo).

Run after `PROMO_CUT=short node promo/render/render.mjs frames 30`:
  python3 promo/render/loop.py  ->  promo/out/philosophiebook-loop.webm (1600 px wide)
"""
import subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
out = ROOT / "out" / "philosophiebook-loop.webm"
out.parent.mkdir(exist_ok=True)
subprocess.run([
    imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
    "-framerate", "30", "-i", str(ROOT / "build" / "frames-short" / "f-%05d.jpg"),
    "-vf", "scale=1600:-2", "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "1", str(out),
], check=True)
print(out, round(out.stat().st_size / 1e6, 2), "MB")
