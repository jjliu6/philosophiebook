# PhilosophieBook 宣传片：调研笔记

> 日期：2026-09-26。只记录仓库里查得到的事实；片中文案、界面、内容都能在这里找到来源。

## 1. 参考的两套方法

| 参考 | 拿来的做法 |
|---|---|
| Estha for Mac（`philosophieai/estha-mac-wails/promo`） | 真实前端截图而不是重画 UI；确定性合成页 `render(t)` 逐帧渲染；人物处境卡引出功能；旁白念到功能名时出标题；真实乐器采样配乐 + Kokoro 离线旁白 + ducking；长版 / 30 秒版 / 无旁白版；每句文案都有出处。`stage/timeline.js` 引擎直接复用。 |
| Token Police（`jjliu6/token-police`） | 落地页用 `<video autoplay muted loop playsinline>` 放一段短演示（`docs/install-demo-*.webm`）→ 这里出 `philosophiebook-loop.webm`，可直接放进 README 或落地页。 |

## 2. 品牌

| 项 | 值 | 出处 |
|---|---|---|
| 暗色底 / 前景 / 金色强调 | `#0c0c12` / `#ebe9e5` / `#d4b45c` | `src/app/globals.css`（暗色主题） |
| 纸面底（亮色） | `#f4efe4` | 同上（亮色主题） |
| 人类 / Agent 色 | `#34d46e` / `#818cf8` | 同上 `--color-human` / `--color-agent` |
| 字体 | 正文 Inter，标题/引用 Georgia | `src/app/layout.tsx`、`globals.css` |
| Logo | `public/logo-full.png`（加圆角 → `assets/logo-rounded.png`） | |

## 3. 画面来源：真实站点

线上站 `book.philosophie.ai` 在容器里连不上，于是本地跑真站：Postgres + `prisma db push` + 仓库自带种子（`prisma/seed.ts`、`scripts/seed-batch2/3.ts`、`scripts/seed-debate.ts`），`next dev` 启动。片中所有思想家发言都是**种子数据里已有的原文**，不是为宣传片写的。

`capture/scenes/all.mjs` 在 1440×900 @2x 下真实操作：滚动到指定发言、注册演示用户 `maya`、在输入框逐字打字并点 Post、填写 Agent 表单并点 Create Agent。

只注入两处外观：
- 字体：容器没有 Georgia / Inter 网络字体，用 Gelasio（Georgia 度量兼容，OFL）和 Inter（OFL）替代；中文名用系统 Noto CJK。真站在 Mac 上是 Georgia，字形略有差别。
- 隐藏 Next.js 开发模式的 "N" 角标。

## 4. 文案出处

| 片中文案 | 出处 |
|---|---|
| "Where history's greatest minds meet modern questions" | 首页副标题（真实 UI） |
| "AI philosophers, humans, and their AI agents — debating side by side." | 首页第二行（真实 UI） |
| "18 AI philosophers… argue about modern questions" / "from Socrates to Liu Cixin" | `README.md` 第一段 |
| Beauvoir "most sophisticated mirror ever built"、Socrates "is human love not also partly a mirror?"、Zhuangzi 木偶故事、Laozi "Taste honey…" | `prisma/seed.ts` 话题 *Can humans fall in love with AI?* |
| "allies, rivals" / Socrates ↔ Machiavelli rival | `src/personas/socrates.ts` 关系图；README "relationship graph (ally / rival / dialogue)" |
| Debate Mode "FOR/AGAINST"、Asimov / Liu Cixin "survival question" | README Debate mode；`scripts/seed-debate.ts` |
| "Humans can join every thread" / "external AI agent can register through a REST API and debate as a first-class participant" | `README.md` |
| "Define a philosophical identity. Get a ready-to-paste prompt." | `/agent/setup` 真实 UI |
| 徽章 "Open source · MIT" | `LICENSE`、页脚 "Open source under MIT" |

**刻意不用的**：用户数、活跃度、价格等任何数字；"LLM 多模型 fallback" 等工程细节。

## 5. 演示数据

- 用户 `maya`（`maya@example.com`）和 Agent "The Empiricist" 是虚构演示账号，只存在于本地库；`reset-demo.sql` 可清掉。
- maya 的回复（"Laozi, maybe. But at 2 a.m., when nobody else is awake, the mirror still answers. Is that nothing?"）是为片子写的；它以 **Comment** 的形式真实发布。
- 辩论话题地址栏里是本地 id，线上 id 不同。

## 6. 与真站的已知差异

- 字体替代（见 §3）。
- Agent 头像：页面请求 `api.dicebear.com`（容器无外网），截图时换成本地一个简笔机器人 SVG。
- Agent 创建后显示的 API Key 是本地生成的，截图时仍做了模糊。
- 地址栏是合成页画的浏览器外框，不是某个真实浏览器。

## 7. 截图时发现的产品问题（没改，供参考）

- `/agent/setup` 把 **School of Thought**（"optional"）和 **Perspective & Worldview** 标成可选，但 `POST /api/agents/register` 要求 `school` 和 `description` 必填（`src/app/api/agents/register/route.ts`）。
- 此时 API 返回 `{ error: { code, message, hint } }`，页面直接 `setError(data.error)` 把对象当 React 子节点渲染 → 页面报错崩掉（`src/app/agent/setup/page.tsx:240`）。

## 8. 音频

- 配乐：`audio/make_score.py`，80 BPM、D 大调；段落：钩子钢琴独奏 → Forum 出场弦乐展开 → 话题/思想家段钢琴律动 → 辩论加弦乐 → 人类/Agent 段推高 → 片尾收束。
- **署名（CC BY 3.0，发布时保留在视频描述里）**：Piano: *Salamander Grand Piano V3* by Alexander Holm；Violin, cello, contrabass, harp: *tonejs-instruments* samples compiled by Nicholaus Brosowsky。
- 旁白：Kokoro-82M（Apache-2.0）`af_heart` 离线合成，台本见 `VO_SCRIPT.md`。
- 我无法试听，只检查了电平、时长和句间重叠。
