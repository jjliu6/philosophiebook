// Deterministic timeline engine for the promo. window.render(t) draws time t (s).
// The film itself (shots, scrolling, camera, highlighter marks, story cards,
// titles) is data in scenes.js. Same rules as the Estha promo engine: a new
// scene hard-cuts on the bar line (shot + camera), state changes inside a scene
// crossfade, story cards blur the screen behind them. New here: tall page
// captures scroll (eased keys) under a pinned header strip, and gold
// highlighter marks sweep over the sentence the narrator is quoting.
(() => {
  const P = window.PROMO;
  const { W0, WIN, SCENES, HOME, REVEAL, BAR, HDR, BOXES } = P;
  const SRC = (n) => `../capture/out/${n}.jpg`;   // page captures; header strips are .png

  const SHOTS = [], CAM = [], CARDS = [], TITLES = [], MARKS = [], SCROLL = {};
  let END_AT = 0;
  SCENES.forEach((s, si) => {
    const t0 = s.at * BAR;
    (s.shots || []).forEach(([t, n, mode], i) => SHOTS.push([t0 + t, n, si > 0 && (i === 0 || mode === 'cut')]));
    (s.cam || []).forEach(([t, z, b, mode], i) => CAM.push([t0 + t, z, ...(b ? P.C(b) : HOME), (si > 0 && i === 0) || mode === 'cut']));
    // A page's first scroll key in each scene is a cut: hold the old position, then jump.
    const seen = new Set();
    (s.scroll || []).forEach(([t, n, y]) => {
      (SCROLL[n] = SCROLL[n] || []).push([t0 + t, y, !seen.has(n)]);
      seen.add(n);
    });
    (s.marks || []).forEach(([a, b, n, key]) => MARKS.push({ a: t0 + a, b: t0 + b, n, key }));
    // card: [in, out, who, line1, line2, line2In, {black}]
    (s.cards || []).forEach(([a, b, who, l1, l2, l2In, opt]) => CARDS.push({ a: t0 + a, b: t0 + b, who, l1, l2, l2In: t0 + (l2In ?? a), black: !!(opt && opt.black) }));
    (s.titles || []).forEach(([a, b, acc, name, sub]) => TITLES.push([t0 + a, t0 + b, P.ACC[acc] || acc, name, sub]));
    if (s.end) END_AT = t0;
  });
  CAM.sort((a, b) => a[0] - b[0]);
  Object.values(SCROLL).forEach((k) => k.sort((a, b) => a[0] - b[0]));
  const last = SCENES[SCENES.length - 1];
  const DURATION = (last.at + last.bars) * BAR;
  const XF = 0.32;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lin = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const mix = (a, b, k) => a + (b - a) * k;
  const $ = (s) => document.querySelector(s);

  // ── Build DOM: one container per captured page (image + pinned header + marks) ──
  const content = $('#content');
  const shots = {};
  SHOTS.forEach(([, n]) => {
    if (shots[n]) return;
    const box = document.createElement('div');
    box.className = 'shot';
    const im = new Image();
    im.className = 'page';
    im.src = SRC(n);
    im.decoding = 'sync';
    box.appendChild(im);
    const marks = document.createElement('div');
    marks.className = 'marks';
    box.appendChild(marks);
    let hdr = null;
    if (HDR[n]) {
      hdr = new Image();
      hdr.className = 'hdr';
      hdr.src = `../capture/out/${HDR[n]}.png`;
      hdr.decoding = 'sync';
      box.appendChild(hdr);
    }
    content.appendChild(box);
    shots[n] = { box, im, hdr, marks };
  });
  // Highlighter lines live inside the page container, so they scroll and zoom with it.
  MARKS.forEach((m) => {
    const rects = ((BOXES[m.n] || {}).marks || {})[m.key] || [];
    if (!rects.length) console.warn('no mark rects for', m.n, m.key);
    m.els = rects.map((r) => {
      const d = document.createElement('div');
      d.className = 'mark';
      Object.assign(d.style, { left: r.x - 3 + 'px', top: r.y - 1 + 'px', width: r.width + 6 + 'px', height: r.height + 3 + 'px' });
      shots[m.n].marks.appendChild(d);
      return d;
    });
  });
  const titles = TITLES.map(([, , accent, name, sub]) => {
    const d = document.createElement('div');
    d.className = 'ptitle';
    d.innerHTML = `<div class="bar"><i style="background:${accent}"></i><span class="name">${name}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
    $('#titles').appendChild(d);
    return d;
  });

  // Scroll keys: [t, y, cut]. Eased between keys; a 'cut' key is jumped to, not eased into.
  function scrollOf(n, t) {
    const keys = SCROLL[n];
    if (!keys) return 0;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, y0] = keys[i], [t1, y1, cut] = keys[i + 1];
      if (t >= t0 && t < t1 && cut) return y0;
      if (t >= t0 && t <= t1) return mix(y0, y1, ease(lin(t, t0, t1)));
    }
    return keys[keys.length - 1][1];
  }

  function camera(t) {
    if (t <= CAM[0][0]) return CAM[0].slice(1, 4);
    for (let i = 0; i < CAM.length - 1; i++) {
      const [t0, z0, x0, y0] = CAM[i], [t1, z1, x1, y1, cut] = CAM[i + 1];
      if (t >= t0 && t < t1 && cut) return [z0, x0, y0];   // hold, then jump on the cut
      if (t >= t0 && t <= t1) {
        const k = ease(lin(t, t0, t1));
        return [mix(z0, z1, k), mix(x0, x1, k), mix(y0, y1, k)];
      }
    }
    return CAM[CAM.length - 1].slice(1, 4);
  }

  const card = $('#card');
  let cardKey = '';

  window.render = (t) => {
    // Shots (crossfade inside a scene, hard cut on scene change / 'cut')
    const op = {};
    Object.keys(shots).forEach((n) => (op[n] = 0));
    SHOTS.forEach(([ts, n, cut], i) => {
      if (t < ts) return;
      const k = i === 0 || cut ? 1 : ease(lin(t, ts, ts + XF));
      Object.keys(op).forEach((m) => (op[m] *= 1 - k));
      op[n] = Math.max(op[n], k);
    });
    Object.entries(shots).forEach(([n, s]) => {
      s.box.style.opacity = op[n].toFixed(4);
      if (op[n] <= 0) return;
      const y = Math.round(scrollOf(n, t) * 2) / 2;
      s.box.style.transform = `translateY(${-y}px)`;
      if (s.hdr) s.hdr.style.top = y + 'px';
    });

    // Highlighter: each line sweeps in left→right, lines staggered; fades on the way out.
    MARKS.forEach((m) => {
      const out = 1 - ease(lin(t, m.b - 0.4, m.b));
      m.els.forEach((el, i) => {
        const a = m.a + i * 0.32;
        const k = easeOut(lin(t, a, a + 0.5));
        el.style.transform = `scaleX(${k.toFixed(4)})`;
        el.style.opacity = (t < m.a || t > m.b ? 0 : out).toFixed(4);
      });
    });

    // Screen appears at REVEAL; window rises in.
    const e = easeOut(lin(t, REVEAL + 0.1, REVEAL + 1.4));
    const ws = W0 * mix(0.965, 1, e);
    const win = $('#win');
    win.style.opacity = e.toFixed(4);
    win.style.transform = `translate(${960 - 720 * ws}px, ${WIN.y + mix(26, 0, e) + (944 * (W0 - ws)) / 2}px) scale(${ws})`;
    $('#screen').style.opacity = ease(lin(t, REVEAL - 0.2, REVEAL + 0.5)).toFixed(4);

    // Camera — clamped so the zoomed screen always covers the frame.
    const [z, fx, fy] = camera(t);
    const tx = clamp(960 - fx * z, 1920 - 1920 * z, 0), ty = clamp(540 - fy * z, 1080 - 1080 * z, 0);
    $('#screen').style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;

    // Story card (one at a time)
    let ck = 0, blurK = 0;
    const active = CARDS.find((c) => t >= c.a - 0.05 && t <= c.b + 0.05);
    if (active) {
      const key = active.a + active.l1;
      if (key !== cardKey) {
        card.querySelector('.who').textContent = active.who || '';
        card.querySelector('.l1').textContent = active.l1 || '';
        card.querySelector('.l2').textContent = active.l2 || '';
        cardKey = key;
      }
      ck = Math.min(easeOut(lin(t, active.a, active.a + 0.5)), 1 - ease(lin(t, active.b - 0.45, active.b)));
      blurK = active.black ? 0 : ck;
      const l2 = card.querySelector('.l2');
      const k2 = easeOut(lin(t, active.l2In, active.l2In + 0.5));
      l2.style.opacity = k2;
      l2.style.transform = `translateY(${mix(14, 0, k2)}px)`;
      card.querySelector('.l1').style.transform = `translateY(${mix(14, 0, easeOut(lin(t, active.a, active.a + 0.6)))}px)`;
    }
    card.style.opacity = ck.toFixed(4);

    // Product titles
    TITLES.forEach(([a, b], i) => {
      const k = Math.min(easeOut(lin(t, a, a + 0.45)), 1 - ease(lin(t, b - 0.35, b)));
      titles[i].style.opacity = k.toFixed(4);
      titles[i].style.transform = `translateX(${mix(-18, 0, easeOut(lin(t, a, a + 0.55)))}px)`;
    });

    // End card
    const E = END_AT;
    const endIn = ease(lin(t, E - 0.05, E + 0.75));
    const blur = Math.max(endIn * 14, blurK * 18);
    const dark = Math.max(endIn * 0.6, blurK * 0.64);
    $('#screen').style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px) brightness(${(1 - dark).toFixed(3)})` : 'none';
    const end = $('#end');
    end.style.opacity = endIn.toFixed(4);
    const plate = end.querySelector('.plate');
    const ik = easeOut(lin(t, E + 0.1, E + 1.2));
    plate.style.transform = `scale(${mix(0.88, 1, ik)})`;
    plate.style.opacity = ik;
    const stag = (el, t0) => {
      const k = easeOut(lin(t, t0, t0 + 0.6));
      el.style.opacity = k;
      el.style.transform = `translateY(${mix(12, 0, k)}px)`;
    };
    const ET = P.END_TIMES;
    stag(end.querySelector('.tag'), E + ET.tag);
    stag(end.querySelector('.tag2'), E + ET.tag2);
    stag(end.querySelector('.row'), E + ET.row);
    stag(end.querySelector('.sub'), E + ET.sub);

    // Fade from / to black
    $('#black').style.opacity = Math.max(1 - lin(t, 0, 0.45), lin(t, DURATION - 0.7, DURATION)).toFixed(4);
  };

  window.ready = () => Promise.all(Object.values(shots).flatMap((s) => [s.im, s.hdr].filter(Boolean)).map((im) => im.decode().catch(() => null)).concat(
    [document.fonts.ready, document.querySelector('#end img').decode().catch(() => null)]));
  window.DURATION = DURATION;
})();
