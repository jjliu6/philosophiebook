// Deterministic timeline engine for the promo. window.render(t) draws time t (s).
// The film itself (shots, camera, story cards, titles) is data in scenes.js.
// Editing rule: a new scene hard-cuts on the downbeat (shot + camera), state
// changes inside a scene crossfade. Story cards blur the screen behind them.
(() => {
  const { W0, WIN, BAR, SCENES, SPOT, ACC, C, HOME, REVEAL } = window.PROMO;
  const SHOT = (n) => `../capture/out/${n}.png`;

  const SHOTS = [], CAM = [], CARDS = [], TITLES = [], URLS = [];
  let END_AT = 0;
  SCENES.forEach((s, si) => {
    const t0 = s.at * BAR;
    (s.shots || []).forEach(([t, n, mode], i) => SHOTS.push([t0 + t, n, si > 0 && (i === 0 || mode === 'cut')]));
    (s.cam || []).forEach(([t, z, b, mode], i) => CAM.push([t0 + t, z, ...(b ? C(b) : HOME), (si > 0 && i === 0) || mode === 'cut']));
    // card: [in, out, who, line1, line2, line2In, {black:true}]
    (s.cards || []).forEach(([a, b, who, l1, l2, l2In, opt]) => CARDS.push({ a: t0 + a, b: t0 + b, who, l1, l2, l2In: t0 + (l2In ?? a), black: !!(opt && opt.black) }));
    (s.titles || []).forEach(([a, b, acc, name, sub]) => TITLES.push([t0 + a, t0 + b, ACC[acc] || acc, name, sub]));
    if (s.url != null) URLS.push([t0, s.url]);
    if (s.end) END_AT = t0;
  });
  CAM.sort((a, b) => a[0] - b[0]);
  const last = SCENES[SCENES.length - 1];
  const DURATION = (last.at + last.bars) * BAR;
  const XF = 0.32;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lin = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const mix = (a, b, k) => a + (b - a) * k;
  const $ = (s) => document.querySelector(s);

  // Build DOM
  const content = $('#content');
  const imgs = {};
  SHOTS.forEach(([, n]) => {
    if (imgs[n]) return;
    const im = new Image();
    im.src = SHOT(n);
    im.decoding = 'sync';
    content.insertBefore(im, $('#spot'));
    imgs[n] = im;
  });
  const titles = TITLES.map(([, , accent, name, sub]) => {
    const d = document.createElement('div');
    d.className = 'ptitle';
    d.innerHTML = `<div class="bar"><i style="background:${accent}"></i><span class="name">${name}</span>${sub ? `<span class="sub">${sub}</span>` : ''}</div>`;
    $('#titles').appendChild(d);
    return d;
  });

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
    // Shots
    const op = {};
    Object.keys(imgs).forEach((n) => (op[n] = 0));
    SHOTS.forEach(([ts, n, cut], i) => {
      if (t < ts) return;
      const k = i === 0 || cut ? 1 : ease(lin(t, ts, ts + XF));
      Object.keys(op).forEach((m) => (op[m] *= 1 - k));
      op[n] = Math.max(op[n], k);
    });
    Object.entries(imgs).forEach(([n, im]) => { im.style.opacity = op[n].toFixed(4); });

    // Address bar follows the page on screen
    const u = URLS.filter(([a]) => t >= a).pop();
    const pth = $('#path');
    if (u && pth.textContent !== u[1]) pth.textContent = u[1];

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

    // Spotlight on a real UI element
    const sp = $('#spot');
    if (SPOT) {
      const sk = Math.min(ease(lin(t, SPOT.in, SPOT.in + 0.65)), 1 - ease(lin(t, SPOT.out - 0.4, SPOT.out)));
      sp.style.opacity = sk.toFixed(4);
      Object.assign(sp.style, { left: SPOT.box.x + 'px', top: SPOT.box.y + 'px', width: SPOT.box.width + 'px', height: SPOT.box.height + 'px' });
    } else sp.style.opacity = 0;

    // End card
    const E = END_AT;
    const endIn = ease(lin(t, E - 0.05, E + 0.75));
    const blur = Math.max(endIn * 14, blurK * 18);
    const dark = Math.max(endIn * 0.6, blurK * 0.62);
    $('#screen').style.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px) brightness(${(1 - dark).toFixed(3)})` : 'none';
    const end = $('#end');
    end.style.opacity = endIn.toFixed(4);
    const icon = end.querySelector('img');
    const ik = easeOut(lin(t, E + 0.1, E + 1.2));
    icon.style.transform = `scale(${mix(0.86, 1, ik)})`;
    icon.style.opacity = ik;
    const stag = (el, t0) => {
      if (!el) return;
      const k = easeOut(lin(t, t0, t0 + 0.6));
      el.style.opacity = k;
      el.style.transform = `translateY(${mix(12, 0, k)}px)`;
    };
    stag(end.querySelector('.word'), E + 0.45);
    stag(end.querySelector('.tag'), E + 0.95);
    const ET = window.PROMO.END_TIMES || { tag2: 4.2, row: 5.0, sub: 5.4 };
    stag(end.querySelector('.tag2'), E + ET.tag2);
    stag(end.querySelector('.row'), E + ET.row);
    stag(end.querySelector('.sub'), E + ET.sub);

    // Fade from / to black
    $('#black').style.opacity = Math.max(1 - lin(t, 0, 0.45), lin(t, DURATION - 0.7, DURATION)).toFixed(4);
  };

  window.ready = () => Promise.all(Object.values(imgs).map((im) => im.decode().catch(() => null)).concat(
    [document.fonts.ready, document.querySelector('#end img').decode().catch(() => null)]));
  // (engine shared with the Estha for Mac promo; browser chrome instead of a Mac app window)
  window.DURATION = DURATION;
})();
