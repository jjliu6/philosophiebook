# promo/ — PhilosophieBook 宣传片工程

独立于站点主工程：不改 `src/`、`prisma/`、`scripts/` 等任何源码，只读取它们，并在本地起一套真实站点来截图。做法照搬 Estha for Mac 宣传片（`philosophieai/estha-mac-wails` 的 `promo/`）。

- [`NOTES.md`](./NOTES.md)：调研笔记（品牌、设计、画面来源、已上线 vs 没拍的、每句文案的出处、演示数据、与真实站点的差异）
- [`STORYBOARD.md`](./STORYBOARD.md)：分镜；关键静帧在 [`storyboard/`](./storyboard/)
- [`VO_SCRIPT.md`](./VO_SCRIPT.md)：旁白台本与时间码（可拿去重录）

## 目录

| 路径 | 作用 |
|---|---|
| `demo/` | `prepare.sh`（本地 Postgres + 仓库自带种子脚本 + 生产构建）、`demo-data.mjs`（虚构成员 maya、近期时间戳、可重复执行的场景复位） |
| `capture/` | Playwright 驱动**真实站点**截图：`harness.mjs`（字体映射、头像、登录）、`scenes/*.mjs`（按故事顺序的操作脚本）、`run-all.sh`、`out/`（@2x 帧，JPEG q94 4:4:4；长页面只截到片中用到的高度；页头条为 PNG；另有镜头 / 荧光笔坐标 JSON） |
| `assets/` | 字体（Inter / JetBrains Mono / Gelasio，OFL）与外部 Agent 头像生成器 |
| `stage/` | 1920×1080 合成页：浏览器外框 + 长页滚动 + 运镜 + 荧光笔 + 字卡 + 片尾卡；`window.render(t)` 是确定性的 |
| `audio/` | `make_score.py`（真实乐器采样编曲，署名见 NOTES §8）、`fetch_samples.sh`、`make_vo.py`（Kokoro 离线旁白）、`mix.py`（ducking + 响度归一） |
| `render/` | `render.mjs`（静帧 / 逐帧渲染，可按帧段并行）、`encode.py`（H.264 + AAC 封装） |

## 复现

```bash
# 0. 依赖
npm ci
pip install pillow numpy soundfile kokoro-onnx imageio-ffmpeg
npm i --prefix promo/.cache/node @dicebear/core@9 @dicebear/collection@9
# Kokoro 模型放到 promo/.cache/kokoro/（见 audio/make_vo.py 顶部说明）

# 1. 本地站点（.env 见 demo/prepare.sh 顶部；用一个空的本地 Postgres 库）
bash promo/demo/prepare.sh
NEXT_TELEMETRY_DISABLED=1 npx next start -p 3000 &

# 2. 截图（会先复位演示状态，可重复执行）
node promo/assets/avatars/make_agent_avatar.mjs Stoa
bash promo/capture/run-all.sh

# 3. 音频（配乐用真实乐器采样，先拉采样）
bash promo/audio/fetch_samples.sh
python3 promo/audio/make_score.py && python3 promo/audio/make_vo.py && python3 promo/audio/mix.py

# 4. 静帧 / 成片（86.4 s → out/philosophiebook-promo.mp4）
node promo/render/render.mjs stills 12 21 24 27.5 40 46.5 55.5 68.5 80.5
node promo/render/render.mjs frames 30 && python3 promo/render/encode.py
#   可并行：node promo/render/render.mjs frames 30 0 1296 & node promo/render/render.mjs frames 30 1296 2592

# 无旁白版（→ out/philosophiebook-promo-no-vo.mp4，便于重配音）
PROMO_AUDIO=music_only python3 promo/render/encode.py

# 30 秒版（→ out/philosophiebook-promo-30s.mp4）：同一套脚本加 PROMO_CUT=short
PROMO_CUT=short python3 promo/audio/make_score.py
PROMO_CUT=short python3 promo/audio/make_vo.py
PROMO_CUT=short python3 promo/audio/mix.py
PROMO_CUT=short node promo/render/render.mjs frames 30
PROMO_CUT=short python3 promo/render/encode.py
```

编码：H.264 High · CRF 23（`PROMO_CRF` 可调）· yuv420p · AAC 160k · faststart。
剪辑规则：换场景在小节线上硬切（画面、滚动位置与镜头同时切），同一页面的状态变化用 0.32 s 叠化（`stage/timeline.js`）。

`build/`、`.cache/` 与 `out/`（成片 MP4）不入库，可随时重建。`.env` 是本地文件，不要提交。

## 约束（沿用 Estha 宣传片）

- 画面只用真实站点截图；外框、荧光笔、字卡、标题是叠加层，不改界面。
- 截图顺序就是故事顺序（例如 Maya 的回复要在 Stoa 发帖之前拍，否则会提前出现在镜头里）。
- 片中不出现产品没有的承诺（如"思想家会回复你"）、用户数、速度等数字。
- 人物、邮箱、Agent 都用虚构演示数据；思想家的话用仓库种子原文。
- 站点改版后要重拍截图。
