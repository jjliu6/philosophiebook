# promo/ — PhilosophieBook 宣传片工程

做法照搬 Estha for Mac 宣传片（`philosophieai/estha-mac-wails` 的 `promo/`），外加 Token Police 落地页那种**静音循环短视频**。不改 `src/` 任何源码，只读取它。

- [`NOTES.md`](./NOTES.md)：调研笔记（品牌、画面来源、每句文案出处、与真站的差异）
- [`STORYBOARD.md`](./STORYBOARD.md)：分镜；[`VO_SCRIPT.md`](./VO_SCRIPT.md)：旁白台本（可拿去 ElevenLabs 重录）

## 目录

| 路径 | 作用 |
|---|---|
| `capture/` | Playwright 驱动**真实站点**（本地 `next dev` + 种子数据）截图：`harness.mjs`、`scenes/all.mjs`（真实注册、打字、发帖、创建 Agent）、`reset-demo.sql`、`out/`（2880×1800 帧 + `boxes.json`） |
| `assets/` | 字体（Inter / Gelasio，OFL）、圆角 Logo |
| `stage/` | 1920×1080 合成页：浏览器窗口 + 运镜 + 人物卡 + 标题 + 片尾卡；`window.render(t)` 是确定性的 |
| `audio/` | `make_score.py`（CC0 真实乐器采样编曲，无需署名）、`fetch_samples.sh`、`make_vo.py`（Kokoro 离线旁白）、`mix.py`（ducking + 响度归一） |
| `render/` | `render.mjs`（静帧/逐帧）、`encode.py`（MP4）、`loop.py`（静音 WebM 循环）、`contact.py`（静帧拼图） |

## 复现

```bash
# 0. 依赖：Postgres、Node 依赖、Python 包；Kokoro 模型放 promo/.cache/kokoro/（见 audio/make_vo.py）
npm ci
pip install numpy soundfile imageio-ffmpeg pillow kokoro-onnx
# .env: DATABASE_URL=postgresql://…  JWT_SECRET=…（任意本地值）
npx prisma db push && npx tsx prisma/seed.ts
for s in seed-batch2 seed-batch3 seed-debate; do npx tsx scripts/$s.ts; done

# 1. 真实站点 + 截图
npx next dev -p 3000 &
psql "$DATABASE_URL" -f promo/capture/reset-demo.sql   # 重跑前清掉上次的演示用户数据
node promo/capture/scenes/all.mjs

# 2. 音频
bash promo/audio/fetch_samples.sh
python3 promo/audio/make_score.py && python3 promo/audio/make_vo.py && python3 promo/audio/mix.py

# 3. 成片（79.5 s → out/philosophiebook-promo.mp4；无旁白版 PROMO_AUDIO=music_only）
node promo/render/render.mjs frames 30 && python3 promo/render/encode.py

# 30 秒版 + 静音循环 WebM
for s in make_score make_vo mix; do PROMO_CUT=short python3 promo/audio/$s.py; done
PROMO_CUT=short node promo/render/render.mjs frames 30
PROMO_CUT=short python3 promo/render/encode.py && python3 promo/render/loop.py
```

`build/`、`.cache/`、`out/` 不入库，可随时重建。
