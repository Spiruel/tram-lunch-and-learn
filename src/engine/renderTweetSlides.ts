import { clamp, olmoEase, ViewportTransform } from './math';

// ============================================================================
// Real tweet data (fetched from the public X embed API, not paraphrased).
// Frost:    https://x.com/DavidGHFrost/status/2081407458539401448
// Exchange: https://x.com/leeds_exchange/status/2080939856646070374
// ============================================================================
const FROST_TWEET = {
  name: 'David Frost',
  handle: '@DavidGHFrost',
  badge: 'government' as const,
  text:
    'The city has not shrunk. Many more people have cars in 2026 than in 1957.  They can use them to get to all sorts of other places around Leeds and beyond to work today which they couldn\u2019t reach in 1957.\n\n' +
    'The economic geography of the Leeds-Bradford area today is completely different to what it was in 1957, so it is a rather meaningless comparison to make.',
  date: 'Jul 26, 2026',
  views: '18.2K',
  metrics: [
    ['2', 'Reposts'],
    ['1', 'Quote'],
    ['34', 'Likes'],
    ['2', 'Bookmarks'],
  ] as [string, string][],
};

const EXCHANGE_TWEET = {
  name: 'The Exchange',
  handle: '@leeds_exchange',
  badge: 'blue' as const,
  text:
    'If you stood on Briggate at 8am on a weekday in 1957, and stood there again in 2026, in which year could you reach more of the city in half an hour?\n\n' +
    'Samuel Bancroft has crunched the numbers. Since the 1950s, Leeds has got bigger - but the city has effectively shrunk.',
  date: 'Jul 25, 2026',
  views: '247.1K',
  metrics: [
    ['72', 'Reposts'],
    ['467', 'Likes'],
    ['15', 'Replies'],
  ] as [string, string][],
};

// Lazily loaded images (the canvas loop redraws every frame, so they pop in once ready)
const imgCache: Record<string, HTMLImageElement> = {};
function img(src: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!imgCache[src]) {
    const i = new Image();
    i.src = src;
    imgCache[src] = i;
  }
  const i = imgCache[src];
  return i.complete && i.naturalWidth > 0 ? i : null;
}

const FONT = '"Plus Jakarta Sans", -apple-system, "Segoe UI", sans-serif';
const INK = '#0f1419';
const GREY = '#536471';
const BORDER = '#cfd9de';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function drawAvatar(ctx: CanvasRenderingContext2D, src: string, x: number, y: number, d: number, fallback: string) {
  const im = img(src);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + d / 2, y + d / 2, d / 2, 0, Math.PI * 2);
  ctx.clip();
  if (im) {
    ctx.drawImage(im, x, y, d, d);
  } else {
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x, y, d, d);
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${d * 0.42}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallback, x + d / 2, y + d / 2);
  }
  ctx.restore();
}

function drawBadge(ctx: CanvasRenderingContext2D, x: number, cy: number, s: number, kind: 'blue' | 'government') {
  ctx.save();
  ctx.fillStyle = kind === 'government' ? '#829aab' : '#1d9bf0';
  if (kind === 'government') {
    ctx.beginPath();
    ctx.roundRect(x, cy - s / 2, s, s, s * 0.22);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x + s / 2, cy, s / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.27, cy + s * 0.02);
  ctx.lineTo(x + s * 0.44, cy + s * 0.18);
  ctx.lineTo(x + s * 0.74, cy - s * 0.16);
  ctx.stroke();
  ctx.restore();
}

interface TweetOpts {
  name: string;
  handle: string;
  badge: 'blue' | 'government';
  avatar: string;
  text: string;
  date: string;
  views: string;
  metrics: [string, string][];
  quote?: boolean; // embed the Exchange tweet as a quote
}

/**
 * Draws a light-theme tweet card in the style of 10015.io's tweet-to-image output.
 * Drawn in a logical 600px-wide space; caller scales. Returns the logical height.
 */
const TW_W = 600;
function drawTweetCard(ctx: CanvasRenderingContext2D, o: TweetOpts, measureOnly = false): number {
  const pad = 30;
  const innerW = TW_W - pad * 2;
  let y = pad;

  // Header
  if (!measureOnly) {
    drawAvatar(ctx, o.avatar, pad, y, 52, o.name[0]);
    ctx.fillStyle = INK;
    ctx.font = `700 18px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(o.name, pad + 64, y + 22);
    const nw = ctx.measureText(o.name).width;
    drawBadge(ctx, pad + 64 + nw + 6, y + 16, 17, o.badge);
    ctx.fillStyle = GREY;
    ctx.font = `400 16px ${FONT}`;
    ctx.fillText(o.handle, pad + 64, y + 45);
  }
  y += 52 + 18;

  // Body
  ctx.font = `400 21px ${FONT}`;
  const lines = wrapLines(ctx, o.text, innerW);
  const lh = 30;
  if (!measureOnly) {
    ctx.fillStyle = INK;
    ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, i) => ctx.fillText(ln, pad, y + 22 + i * lh));
  }
  y += lines.length * lh + 10;

  // Quote tweet (Exchange)
  if (o.quote) {
    const qPad = 14;
    const qx = pad;
    const qy = y + 6;
    const thumb = 96;
    ctx.font = `400 15px ${FONT}`;
    const qLines = wrapLines(ctx, EXCHANGE_TWEET.text, innerW - qPad * 2 - thumb - 12);
    const shown = qLines.slice(0, 6);
    if (shown.length < qLines.length) shown[shown.length - 1] += '\u2026';
    const qH = Math.max(qPad + 26 + shown.length * 21 + qPad, thumb + qPad * 2);
    if (!measureOnly) {
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(qx, qy, innerW, qH, 14);
      ctx.stroke();
      drawAvatar(ctx, '/tweet/exchange_avatar.jpg', qx + qPad, qy + qPad, 20, 'E');
      ctx.fillStyle = INK;
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(EXCHANGE_TWEET.name, qx + qPad + 26, qy + qPad + 15);
      const qnw = ctx.measureText(EXCHANGE_TWEET.name).width;
      drawBadge(ctx, qx + qPad + 26 + qnw + 4, qy + qPad + 10, 14, 'blue');
      ctx.fillStyle = GREY;
      ctx.font = `400 15px ${FONT}`;
      ctx.fillText(`${EXCHANGE_TWEET.handle} \u00b7 Jul 25`, qx + qPad + 26 + qnw + 24, qy + qPad + 15);
      ctx.fillStyle = INK;
      shown.forEach((ln, i) => ctx.fillText(ln, qx + qPad, qy + qPad + 44 + i * 21));
      const ph = img('/tweet/exchange_photo.jpg');
      const tx = qx + innerW - qPad - thumb;
      const ty = qy + qPad;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(tx, ty, thumb, thumb, 10);
      ctx.clip();
      if (ph) {
        const s = Math.min(ph.naturalWidth, ph.naturalHeight);
        ctx.drawImage(ph, (ph.naturalWidth - s) / 2, 0, s, s, tx, ty, thumb, thumb);
      } else {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(tx, ty, thumb, thumb);
      }
      ctx.restore();
    }
    y = qy + qH + 8;
  }

  // Timestamp + views
  if (!measureOnly) {
    ctx.fillStyle = GREY;
    ctx.font = `400 15px ${FONT}`;
    const dateTxt = `${o.date} \u00b7 `;
    ctx.fillText(dateTxt, pad, y + 24);
    const dw = ctx.measureText(dateTxt).width;
    ctx.fillStyle = INK;
    ctx.font = `700 15px ${FONT}`;
    ctx.fillText(o.views, pad + dw, y + 24);
    const vw = ctx.measureText(o.views).width;
    ctx.fillStyle = GREY;
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText(' Views', pad + dw + vw, y + 24);
  }
  y += 40;

  // Divider + metrics
  if (!measureOnly) {
    ctx.strokeStyle = '#eff3f4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(TW_W - pad, y);
    ctx.stroke();
    let mx = pad;
    for (const [n, label] of o.metrics) {
      ctx.fillStyle = INK;
      ctx.font = `700 15px ${FONT}`;
      ctx.fillText(n, mx, y + 30);
      mx += ctx.measureText(n).width + 4;
      ctx.fillStyle = GREY;
      ctx.font = `400 15px ${FONT}`;
      ctx.fillText(label, mx, y + 30);
      mx += ctx.measureText(label).width + 22;
    }
  }
  y += 46;

  return y + pad - 14;
}

/** Draws the tweet card with shadow at (x, y) scaled to width w. Returns drawn height. */
function placeTweet(ctx: CanvasRenderingContext2D, o: TweetOpts, x: number, y: number, w: number, alpha = 1): number {
  const s = w / TW_W;
  ctx.save();
  const h = drawTweetCard(ctx, o, true);
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(0, 0, TW_W, h, 20);
  ctx.fill();
  ctx.restore();
  drawTweetCard(ctx, o, false);
  ctx.restore();
  return h * s;
}

function tweetLogicalHeight(ctx: CanvasRenderingContext2D, o: TweetOpts): number {
  ctx.save();
  const h = drawTweetCard(ctx, o, true);
  ctx.restore();
  return h;
}

// ============================================================================
// SubStep transition tracker (so the tweet glides left when advancing)
// ============================================================================
const tracker = { step: -1, changedAt: 0, from: 0, value: 0 };
function trackMove(subStep: number): { move: number; sinceChange: number } {
  const now = performance.now() / 1000;
  const target = subStep >= 1 ? 1 : 0;
  if (tracker.step === -1) {
    tracker.step = subStep;
    tracker.value = target;
    tracker.from = target;
    tracker.changedAt = now - 10;
  } else if (subStep !== tracker.step) {
    tracker.from = tracker.value;
    tracker.step = subStep;
    tracker.changedAt = now;
  }
  const t = olmoEase(clamp((now - tracker.changedAt) / 0.85, 0, 1));
  tracker.value = tracker.from + (target - tracker.from) * t;
  return { move: tracker.value, sinceChange: now - tracker.changedAt };
}

// ============================================================================
// "BUT WHAT ABOUT CARS?" — Lord Frost's real reply, then the counter-evidence
// Step 0: tweet alone, centred.  Step 1: tweet slides left, rebuttals fade in.
// ============================================================================
const REBUTTALS = [
  {
    stat: '47.6%',
    head: 'of households in Gipton & Harehills have no car',
    body: '29% across Leeds. The same in Middleton, Belle Isle and the inner south. \u201cJust drive\u201d writes off the people with least.',
    src: 'Census 2021 \u00b7 households without a car or van',
  },
  {
    stat: '\u221268%',
    head: 'Leeds car reach at the 8am peak',
    body: 'Roads into a centre can\u2019t scale. When everyone drives at once, the 30-minute city collapses for drivers too.',
    src: 'This study \u00b7 free-flow vs AM-peak car routing',
  },
  {
    stat: 'Europe',
    head: 'owns cars too \u2014 and its big cities still get richer',
    body: 'Different economic geography, same agglomeration effect. The difference is fast public transport into dense centres.',
    src: 'Centre for Cities / FT \u00b7 slide 1',
  },
];

export function renderFrostTweetSlide(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number,
  subStep: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const { move, sinceChange } = trackMove(subStep);
  void slideElapsed;
  const enter = 1;

  const opts: TweetOpts = {
    ...FROST_TWEET,
    avatar: '/tweet/frost_avatar.jpg',
    quote: true,
  };
  const logicalH = tweetLogicalHeight(ctx, opts);

  // Centred (step 0) vs docked-left (step 1) geometry
  const wCentre = Math.min(stageW * 0.52, (stageH * 0.96 * TW_W) / logicalH, 720);
  const wLeft = Math.min(stageW * 0.42, (stageH * 0.96 * TW_W) / logicalH, 620);
  const w = wCentre + (wLeft - wCentre) * move;
  const h = (logicalH * w) / TW_W;
  const xCentre = stageX + (stageW - wCentre) / 2;
  const x = xCentre + (stageX - xCentre) * move;
  const y = stageY + (stageH - h) / 2 + (1 - enter) * 24;

  placeTweet(ctx, opts, x, y, w, enter);

  // Rebuttal column
  if (subStep < 1 && move < 0.02) return;
  const colX = stageX + wLeft + Math.max(36, stageW * 0.035);
  const colW = stageX + stageW - colX;
  const gap = 16;
  const cardH = Math.min((stageH - gap * 2) / 3, 168);
  const totalH = cardH * 3 + gap * 2;
  const colY = stageY + (stageH - totalH) / 2;
  const compact = cardH < 140 || colW < 900;

  REBUTTALS.forEach((r, i) => {
    const a =
      subStep >= 1 ? olmoEase(clamp((sinceChange - 0.55 - i * 0.35) / 0.5, 0, 1)) : Math.max(0, move * 2 - 1);
    if (a <= 0.001) return;
    const cy = colY + i * (cardH + gap) + (1 - a) * 18;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.roundRect(colX, cy, colW, cardH, 18);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    const pad = compact ? 20 : 26;
    const statW = compact ? 130 : 170;
    ctx.fillStyle = '#7c3aed';
    ctx.font = `700 ${compact ? 34 : 44}px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    // Shrink long word stats to fit their column
    let statSize = compact ? 34 : 44;
    while (ctx.measureText(r.stat).width > statW - 12 && statSize > 20) {
      statSize -= 2;
      ctx.font = `700 ${statSize}px ${FONT}`;
    }
    ctx.fillText(r.stat, colX + pad, cy + pad + statSize * 0.85);

    const tx = colX + pad + statW;
    const tw = colW - pad * 2 - statW;
    ctx.fillStyle = INK;
    ctx.font = `700 ${compact ? 17 : 22}px ${FONT}`;
    const headLines = wrapLines(ctx, r.head, tw);
    let ty = cy + pad + (compact ? 16 : 20);
    headLines.forEach((ln) => {
      ctx.fillText(ln, tx, ty);
      ty += compact ? 22 : 28;
    });
    ctx.fillStyle = '#334155';
    ctx.font = `400 ${compact ? 14 : 17}px ${FONT}`;
    ty += 4;
    wrapLines(ctx, r.body, tw).forEach((ln) => {
      ctx.fillText(ln, tx, ty);
      ty += compact ? 19 : 24;
    });
    ctx.fillStyle = '#94a3b8';
    ctx.font = `500 ${compact ? 11 : 12}px "JetBrains Mono", monospace`;
    ctx.fillText(r.src, colX + pad, Math.max(cy + cardH - pad + 4, ty + 2));
    ctx.restore();
  });
}

// ============================================================================
// PUBLISHED · The Exchange's write-up (real tweet + the published graphic)
// ============================================================================
export function renderExchangeTweetSlide(ctx: CanvasRenderingContext2D, vt: ViewportTransform, slideElapsed: number) {
  const { stageX, stageY, stageW, stageH } = vt;
  void slideElapsed;
  const enter = 1;
  const photoEnter = 1;

  const opts: TweetOpts = { ...EXCHANGE_TWEET, avatar: '/tweet/exchange_avatar.jpg' };
  const logicalH = tweetLogicalHeight(ctx, opts);

  const gap = Math.max(32, stageW * 0.03);
  const photoH = stageH * 0.98;
  const photoW = photoH * (1600 / 1656);
  const tweetW = Math.min(stageW - photoW - gap, 640, (stageH * 0.9 * TW_W) / logicalH);
  const groupW = tweetW + gap + photoW;
  const gx = stageX + (stageW - groupW) / 2;
  const th = (logicalH * tweetW) / TW_W;

  placeTweet(ctx, opts, gx, stageY + (stageH - th) / 2 + (1 - enter) * 24, tweetW, enter);

  const px = gx + tweetW + gap;
  const py = stageY + (stageH - photoH) / 2 + (1 - photoEnter) * 24;
  ctx.save();
  ctx.globalAlpha *= photoEnter;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(px, py, photoW, photoH, 16);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.roundRect(px, py, photoW, photoH, 16);
  ctx.clip();
  const ph = img('/tweet/exchange_photo.jpg');
  if (ph) ctx.drawImage(ph, px, py, photoW, photoH);
  ctx.restore();
}

// ============================================================================
// OUTLINE
// ============================================================================
const OUTLINE = [
  ['The puzzle', 'Why don\u2019t British cities get richer as they get bigger?'],
  ['Effective size', 'Count the people you can reach in 30 minutes, not the people who live there'],
  ['Rebuilding 1957 Leeds', 'Turning archive tram timetables into a routable network'],
  ['What we found', 'Leeds then vs now, and who lost out'],
  ['The reaction', 'Publication, and \u201cbut what about cars?\u201d'],
  ['Other cities', 'The transit time machine: Liverpool, Manchester, Sheffield, Birmingham'],
];

export function renderTalkOutline(ctx: CanvasRenderingContext2D, vt: ViewportTransform, slideElapsed: number) {
  void slideElapsed;
  const { stageX, stageY, stageW, stageH } = vt;
  const panelW = Math.min(stageW, 1180);
  const panelX = stageX + (stageW - panelW) / 2;
  const padTop = 32;
  const headerH = 72;
  const bodyH = stageH - padTop - headerH - 24;
  const rowH = bodyH / OUTLINE.length;
  const big = Math.min(rowH * 0.40, 36);
  const small = Math.min(rowH * 0.22, 17);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(panelX, stageY, panelW, stageH, 22);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(panelX, stageY, panelW, stageH, 22);
  ctx.stroke();

  // Top Roadmap Header
  const x0 = panelX + 44;
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#7c3aed';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('TALK ROADMAP · 6 CHAPTERS', x0, stageY + 28);

  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = INK;
  ctx.fillText('From the British Productivity Puzzle to Recovered Transit Networks', x0, stageY + 48);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, stageY + padTop + headerH);
  ctx.lineTo(panelX + panelW - 44, stageY + padTop + headerH);
  ctx.stroke();

  const startY = stageY + padTop + headerH;

  OUTLINE.forEach(([head, sub], i) => {
    const y = startY + i * rowH;

    if (i < OUTLINE.length - 1) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y + rowH);
      ctx.lineTo(panelX + panelW - 44, y + rowH);
      ctx.stroke();
    }

    ctx.fillStyle = '#7c3aed';
    ctx.font = `600 ${big}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1).padStart(2, '0'), x0, y + rowH / 2);

    const tx = x0 + big * 2.3;
    ctx.fillStyle = INK;
    ctx.font = `600 ${big * 0.72}px ${FONT}`;
    ctx.fillText(head, tx, y + rowH / 2 - small * 0.65);
    ctx.fillStyle = GREY;
    ctx.font = `400 ${small}px ${FONT}`;
    ctx.fillText(sub, tx, y + rowH / 2 + big * 0.45);
  });
  ctx.restore();
}
