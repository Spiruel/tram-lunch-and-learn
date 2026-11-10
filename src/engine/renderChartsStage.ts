import { CityData, OverviewData } from '../types';
import { clamp, olmoEase, ViewportTransform } from './math';
import { renderExchangeTweetSlide, renderFrostTweetSlide, renderTalkOutline } from './renderTweetSlides';

export interface ChartRenderParams {
  ctx: CanvasRenderingContext2D;
  vt: ViewportTransform;
  scene: string;
  overview: OverviewData;
  citiesBySlug: Record<string, CityData>;
  slideElapsed: number;
  globalTime: number;
  alpha: number;
  subStep?: number;
  frostAvatarImg?: HTMLImageElement | null;
}

// ============================================================================
// FINANCIAL TIMES (FT) VISUAL JOURNALISM DESIGN SYSTEM
// Signature warm salmon/peach paper, crisp ink typography & editorial palette
// ============================================================================
export const FT_STYLE = {
  paper: '#fff2e8',       // Signature FT warm peach/salmon paper tint
  paperBorder: '#ebd9c8', // Warm sepia frame border
  cardBg: '#fffbf7',      // Soft elevated card tint
  cardBorder: '#ebd9c8',  // Subtle card border
  ink: '#0f172a',         // Primary text & headlines
  quote: '#7c2d12',       // Burnt sienna quote / hitting lines
  subtext: '#64748b',     // Secondary metadata
  axis: '#94a3b8',        // Axis lines
  grid: 'rgba(226, 232, 240, 0.85)', // Faint gridlines
  gridDashed: 'rgba(203, 213, 225, 0.65)',
  // FT Categorical Palette
  blue: '#0284c7',        // European peers / modern rail
  red: '#e11d48',         // UK underperformance / peak congestion
  teal: '#0d9488',        // Transit reach / modern
  amber: '#d97706',       // Off-peak / warning
  purple: '#7c3aed',      // Historical tram network
  green: '#059669',       // UK secondary cities
};

export function drawFtCardBackdrop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 20
) {
  ctx.save();
  ctx.fillStyle = FT_STYLE.paper;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  ctx.strokeStyle = FT_STYLE.paperBorder;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

export function drawFtSourceFootnote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  sourceText: string
) {
  ctx.save();
  ctx.font = '400 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sourceText, x, y);

  const tw = ctx.measureText(sourceText).width;
  ctx.font = '600 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(' · © FT', x + tw, y);
  ctx.restore();
}

function slideCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = '#fff2e8',
  radius = 20
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  ctx.strokeStyle = fill === '#fff2e8' ? '#ebd9c8' : '#e2e8f0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

function drawSlideSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius = 14,
  fill = '#ffffff',
  stroke?: string
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bg: string,
  fg: string,
  font = '600 14px "Plus Jakarta Sans", sans-serif',
  padX = 16,
  h = 34
): number {
  ctx.save();
  ctx.font = font;
  const tw = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y, tw, h, h * 0.5);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + tw * 0.5, y + h * 0.5 + 0.5);
  ctx.restore();
  return tw;
}

export function renderChartsStage(params: ChartRenderParams) {
  const { ctx, vt, scene, overview, citiesBySlug, slideElapsed, globalTime, alpha, subStep = 0, frostAvatarImg } = params;
  if (alpha <= 0.005) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (scene === 'londonmaxxing') {
    renderLondonmaxxingStage(ctx, vt, slideElapsed);
  } else if (scene === 'agglomeration-theory') {
    renderAgglomerationTheory(ctx, vt, slideElapsed);
  } else if (scene === 'remote-agglomeration') {
    renderRemoteAgglomerationStage(ctx, vt, slideElapsed);
  } else if (scene === 'centre-for-cities') {
    renderCentreForCities(ctx, vt, slideElapsed);
  } else if (scene === 'netherlands-backtest') {
    renderNetherlandsBacktest(ctx, vt, slideElapsed);
  } else if (scene === 'natural-experiment') {
    renderNaturalExperimentStage(ctx, vt, slideElapsed);
  } else if (scene === 'productivity-chart') {
    renderProductivityAndTomForth(ctx, vt, slideElapsed, subStep);
  } else if (scene === 'frost-car-objection') {
    renderFrostTweetSlide(ctx, vt, slideElapsed, subStep);
  } else if (scene === 'exchange-published') {
    renderExchangeTweetSlide(ctx, vt, slideElapsed);
  } else if (scene === 'talk-outline') {
    renderTalkOutline(ctx, vt, slideElapsed);
  } else if (scene === 'harehills-triptych') {
    renderHarehillsTriptych(ctx, vt, citiesBySlug['leeds'] || null, slideElapsed);
  } else if (scene === 'leeds-stress') {
    renderLeedsStressOverlay(ctx, vt, slideElapsed);
  } else if (scene === 'five-city-scoreboard') {
    renderFiveCityScoreboard(ctx, vt, overview, citiesBySlug, slideElapsed);
  } else if (scene === 'two-speed-curves') {
    renderTwoSpeedCurves(ctx, vt, citiesBySlug, slideElapsed, globalTime);
  } else if (scene === 'polycentric-north') {
    renderPolycentricNorthStage(ctx, vt, slideElapsed);
  }

  ctx.restore();
}

// ============================================================================
// SLIDE 02 · AGGLOMERATION ELASTICITY + R² SPEED GEOMETRY
// ============================================================================
function renderAgglomerationTheory(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.05, 0, 1));

  const gap = 26;
  const colW = (stageW - gap) * 0.5;
  const colH = stageH;

  // --- LEFT CARD: Productivity Scaling Curve ---
  const c1X = stageX;
  slideCard(ctx, c1X, stageY, colW, colH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Productivity scales with city reach', c1X + 32, stageY + 44);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Output per worker vs 30-min labour pool (Rice & Venables)', c1X + 32, stageY + 70);

  const gX = c1X + 74;
  const gY = stageY + 124;
  const gW = colW - 112;
  const gH = colH - 220;

  [100, 105, 110, 115, 120].forEach((lvl) => {
    const y = gY + gH - ((lvl - 95) / 30) * gH;
    ctx.strokeStyle = lvl === 100 ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = lvl === 100 ? 1.5 : 1;
    ctx.setLineDash(lvl === 100 ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(gX, y);
    ctx.lineTo(gX + gW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(lvl), gX - 14, y);
  });
  ctx.setLineDash([]);

  const xPops = [
    { pop: '250k', f: 0 },
    { pop: '500k', f: 0.25 },
    { pop: '1M', f: 0.5 },
    { pop: '2M', f: 0.75 },
    { pop: '4M', f: 1.0 },
  ];
  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  xPops.forEach((p) => {
    ctx.fillText(p.pop, gX + p.f * gW, gY + gH + 16);
  });

  // Bold FT blue/purple elasticity curve
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let step = 0; step <= Math.floor(50 * prog); step++) {
    const t = step / 50;
    const px = gX + t * gW;
    const py = gY + gH - ((100 + t * 18 - 95) / 30) * gH;
    if (step === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  if (prog > 0.65) {
    // UK 2nd cities marker (FT Red)
    const p1X = gX + 0.14 * gW;
    const p1Y = gY + gH - ((100 + 0.14 * 18 - 95) / 30) * gH;
    ctx.fillStyle = '#ffd5e1';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p1X, p1Y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawPill(ctx, p1X + 14, p1Y - 17, 'UK 2nd cities · 350k', '#fffbf7', '#be0047', '600 13px "Plus Jakarta Sans", sans-serif', 12, 30);

    // European peers marker (FT Blue)
    const p2X = gX + 0.75 * gW;
    const p2Y = gY + gH - ((100 + 0.75 * 18 - 95) / 30) * gH;
    ctx.fillStyle = '#cbdcf0';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p2X, p2Y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawPill(ctx, p2X - 190, p2Y - 42, 'European peers · 2M', '#fffbf7', '#0284c7', '600 13px "Plus Jakarta Sans", sans-serif', 12, 30);
  }

  drawFtSourceFootnote(ctx, c1X + 32, stageY + colH - 18, 'Source: Rice & Venables (2003) · OECD GB Study');
  ctx.restore();

  // --- RIGHT CARD: Speed-Squared Shed Geometry ---
  const c2X = stageX + colW + gap;
  slideCard(ctx, c2X, stageY, colW, colH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Transit area scales with speed²', c2X + 32, stageY + 44);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Area = π × (speed × 0.5 hr)² (The 4× geometry rule)', c2X + 32, stageY + 70);

  const cx = c2X + colW * 0.5;
  const cy = stageY + colH * 0.49;
  const rOuter = Math.min(colW * 0.34, (colH - 290) * 0.5, 168);
  const rInner = rOuter * (11 / 18);

  // Outer tram circle (FT Teal / Purple)
  ctx.fillStyle = 'rgba(13, 148, 136, 0.12)';
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter * prog, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner bus circle (FT Red)
  ctx.fillStyle = 'rgba(225, 29, 72, 0.15)';
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(cx, cy, rInner * prog, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Bottom clean comparison pills inside Card 2
  const pillY1 = stageY + colH - 96;
  const pillY2 = stageY + colH - 54;
  drawPill(ctx, c2X + 32, pillY1, '● Segregated tram (18 km/h)  →  254 km² shed', '#fffbf7', '#0f766e', '600 13.5px "Plus Jakarta Sans", sans-serif', 16, 34);
  drawPill(ctx, c2X + 32, pillY2, '● Bus in traffic (11 km/h)  →  95 km² shed', '#fffbf7', '#be0047', '600 13.5px "Plus Jakarta Sans", sans-serif', 16, 34);

  drawFtSourceFootnote(ctx, c2X + 32, stageY + colH - 18, 'Source: Geometric accessibility scaling A = π(vt)²');
  ctx.restore();
}

// ============================================================================
// SLIDE 03 · CENTRE FOR CITIES 67% VS 40% BENCHMARK
// ============================================================================
function renderCentreForCities(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.05, 0, 1));

  const gap = 28;
  const cardH = (stageH - gap) * 0.5;

  // --- TOP CARD: Western European Peer Cities (67%) ---
  slideCard(ctx, stageX, stageY, stageW, cardH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Western European peer cities', stageX + 40, stageY + 52);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Share of metropolitan residents reaching city centre in 30 minutes', stageX + 40, stageY + 80);

  ctx.fillStyle = '#0284c7';
  ctx.font = '700 68px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('67%', stageX + stageW - 40, stageY + 82);

  // Thick clean progress bar
  const barX = stageX + 40;
  const barW = stageW - 80;
  const barY1 = stageY + 116;
  const barH = 22;

  ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
  ctx.beginPath();
  ctx.roundRect(barX, barY1, barW, barH, 11);
  ctx.fill();

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.roundRect(barX, barY1, barW * 0.67 * prog, barH, 11);
  ctx.fill();

  // City benchmark pills
  const euroPills = ['Munich 74%', 'Lyon 71%', 'Rotterdam 69%', 'Lille 68%', 'Toulouse 62%'];
  let px = barX;
  const pillRowY1 = stageY + cardH - 58;
  euroPills.forEach((txt) => {
    const w = drawPill(ctx, px, pillRowY1, txt, '#fffbf7', '#0284c7', '600 13.5px "Plus Jakarta Sans", sans-serif', 14, 32);
    px += w + 10;
  });
  ctx.restore();

  // --- BOTTOM CARD: Large British Second Cities (40%) ---
  const y2 = stageY + cardH + gap;
  slideCard(ctx, stageX, y2, stageW, cardH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Large British second cities', stageX + 40, y2 + 52);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Buses trapped in mixed car traffic collapse morning reach', stageX + 40, y2 + 80);

  ctx.fillStyle = '#e11d48';
  ctx.font = '700 68px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('40%', stageX + stageW - 40, y2 + 82);

  const barY2 = y2 + 116;
  ctx.fillStyle = 'rgba(225, 29, 72, 0.15)';
  ctx.beginPath();
  ctx.roundRect(barX, barY2, barW, barH, 11);
  ctx.fill();

  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.roundRect(barX, barY2, barW * 0.40 * prog, barH, 11);
  ctx.fill();

  const ukPills = ['Manchester 44%', 'Birmingham 41%', 'Leeds 38%', 'Sheffield 35%'];
  let px2 = barX;
  const pillRowY2 = y2 + cardH - 58;
  ukPills.forEach((txt) => {
    const w = drawPill(ctx, px2, pillRowY2, txt, '#fffbf7', '#be0047', '600 13.5px "Plus Jakarta Sans", sans-serif', 14, 32);
    px2 += w + 10;
  });

  drawFtSourceFootnote(ctx, stageX + 40, y2 + cardH - 14, 'Source: Centre for Cities · Measuring metropolitan 30-minute public transport access');
  ctx.restore();
}

// ============================================================================
// SLIDE 04 · NETHERLANDS RANDSTAD VS NORTH OF ENGLAND (1950–2025)
// ============================================================================
function renderNetherlandsBacktest(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.1, 0, 1));

  slideCard(ctx, stageX, stageY, stageW, stageH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Regional productivity index (1950 = 100)', stageX + 38, stageY + 46);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Dutch Randstad (continuous transit investment) vs Northern England (tramway scrapping)', stageX + 38, stageY + 70);

  const gX = stageX + 122;
  const gY = stageY + 96;
  const gW = stageW - 172;
  const gH = stageH - 166;

  const xYr = (yr: number) => gX + ((yr - 1950) / 75) * gW;
  const yIdx = (idx: number) => gY + gH - ((idx - 70) / 75) * gH;

  // Gridlines & Y-Axis
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [80, 100, 120, 140].forEach((lvl) => {
    const y = yIdx(lvl);
    ctx.strokeStyle = lvl === 100 ? '#94a3b8' : 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = lvl === 100 ? 1.5 : 1;
    ctx.setLineDash(lvl === 100 ? [5, 5] : []);
    ctx.beginPath();
    ctx.moveTo(gX, y);
    ctx.lineTo(gX + gW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(lvl === 100 ? '100' : String(lvl), gX - 16, y);
  });
  ctx.setLineDash([]);

  // X-Axis Years
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#64748b';
  [1950, 1965, 1980, 1995, 2010, 2025].forEach((yr) => {
    ctx.fillText(String(yr), xYr(yr), gY + gH + 16);
  });

  // Shaded UK tram dismantling window (1949–1960)
  const xScrapStart = xYr(1950);
  const xScrapEnd = xYr(1960);
  ctx.fillStyle = 'rgba(225, 29, 72, 0.08)';
  ctx.fillRect(xScrapStart, gY, xScrapEnd - xScrapStart, gH);

  ctx.fillStyle = '#be0047';
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('1949–60: UK TRAMS SCRAPPED', xScrapStart + 10, gY + 14);

  const dutchAt = (yr: number) => {
    if (yr <= 1975) return 100 + ((yr - 1950) / 25) * 16;
    if (yr <= 2000) return 116 + ((yr - 1975) / 25) * 13;
    return 129 + ((yr - 2000) / 25) * 8.5;
  };

  const northAt = (yr: number) => {
    if (yr <= 1965) return 100 - ((yr - 1950) / 15) * 4;
    if (yr <= 1985) return 96 - ((yr - 1965) / 20) * 8;
    if (yr <= 2005) return 88 + ((yr - 1985) / 20) * 3;
    return 91 - ((yr - 2005) / 20) * 6;
  };

  const maxAnimYr = 1950 + 75 * prog;

  if (prog > 0.2) {
    const endY = Math.min(2025, maxAnimYr);
    ctx.beginPath();
    ctx.moveTo(xYr(1950), yIdx(100));
    for (let yr = 1950; yr <= endY; yr += 1) ctx.lineTo(xYr(yr), yIdx(dutchAt(yr)));
    for (let yr = endY; yr >= 1950; yr -= 1) ctx.lineTo(xYr(yr), yIdx(northAt(yr)));
    ctx.closePath();
    ctx.fillStyle = 'rgba(225, 29, 72, 0.05)';
    ctx.fill();
  }

  // Dutch Randstad Line (FT Blue)
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let yr = 1950; yr <= maxAnimYr; yr += 1) {
    const px = xYr(yr);
    const py = yIdx(dutchAt(yr));
    if (yr === 1950) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // North of England Line (FT Red)
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  for (let yr = 1950; yr <= maxAnimYr; yr += 1) {
    const px = xYr(yr);
    const py = yIdx(northAt(yr));
    if (yr === 1950) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  if (prog > 0.75) {
    drawPill(ctx, xYr(2025) - 235, yIdx(137.5) - 44, 'Dutch Randstad · 138', '#fffbf7', '#0284c7', '600 13.5px "Plus Jakarta Sans", sans-serif', 14, 34);
    drawPill(ctx, xYr(2025) - 235, yIdx(85.0) + 14, 'North of England · 85', '#fffbf7', '#be0047', '600 13.5px "Plus Jakarta Sans", sans-serif', 14, 34);

    const badgeX = xYr(2004);
    const badgeY = (yIdx(dutchAt(2004)) + yIdx(northAt(2004))) * 0.5;
    drawPill(ctx, badgeX - 110, badgeY - 20, '+52 pt divergence', '#fee2e2', '#991b1b', '700 14.5px "Plus Jakarta Sans", sans-serif', 18, 38);
  }

  drawFtSourceFootnote(ctx, stageX + 38, stageY + stageH - 18, 'Source: OECD Regional Database · Cambridge Econometrics');
  ctx.restore();
}

// ============================================================================
// FINANCIAL TIMES & CENTRE FOR CITIES DATASET (FT GVA VS CITY SIZE)
// Source: https://spiruel.github.io/assets/images/ft_gva.png
// Blog: Tom Forth, “The most important graph in British economics” (2017)
// ============================================================================
interface FTCityPoint {
  c: string; // City name
  p: number; // Population
  g: number; // GVA per worker (£)
  l?: string; // Label text
  align?: 'left' | 'right' | 'top' | 'bottom';
  curvedArrow?: { dx: number; dy: number; endDx?: number; endDy?: number };
}

// Cities in western Europe* (Belgium, Denmark, France, Germany, Netherlands, Sweden)
const FT_EU_CITIES: FTCityPoint[] = [
  // Labeled Key Anchor Cities from FT Graphic
  { c: 'Ingolstadt', p: 125000, g: 89500, l: 'Ingolstadt', align: 'right' },
  { c: 'Brussels', p: 1200000, g: 77500, l: 'Brussels', align: 'right' },
  { c: 'Antwerp', p: 500000, g: 72500, l: 'Antwerp', align: 'right' },
  { c: 'Hamburg', p: 1750000, g: 67100, l: 'Hamburg', align: 'right' },
  { c: 'Paris', p: 7000000, g: 80500, l: 'Paris', align: 'right' },
  { c: 'Lyon', p: 1350000, g: 61000, l: 'Lyon', align: 'right' },
  { c: 'The Hague', p: 650000, g: 61500, l: 'The Hague', align: 'right' },
  { c: 'Cologne', p: 1020000, g: 59000, l: 'Cologne', curvedArrow: { dx: 22, dy: 10 } },
  { c: 'Marseille', p: 1050000, g: 56800, l: 'Marseille', align: 'right' },
  { c: 'Berlin', p: 3460000, g: 50900, l: 'Berlin', align: 'right' },

  // Background Western European Scatter matching FT density
  { c: 'Ludwigshafen', p: 164000, g: 84500 },
  { c: 'Munich', p: 1350000, g: 71000 },
  { c: 'Bonn', p: 325000, g: 73900 },
  { c: 'Frankfurt', p: 680000, g: 70700 },
  { c: 'Stuttgart', p: 606000, g: 70500 },
  { c: 'Rotterdam', p: 620000, g: 66000 },
  { c: 'Amsterdam', p: 820000, g: 75200 },
  { c: 'Copenhagen', p: 600000, g: 74200 },
  { c: 'Stockholm', p: 950000, g: 75300 },
  { c: 'Düsseldorf', p: 588000, g: 66000 },
  { c: 'Wiesbaden', p: 276000, g: 64400 },
  { c: 'Regensburg', p: 135000, g: 62300 },
  { c: 'Darmstadt', p: 144000, g: 60100 },
  { c: 'Essen', p: 575000, g: 59500 },
  { c: 'Duisburg', p: 490000, g: 57900 },
  { c: 'Mannheim', p: 313000, g: 57900 },
  { c: 'Münster', p: 280000, g: 57800 },
  { c: 'Karlsruhe', p: 295000, g: 56900 },
  { c: 'Bremen', p: 547000, g: 56600 },
  { c: 'Hannover', p: 523000, g: 55600 },
  { c: 'Mainz', p: 199000, g: 55400 },
  { c: 'Gelsenkirchen', p: 258000, g: 55200 },
  { c: 'Wuppertal', p: 350000, g: 54500 },
  { c: 'Krefeld', p: 235000, g: 54300 },
  { c: 'Toulouse', p: 470000, g: 57500 },
  { c: 'Bordeaux', p: 250000, g: 56000 },
  { c: 'Lille', p: 232000, g: 54000 },
  { c: 'Nice', p: 342000, g: 53500 },
  { c: 'Nantes', p: 305000, g: 55000 },
  { c: 'Strasbourg', p: 280000, g: 54800 },
  { c: 'Rennes', p: 215000, g: 53200 },
  { c: 'Utrecht', p: 350000, g: 64500 },
  { c: 'Eindhoven', p: 230000, g: 62500 },
  { c: 'Ghent', p: 260000, g: 57800 },
  { c: 'Liege', p: 195000, g: 52000 },
  { c: 'Aarhus', p: 330000, g: 56500 },
  { c: 'Gothenburg', p: 570000, g: 60500 },
  { c: 'Malmo', p: 315000, g: 54000 },
  { c: 'Augsburg', p: 265000, g: 52000 },
  { c: 'Nuremberg', p: 505000, g: 51700 },
  { c: 'Heidelberg', p: 147000, g: 49800 },
  { c: 'Dortmund', p: 580000, g: 48800 },
  { c: 'Bochum', p: 375000, g: 46300 },
  { c: 'Bielefeld', p: 323000, g: 47300 },
  { c: 'Aachen', p: 259000, g: 46800 },
  { c: 'Kiel', p: 240000, g: 47400 },
  { c: 'Freiburg', p: 224000, g: 47700 },
  { c: 'Dresden', p: 523000, g: 42800 },
  { c: 'Leipzig', p: 522000, g: 42000 },
  { c: 'Magdeburg', p: 231000, g: 39900 },
  { c: 'Chemnitz', p: 243000, g: 39200 },
  { c: 'Erfurt', p: 205000, g: 38900 },
  { c: 'Halle', p: 233000, g: 37900 },
  { c: 'Charleroi', p: 202000, g: 44200 },
  { c: 'Grenoble', p: 158000, g: 53500 },
  { c: 'Toulon', p: 165000, g: 46500 },
  { c: 'Dijon', p: 155000, g: 50500 },
  { c: 'Le Havre', p: 172000, g: 48500 },
  { c: 'Reims', p: 182000, g: 49000 },
  { c: 'Saint-Etienne', p: 171000, g: 43500 },
  { c: 'Brest', p: 140000, g: 46500 },
  { c: 'Limoges', p: 135000, g: 46000 },
  { c: 'Tours', p: 136000, g: 48500 },
  { c: 'Amiens', p: 133000, g: 47200 },
  { c: 'Metz', p: 120000, g: 47000 },
  { c: 'Besancon', p: 117000, g: 48000 },
  { c: 'Orleans', p: 114000, g: 51000 },
  { c: 'Mulhouse', p: 110000, g: 47500 },
  { c: 'Rouen', p: 110000, g: 52000 },
  { c: 'Caen', p: 108000, g: 49500 },
  { c: 'Nancy', p: 105000, g: 49000 },
];

// Cities in UK
const FT_UK_CITIES: FTCityPoint[] = [
  // Labeled Key Anchor Cities from FT Graphic
  { c: 'London', p: 8600000, g: 68800, l: 'London', align: 'right' },
  { c: 'Reading', p: 230000, g: 63800, l: 'Reading', align: 'right' },
  { c: 'Bristol', p: 680000, g: 49400, l: 'Bristol', align: 'right' },
  { c: 'Leeds', p: 760000, g: 46600, l: 'Leeds', align: 'right' },
  { c: 'Liverpool', p: 600000, g: 44400, l: 'Liverpool', align: 'right' },
  { c: 'Glasgow', p: 950000, g: 42900, l: 'Glasgow', align: 'right' },
  { c: 'Newcastle', p: 800000, g: 42200, l: 'Newcastle', curvedArrow: { dx: -12, dy: 24 } },
  { c: 'Birmingham', p: 2450000, g: 43600, l: 'Birmingham', align: 'right' },
  { c: 'Brighton', p: 280000, g: 39800, l: 'Brighton', curvedArrow: { dx: 18, dy: 28 } },
  { c: 'York', p: 190000, g: 41600, l: 'York', curvedArrow: { dx: -16, dy: 26 } },

  // Background UK Scatter matching FT density
  { c: 'Slough', p: 145000, g: 65100 },
  { c: 'Milton Keynes', p: 245000, g: 61800 },
  { c: 'Oxford', p: 155000, g: 56500 },
  { c: 'Cambridge', p: 128000, g: 56000 },
  { c: 'Crawley', p: 110000, g: 57000 },
  { c: 'Aldershot', p: 180000, g: 56500 },
  { c: 'Swindon', p: 215000, g: 53500 },
  { c: 'Derby', p: 250000, g: 52500 },
  { c: 'Edinburgh', p: 490000, g: 52800 },
  { c: 'Southampton', p: 245000, g: 50500 },
  { c: 'Warrington', p: 205000, g: 50800 },
  { c: 'Portsmouth', p: 240000, g: 49500 },
  { c: 'Coventry', p: 340000, g: 47500 },
  { c: 'Northampton', p: 220000, g: 47200 },
  { c: 'Luton', p: 210000, g: 48000 },
  { c: 'Norwich', p: 210000, g: 46800 },
  { c: 'Ipswich', p: 140000, g: 46500 },
  { c: 'Exeter', p: 125000, g: 46200 },
  { c: 'Gloucester', p: 125000, g: 46500 },
  { c: 'Peterborough', p: 190000, g: 46000 },
  { c: 'Manchester', p: 2450000, g: 44800 },
  { c: 'Sheffield', p: 830000, g: 41800 },
  { c: 'Nottingham', p: 660000, g: 43200 },
  { c: 'Cardiff', p: 360000, g: 45200 },
  { c: 'Leicester', p: 495000, g: 43500 },
  { c: 'Belfast', p: 340000, g: 44000 },
  { c: 'Plymouth', p: 260000, g: 43500 },
  { c: 'Stoke', p: 380000, g: 41500 },
  { c: 'Swansea', p: 380000, g: 41200 },
  { c: 'Hull', p: 260000, g: 41000 },
  { c: 'Middlesbrough', p: 460000, g: 42500 },
  { c: 'Sunderland', p: 275000, g: 42000 },
  { c: 'Preston', p: 360000, g: 44000 },
  { c: 'Blackpool', p: 215000, g: 39500 },
  { c: 'Blackburn', p: 145000, g: 39000 },
  { c: 'Burnley', p: 175000, g: 40500 },
  { c: 'Mansfield', p: 230000, g: 41200 },
  { c: 'Barnsley', p: 240000, g: 40800 },
  { c: 'Doncaster', p: 305000, g: 41500 },
  { c: 'Rotherham', p: 255000, g: 41800 },
  { c: 'Huddersfield', p: 430000, g: 42800 },
  { c: 'Bradford', p: 530000, g: 42000 },
  { c: 'Wakefield', p: 335000, g: 43000 },
  { c: 'Wigan', p: 320000, g: 42500 },
  { c: 'Bolton', p: 280000, g: 41800 },
  { c: 'Rochdale', p: 215000, g: 40500 },
  { c: 'Oldham', p: 235000, g: 41000 },
  { c: 'Birkenhead', p: 320000, g: 42200 },
  { c: 'Telford', p: 170000, g: 43200 },
  { c: 'Dundee', p: 148000, g: 43500 },
  { c: 'Aberdeen', p: 230000, g: 58500 },
  { c: 'Newport', p: 240000, g: 43000 },
  { c: 'Worthing', p: 108000, g: 49500 },
  { c: 'Basildon', p: 180000, g: 51200 },
  { c: 'Chatham', p: 275000, g: 48500 },
  { c: 'Southend', p: 350000, g: 47800 },
  { c: 'Bournemouth', p: 480000, g: 46800 },
];

// ============================================================================
// SLIDE 03 · THE MOST IMPORTANT GRAPH IN BRITISH ECONOMICS
// Authentic Recreation of Financial Times & Centre for Cities Figure
// With Tom Forth Hitting Lines & Interactive SubStep Progression
// ============================================================================
function renderProductivityAndTomForth(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number,
  subStep: number = 0
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const isCompact = stageH < 660 || stageW < 960;

  // FT Styling Card Backdrop (Financial Times signature peach/salmon paper tint `#fff1e5`)
  slideCard(ctx, stageX, stageY, stageW, stageH, '#fff2e8', 18);
  ctx.save();
  ctx.strokeStyle = '#ebd9c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageW, stageH, 18);
  ctx.stroke();
  ctx.restore();

  // Tom Forth Hitting Prose per SubStep
  const FORTH_PROSE = [
    {
      title: '“Is there a relationship between city size and productivity?”',
      sub: 'Tom Forth: “The blog distils it down to the biggest topic in city economics: does being bigger make you richer?”',
      stepBadge: 'STEP 1/6 · THE AXES',
    },
    {
      title: 'France, Germany, Scandinavia & Low Countries show strong agglomeration',
      sub: 'Tom Forth: “In France and Germany, yes. The line of best fit slopes up with size. It is statistically significant.”',
      stepBadge: 'STEP 2/6 · EUROPEAN PEERS',
    },
    {
      title: 'European line of best fit: Strong, upward agglomeration return (↗)',
      sub: 'Tom Forth: “There is a very strong agglomeration benefit: bigger cities generate vastly higher output per worker.”',
      stepBadge: 'STEP 3/6 · EUROPEAN SLOPE',
    },
    {
      title: 'Spain and the UK are different: Size doesn’t matter',
      sub: 'Tom Forth: “Manchester and Birmingham face a 30% gap compared to comparable peer cities in the EU.”',
      stepBadge: 'STEP 4/6 · UK SECOND CITIES',
    },
    {
      title: 'The most important graph: Outside London, UK productivity slopes flat',
      sub: 'Tom Forth: “Remove London from the graph, and the larger a UK city gets, the poorer it is. This doesn’t happen in Europe.”',
      stepBadge: 'STEP 5/6 · UK FLAT SLOPE',
    },
    {
      title: 'Londonmaxxing: London is a lone outlier, while 58M citizens get no scale bonus',
      sub: 'Tom Forth: “Focusing exclusively on London will always leave the rest of the country poorer. We must fix our second cities.”',
      stepBadge: 'STEP 6/6 · LONDON OUTLIER',
    },
  ];

  const prose = FORTH_PROSE[Math.min(subStep, FORTH_PROSE.length - 1)];

  // Top Section: FT Headline & Interactive Step Badge
  ctx.save();
  const padX = isCompact ? 24 : 32;

  // FT Headline
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 ${isCompact ? 16 : 19.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(
    'Unlike in many other western European countries, productivity does not increase with city size in the UK',
    stageX + padX,
    stageY + (isCompact ? 14 : 18)
  );

  // Tom Forth Hitting Line (Prose quote)
  ctx.fillStyle = '#7c2d12';
  ctx.font = `500 ${isCompact ? 11.5 : 13}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(prose.sub, stageX + padX, stageY + (isCompact ? 38 : 46));

  // Step indicator badge top right
  drawPill(
    ctx,
    stageX + stageW - (isCompact ? 150 : 180),
    stageY + (isCompact ? 16 : 20),
    prose.stepBadge,
    '#fed7aa',
    '#9a3412',
    `700 ${isCompact ? 9.5 : 11}px "JetBrains Mono", monospace`,
    10,
    isCompact ? 22 : 26
  );
  ctx.restore();

  // Top Legend (Under title matching FT graphic)
  const legY = stageY + (isCompact ? 60 : 72);
  ctx.save();
  ctx.font = `600 ${isCompact ? 11 : 12.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Western Europe Legend
  const leg1X = stageX + padX;
  ctx.fillStyle = 'rgba(219, 234, 254, 0.7)';
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(leg1X + 6, legY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0284c7';
  ctx.fillText('Cities in western Europe*', leg1X + 18, legY);

  // UK Legend
  const leg2X = leg1X + (isCompact ? 175 : 200);
  ctx.fillStyle = 'rgba(255, 228, 230, 0.7)';
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(leg2X + 6, legY, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e11d48';
  ctx.fillText('Cities in UK', leg2X + 18, legY);
  ctx.restore();

  // ==========================================================================
  // PLOT AREA COORDINATES (STRICTLY UNTRUNCATED X-AXIS: 100,000 to 10,000,000)
  // ==========================================================================
  const gX = stageX + (isCompact ? 54 : 64);
  const gY = legY + (isCompact ? 18 : 22);
  const gW = stageW - (isCompact ? 76 : 94);
  const gH = stageH - (gY - stageY) - (isCompact ? 56 : 64);

  // STRICTLY UNTRUNCATED LOG SCALE:
  // 100,000 (10^5) to 10,000,000 (10^7) across ALL substeps
  const logMin = 5.0; // log10(100,000)
  const logMax = 7.0; // log10(10,000,000)

  // Y Scale: 35,000 to 90,000 (£35k to £90k)
  const minGva = 35000;
  const maxGva = 90000;

  const xOfPop = (p: number) => gX + ((Math.log10(p) - logMin) / (logMax - logMin)) * gW;
  const yOfGva = (g: number) => gY + gH - ((g - minGva) / (maxGva - minGva)) * gH;

  // 1. Horizontal Gridlines & Y-Ticks (35 to 90 at 5k intervals)
  ctx.save();
  ctx.font = `500 ${isCompact ? 10.5 : 12}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const yLevels = [35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000, 90000];
  for (const lvl of yLevels) {
    const y = yOfGva(lvl);
    ctx.strokeStyle = lvl === 35000 ? '#cbd5e1' : 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = lvl === 35000 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(gX, y);
    ctx.lineTo(gX + gW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(`${lvl / 1000}`, gX - 8, y);
  }

  // Y-Axis Title (Rotated)
  ctx.save();
  ctx.translate(gX - (isCompact ? 36 : 44), gY + gH * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = `600 ${isCompact ? 10.5 : 12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText("Gross value added per worker, 2011 (£'000)", 0, 0);
  ctx.restore();

  // 2. Vertical Gridlines & X-Ticks (100,000, 1,000,000, 10,000,000)
  const majorXTicks = [
    { p: 100000, label: '100,000' },
    { p: 1000000, label: '1,000,000' },
    { p: 10000000, label: '10,000,000' },
  ];

  // Minor Log ticks
  const minorPops = [
    200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000,
    2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 9000000,
  ];

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  ctx.lineWidth = 0.8;
  for (const mp of minorPops) {
    const mx = xOfPop(mp);
    ctx.beginPath();
    ctx.moveTo(mx, gY);
    ctx.lineTo(mx, gY + gH);
    ctx.stroke();

    // Small tick mark on bottom axis
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(mx, gY + gH);
    ctx.lineTo(mx, gY + gH + 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
  }

  // Major vertical lines and text labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `600 ${isCompact ? 10.5 : 12}px "JetBrains Mono", monospace`;

  for (const mt of majorXTicks) {
    const x = xOfPop(mt.p);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, gY);
    ctx.lineTo(x, gY + gH);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillText(mt.label, x, gY + gH + 6);
  }

  // X-Axis Title
  ctx.font = `600 ${isCompact ? 10.5 : 12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('Population (logarithmic scale)', gX + gW * 0.5, gY + gH + (isCompact ? 22 : 26));
  ctx.restore();

  // Baseline Axis Outline
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(gX, gY);
  ctx.lineTo(gX, gY + gH);
  ctx.lineTo(gX + gW, gY + gH);
  ctx.stroke();

  // ==========================================================================
  // SUBSTEP 0: Empty Axes with Theory Prompt
  // ==========================================================================
  if (subStep === 0) {
    const boxW = Math.min(gW * 0.72, 540);
    const boxH = isCompact ? 96 : 110;
    const boxX = gX + (gW - boxW) * 0.5;
    const boxY = gY + gH * 0.38;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    ctx.stroke();

    ctx.fillStyle = '#c2410c';
    ctx.font = `700 ${isCompact ? 11 : 12}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('THE AGGLOMERATION HYPOTHESIS', boxX + boxW * 0.5, boxY + 22);

    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${isCompact ? 13 : 15}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('“Does being bigger make you richer?” — Centre for Cities', boxX + boxW * 0.5, boxY + 45);

    ctx.fillStyle = '#64748b';
    ctx.font = `400 ${isCompact ? 11 : 12.5}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('In standard economics, larger cities match talent and spillovers to lift output.', boxX + boxW * 0.5, boxY + 68);
    ctx.fillText('Click anywhere to load European benchmark cities →', boxX + boxW * 0.5, boxY + (isCompact ? 84 : 88));
    ctx.restore();
  }

  // ==========================================================================
  // SUBSTEP >= 1: Plot Western European Cities (Blue Hollow Rings)
  // ==========================================================================
  if (subStep >= 1) {
    ctx.save();
    const euAlpha = subStep >= 3 ? 0.75 : 0.95;
    ctx.globalAlpha = euAlpha;

    for (const d of FT_EU_CITIES) {
      const px = xOfPop(d.p);
      const py = yOfGva(d.g);
      if (px < gX || px > gX + gW || py < gY || py > gY + gH) continue;

      // Hollow Blue Circle (FT style)
      ctx.fillStyle = 'rgba(219, 234, 254, 0.65)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(px, py, isCompact ? 5 : 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curved leader arrows matching FT
      if (d.curvedArrow) {
        const lx = px + d.curvedArrow.dx;
        const ly = py + d.curvedArrow.dy;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(px + d.curvedArrow.dx * 0.5, py + d.curvedArrow.dy * 0.3, px + 4, py + 2);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `600 ${isCompact ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.l || d.c, lx + 3, ly);
      } else if (d.l) {
        ctx.fillStyle = '#0369a1';
        ctx.font = `600 ${isCompact ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.l, px + 8, py - 3);
      }
    }
    ctx.restore();
  }

  // ==========================================================================
  // SUBSTEP >= 2: Western European Line of Best Fit (Dashed Blue ↗)
  // ==========================================================================
  if (subStep >= 2) {
    ctx.save();
    // Regression line: from (120,000, 51.5k) to (7,000,000, 67.0k)
    const p1 = 120000;
    const g1 = 51500;
    const p2 = 7000000;
    const g2 = 67000;

    const x1 = xOfPop(p1);
    const y1 = yOfGva(g1);
    const x2 = xOfPop(p2);
    const y2 = yOfGva(g2);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Line Tag
    if (subStep === 2) {
      const tagP = 1500000;
      const tagX = xOfPop(tagP);
      const tagY = yOfGva(g1 + ((g2 - g1) / (Math.log10(p2) - Math.log10(p1))) * (Math.log10(tagP) - Math.log10(p1))) - 22;
      drawPill(ctx, tagX - 110, tagY, 'Europe: +£7k per 10× population ↗', '#0284c7', '#ffffff', '700 11.5px "Plus Jakarta Sans", sans-serif', 12, 26);
    }
    ctx.restore();
  }

  // ==========================================================================
  // SUBSTEP >= 3: Plot UK Cities (Pink Hollow Rings)
  // ==========================================================================
  if (subStep >= 3) {
    ctx.save();
    for (const d of FT_UK_CITIES) {
      // Keep London for the Step 5 climax!
      if (d.c === 'London' && subStep < 5) continue;

      const px = xOfPop(d.p);
      const py = yOfGva(d.g);
      if (px < gX || px > gX + gW || py < gY || py > gY + gH) continue;

      // Hollow Pink Circle (FT style)
      ctx.fillStyle = 'rgba(255, 228, 230, 0.7)';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(px, py, isCompact ? 5 : 5.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Curved leader arrows matching FT
      if (d.curvedArrow) {
        const lx = px + d.curvedArrow.dx;
        const ly = py + d.curvedArrow.dy;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.quadraticCurveTo(px + d.curvedArrow.dx * 0.5, py + d.curvedArrow.dy * 0.4, px, py + 5);
        ctx.stroke();

        ctx.fillStyle = '#e11d48';
        ctx.font = `700 ${isCompact ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = d.curvedArrow.dx < 0 ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.l || d.c, lx + (d.curvedArrow.dx < 0 ? -4 : 4), ly);
      } else if (d.l && d.c !== 'London') {
        ctx.fillStyle = '#e11d48';
        ctx.font = `700 ${isCompact ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.l, px + 8, py);
      }
    }
    ctx.restore();
  }

  // ==========================================================================
  // SUBSTEP >= 4: UK Line of Best Fit (Dashed Red →) & FT Annotation Arrow
  // ==========================================================================
  if (subStep >= 4) {
    ctx.save();
    // UK Line: from (110,000, 45.5k) to (9,000,000, 49.0k) - virtually flat!
    const ukP1 = 110000;
    const ukG1 = 45500;
    const ukP2 = 9000000;
    const ukG2 = 49000;

    const ux1 = xOfPop(ukP1);
    const uy1 = yOfGva(ukG1);
    const ux2 = xOfPop(ukP2);
    const uy2 = yOfGva(ukG2);

    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(ux1, uy1);
    ctx.lineTo(ux2, uy2);
    ctx.stroke();
    ctx.setLineDash([]);

    // FT Annotation Text & Horizontal Arrow (exact matching ft_gva.png)
    const annotX = xOfPop(1150000);
    const annotY = yOfGva(39000);
    const arrowEndX = xOfPop(8500000);

    ctx.fillStyle = '#0f172a';
    ctx.font = `600 ${isCompact ? 11 : 12.5}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('As city size increases, productivity', annotX, annotY - 8);
    ctx.fillText('grows only marginally in UK cities', annotX, annotY + 8);

    // Arrow line and head
    const arrowLineStartX = annotX + ctx.measureText('grows only marginally in UK cities').width + 16;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(arrowLineStartX, annotY + 14);
    ctx.lineTo(arrowEndX, annotY + 14);
    ctx.lineTo(arrowEndX - 7, annotY + 10);
    ctx.moveTo(arrowEndX, annotY + 14);
    ctx.lineTo(arrowEndX - 7, annotY + 18);
    ctx.stroke();
    ctx.restore();
  }

  // ==========================================================================
  // SUBSTEP >= 5: London Outlier Reveal (Alone at far right)
  // ==========================================================================
  if (subStep >= 5) {
    ctx.save();
    const lonP = 8600000;
    const lonG = 68800;
    const lx = xOfPop(lonP);
    const ly = yOfGva(lonG);

    // Pulsing halo
    ctx.fillStyle = 'rgba(225, 29, 72, 0.20)';
    ctx.beginPath();
    ctx.arc(lx, ly, 18, 0, Math.PI * 2);
    ctx.fill();

    // Solid London dot
    ctx.fillStyle = 'rgba(255, 228, 230, 0.9)';
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(lx, ly, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // London Label
    ctx.fillStyle = '#e11d48';
    ctx.font = `800 ${isCompact ? 13 : 15}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('London', lx + 12, ly);

    // Elegant compact annotation tag above London (keeps regression lines visible)
    const tagText = 'London: Lone UK outlier (£68.8k GVA)';
    drawPill(
      ctx,
      lx - (isCompact ? 210 : 230),
      ly - (isCompact ? 26 : 32),
      tagText,
      '#ffe4e6',
      '#be123c',
      `700 ${isCompact ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`,
      8,
      isCompact ? 20 : 24
    );
    ctx.restore();
  }

  // ==========================================================================
  // FOOTNOTE & SOURCES (Bottom left, matching FT graphic)
  // ==========================================================================
  ctx.save();
  const footY = stageY + stageH - (isCompact ? 14 : 18);
  ctx.fillStyle = '#64748b';
  ctx.font = `400 ${isCompact ? 9 : 10.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('*Belgium, Denmark, France, Germany, Netherlands and Sweden', stageX + padX, footY - 14);
  ctx.fillText('Source: Centre for Cities · © FT · Tom Forth (2017)', stageX + padX, footY);

  // Keyboard navigation hint on bottom right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `500 ${isCompact ? 9 : 10.5}px "JetBrains Mono", monospace`;
  ctx.fillText('[Click / Space to step forward]', stageX + stageW - padX, footY);
  ctx.restore();
}

// ============================================================================
// SLIDE 17 · LEEDS STRESS-TEST IN-MAP OVERLAY CARD
// ============================================================================
function renderLeedsStressOverlay(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const cardW = Math.min(stageW * 0.44, 460);
  const cardH = 264;
  const x = stageX + stageW - cardW - 22;
  const y = stageY + stageH - cardH - 22;

  const p = olmoEase(clamp(slideElapsed / 0.9, 0, 1));
  ctx.save();
  ctx.globalAlpha *= p;

  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fff2e8';
  ctx.beginPath();
  ctx.roundRect(x, y, cardW, cardH, 18);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#ebd9c8';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('30-min reach across stress tests', x + 20, y + 28);

  const rows = [
    { label: 'Baseline (1957 vs 2026)', h: 432570, m: 256065 },
    { label: '+ All 24 heavy rail stations', h: 432570, m: 269049 },
    { label: '−20% tram speed penalty', h: 391388, m: 256065 },
    { label: 'St James’s Hospital hub', h: 254524, m: 132962 },
  ];

  const maxV = 460000;
  const barX = x + 20;
  const barMaxW = cardW - 106;

  rows.forEach((r, idx) => {
    const ry = y + 54 + idx * 48;
    ctx.fillStyle = '#334155';
    ctx.font = '500 13.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(r.label, barX, ry);

    const hw = (r.h / maxV) * barMaxW * p;
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.roundRect(barX, ry + 6, hw, 7, 3.5);
    ctx.fill();

    const mw = (r.m / maxV) * barMaxW * p;
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(barX, ry + 16, mw, 7, 3.5);
    ctx.fill();

    const ratio = (r.h / r.m).toFixed(2) + '×';
    ctx.fillStyle = '#7c2d12';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(ratio, x + cardW - 20, ry + 18);
  });

  drawFtSourceFootnote(ctx, x + 20, y + cardH - 12, 'Sensitivity stress tests');
  ctx.restore();
}

// ============================================================================
// SLIDE 26 · FIVE-CITY SCOREBOARD (LARGE SLIDE SCALE)
// ============================================================================
function renderFiveCityScoreboard(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  overview: OverviewData,
  citiesBySlug: Record<string, CityData>,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.15, 0, 1));

  slideCard(ctx, stageX, stageY, stageW, stageH, '#fff2e8', 20);

  // Clean inline legend at top of figure
  ctx.save();
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7c3aed';
  ctx.fillText('● Historic tram era (+ sensitivity range)', stageX + 38, stageY + 44);

  ctx.fillStyle = '#0284c7';
  ctx.fillText('● 2026 transit (+ range)', stageX + 390, stageY + 44);

  const order = ['liverpool', 'leeds', 'manchester', 'sheffield', 'birmingham'];
  const maxPop = 560000;
  const trackX = stageX + 216;
  const trackW = stageW - 356;

  const topRowY = stageY + 118;
  const rowStep = (stageH - 170) / 4;

  order.forEach((slug, idx) => {
    const oc = overview.cities.find((c) => c.slug === slug);
    const full = citiesBySlug[slug];
    if (!oc) return;

    const rowP = olmoEase(clamp((slideElapsed - idx * 0.1) / 0.85, 0, 1));
    const ry = topRowY + idx * rowStep;

    const h30 = oc.populationCurve.historical['30'] || 0;
    const m30 = oc.populationCurve.modern['30'] || 0;
    const rob = full?.robustness || oc.robustness;
    const hLo = rob?.hist30_lo ?? (slug === 'leeds' ? 391388 : h30);
    const hHi = rob?.hist30_hi ?? (slug === 'leeds' ? 452344 : h30);
    const mLo = rob?.mod30_lo ?? (slug === 'leeds' ? 215985 : m30);
    const mHi = rob?.mod30_hi ?? (slug === 'leeds' ? 276613 : m30);

    // City Name
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(oc.displayName, stageX + 38, ry);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillText(`${oc.historicalYear} vs 2026`, stageX + 38, ry + 20);

    // Horizontal track rule
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(trackX, ry - 4);
    ctx.lineTo(trackX + trackW, ry - 4);
    ctx.stroke();

    const pxOf = (val: number) => trackX + (val / maxPop) * trackW * rowP;

    // Sensitivity bands
    ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
    ctx.beginPath();
    ctx.roundRect(pxOf(mLo), ry - 16, Math.max(4, pxOf(mHi) - pxOf(mLo)), 24, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.beginPath();
    ctx.roundRect(pxOf(hLo), ry - 16, Math.max(4, pxOf(hHi) - pxOf(hLo)), 24, 6);
    ctx.fill();

    // Connecting gain bar
    ctx.strokeStyle = '#c4b5fd';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pxOf(m30), ry - 4);
    ctx.lineTo(pxOf(h30), ry - 4);
    ctx.stroke();

    // 2026 marker + value
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(pxOf(m30), ry - 4, 8, 0, Math.PI * 2);
    ctx.fill();

    if (prog > 0.65) {
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(m30 / 1000)}k`, pxOf(m30), ry - 20);
    }

    // Manchester 1943 Blitz marker
    if (slug === 'manchester') {
      const w43 = 372663;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(pxOf(w43), ry - 4, 6, 0, Math.PI * 2);
      ctx.fill();
      if (prog > 0.7) {
        ctx.fillStyle = '#b45309';
        ctx.font = '600 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('1943 (373k)', pxOf(w43), ry + 24);
      }
    }

    // Historical marker + value
    ctx.fillStyle = '#7c3aed';
    ctx.beginPath();
    ctx.arc(pxOf(h30), ry - 4, 9, 0, Math.PI * 2);
    ctx.fill();

    if (prog > 0.65) {
      ctx.font = '600 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#7c3aed';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(h30 / 1000)}k`, pxOf(h30), ry - 20);
    }

    // Right ratio pill
    const ratio = (h30 / Math.max(1, m30)).toFixed(2) + '×';
    drawPill(
      ctx,
      stageX + stageW - 112,
      ry - 20,
      ratio,
      '#fffbf7',
      '#7c2d12',
      '700 15px "JetBrains Mono", monospace',
      14,
      34
    );
  });

  drawFtSourceFootnote(ctx, stageX + 38, stageY + stageH - 18, 'Source: National Tramway Museum Archive & 2026 GTFS Routing Engine');
  ctx.restore();
}

// ============================================================================
// SLIDE 27 · TWO-SPEED CURVES (10 TO 60 MINUTES)
// ============================================================================
function renderTwoSpeedCurves(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  citiesBySlug: Record<string, CityData>,
  slideElapsed: number,
  _globalTime: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.3, 0, 1));

  slideCard(ctx, stageX, stageY, stageW, stageH, '#fff2e8', 20);

  const gx = stageX + 86;
  const gy = stageY + 54;
  const gw = stageW - 128;
  const gh = stageH - 146;

  const mins = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
  const slugs = ['liverpool', 'leeds', 'manchester', 'sheffield', 'birmingham'];

  const histSum = mins.map((m) =>
    slugs.reduce((acc, s) => acc + (citiesBySlug[s]?.populationCurve.historical[String(m)] || 0), 0)
  );
  const modSum = mins.map((m) =>
    slugs.reduce((acc, s) => acc + (citiesBySlug[s]?.populationCurve.modern[String(m)] || 0), 0)
  );

  const maxY = Math.max(...modSum, ...histSum, 6000000) * 1.06;
  const pxOf = (m: number) => gx + ((m - 10) / 50) * gw;
  const pyOf = (val: number) => gy + gh - (val / maxY) * gh;

  ctx.save();

  // Shaded Zones
  const x30 = pxOf(30);
  const x42 = pxOf(42.5);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
  ctx.beginPath();
  ctx.roundRect(gx, gy, x30 - gx, gh, 10);
  ctx.fill();

  ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
  ctx.beginPath();
  ctx.roundRect(x42, gy, gx + gw - x42, gh, 10);
  ctx.fill();

  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.fillStyle = '#7c3aed';
  ctx.textAlign = 'left';
  ctx.fillText('← TRAMS LEAD (1.51× AT 30m)', gx + 16, gy + 26);

  ctx.fillStyle = '#0284c7';
  ctx.textAlign = 'left';
  ctx.fillText('REGIONAL RAIL LEADS →', x42 + 16, gy + 26);

  // Axes & Y gridlines
  for (const mil of [1, 2, 3, 4, 5, 6]) {
    const yv = pyOf(mil * 1_000_000);
    if (yv < gy) continue;
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, yv);
    ctx.lineTo(gx + gw, yv);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${mil}M`, gx - 14, yv);
  }

  // X-axis minute ticks
  ctx.textBaseline = 'top';
  for (const m of [10, 20, 30, 40, 50, 60]) {
    const mx = pxOf(m);
    ctx.fillStyle = m === 30 ? '#7c3aed' : '#475569';
    ctx.font = m === 30 ? '700 14px "JetBrains Mono", monospace' : '500 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${m}m`, mx, gy + gh + 14);
  }

  // City Crossover Markers
  const crossovers = [
    { label: 'BHM 35m', m: 35, row: 0 },
    { label: 'SHF 39m', m: 39, row: 1 },
    { label: 'LDS 46m', m: 46, row: 0 },
    { label: 'MAN 53m', m: 53, row: 0 },
    { label: 'LIV 55m', m: 55, row: 1 },
  ];
  crossovers.forEach((c) => {
    const cx = pxOf(c.m);
    const labelY = gy + gh + (c.row === 1 ? 54 : 38);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(cx, gy + 40);
    ctx.lineTo(cx, labelY - 4);
    ctx.stroke();
    ctx.fillStyle = '#334155';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, cx, labelY);
    ctx.restore();
  });

  const maxIdx = Math.max(1, Math.floor((mins.length - 1) * prog));

  // Modern 5-city curve (FT Blue)
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= maxIdx; i++) {
    const x = pxOf(mins[i]);
    const y = pyOf(modSum[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Historical 5-city curve (FT Purple)
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  for (let i = 0; i <= maxIdx; i++) {
    const x = pxOf(mins[i]);
    const y = pyOf(histSum[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (prog > 0.75) {
    const idx30 = 4;
    drawPill(
      ctx,
      pxOf(30) - 96,
      pyOf(histSum[idx30]) - 44,
      `Tram era · ${(histSum[idx30] / 1e6).toFixed(2)}M`,
      '#fffbf7',
      '#7c3aed',
      '700 14px "Plus Jakarta Sans", sans-serif',
      14,
      32
    );

    drawPill(
      ctx,
      pxOf(60) - 208,
      pyOf(modSum[10]) + 14,
      `2026 multimodal · ${(modSum[10] / 1e6).toFixed(2)}M`,
      '#fffbf7',
      '#0284c7',
      '700 14px "Plus Jakarta Sans", sans-serif',
      14,
      32
    );
  }

  drawFtSourceFootnote(ctx, stageX + 38, stageY + stageH - 18, 'Source: GTFS + Crich Archive Aggregated 5-City Isochrones');
  ctx.restore();
}

// ============================================================================
// BOOKEND · LONDONMAXXING & THE NATIONAL PROSPERITY GAP
// ============================================================================
function renderLondonmaxxingStage(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.0, 0, 1));
  const gap = 24;
  const leftW = (stageW - gap) * 0.51;
  const rightW = stageW - gap - leftW;
  const rightX = stageX + leftW + gap;

  // Left Card: Empirical Concentration & Prosperity Gap
  slideCard(ctx, stageX, stageY, leftW, stageH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Where Britain’s prosperity gap sits', stageX + 34, stageY + 44);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Centre for Cities (2026) & Tom Forth “Londonmaxxing”', stageX + 34, stageY + 68);

  const metrics = [
    {
      stat: '72%',
      label: 'UK private knowledge jobs concentrated in cities',
      sub: 'Cities generate 63% of total British economic output',
      frac: 0.72,
      color: '#0284c7',
    },
    {
      stat: '57%',
      label: 'Share of UK prosperity gap from 2nd cities',
      sub: 'Underperforming large cities outside London drag national GDP',
      frac: 0.57,
      color: '#e11d48',
    },
    {
      stat: '+33%',
      label: 'Greater South East real business R&D surge',
      sub: '2018–2024 growth while rest-of-UK R&D stagnated',
      frac: 0.66,
      color: '#0d9488',
    },
  ];

  const barX = stageX + 34;
  const barW = leftW - 68;
  const rowSpacing = Math.min(160, (stageH - 180) / 3);

  metrics.forEach((m, i) => {
    const rowY = stageY + 104 + i * rowSpacing;

    ctx.fillStyle = m.color;
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(m.stat, barX, rowY);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(m.label, barX + 96, rowY + 2);

    ctx.fillStyle = '#64748b';
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(m.sub, barX + 96, rowY + 24);

    const trackY = rowY + 46;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, trackY, barW, 12, 6);
    ctx.fill();

    ctx.fillStyle = m.color;
    ctx.beginPath();
    ctx.roundRect(barX, trackY, barW * m.frac * prog, 12, 6);
    ctx.fill();
  });

  drawPill(
    ctx,
    barX,
    stageY + stageH - 58,
    'Not zero-sum: Britain is poorer when its 2nd cities underperform',
    '#fffbf7',
    '#7c2d12',
    '600 13px "Plus Jakarta Sans", sans-serif',
    16,
    34
  );
  drawFtSourceFootnote(ctx, barX, stageY + stageH - 16, 'Source: Centre for Cities 2026 · Tom Forth “Londonmaxxing”');
  ctx.restore();

  // Right Card: Four Mechanisms Why Everyone (Including London) Pays
  slideCard(ctx, rightX, stageY, rightW, stageH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Why everyone pays the price', rightX + 32, stageY + 44);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Four national economic drags · OECD 2026 UK Survey', rightX + 32, stageY + 68);

  const costs = [
    {
      num: '01',
      title: 'Missing economic scale',
      desc: 'Firms cannot tap deep supplier, customer & labour pools across second cities',
    },
    {
      num: '02',
      title: 'Underused specialist talent',
      desc: 'Graduates & engineers outside the South East face thin local job matching',
    },
    {
      num: '03',
      title: 'Narrow R&D geography',
      desc: 'Public R&D under-weights regional clusters where businesses already innovate',
    },
    {
      num: '04',
      title: 'Smaller national tax base',
      desc: '£40bn/yr in foregone regional output squeezes public services nationwide',
    },
  ];

  const cardTop = stageY + 104;
  const availH = stageH - 146;
  const itemGap = 14;
  const itemH = (availH - itemGap * 3) / 4;

  costs.forEach((c, idx) => {
    const iy = cardTop + idx * (itemH + itemGap);
    slideCard(ctx, rightX + 28, iy, rightW - 56, itemH, '#fffbf7', 14);

    // Number circle
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(rightX + 60, iy + itemH * 0.5, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9a3412';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.num, rightX + 60, iy + itemH * 0.5 + 0.5);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(c.title, rightX + 94, iy + itemH * 0.43);

    ctx.fillStyle = '#475569';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, c.desc, rightX + 94, iy + itemH * 0.62, rightW - 56 - 90, 19);
  });

  drawFtSourceFootnote(ctx, rightX + 28, stageY + stageH - 16, 'Source: OECD 2026 UK Economic Survey');
  ctx.restore();
}

// ============================================================================
// OBJECTION · DOES AGGLOMERATION STILL MATTER IN REMOTE / HYBRID WORK?
// ============================================================================
function renderRemoteAgglomerationStage(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.0, 0, 1));
  const gap = 22;
  const topH = stageH * 0.52;
  const botH = stageH - topH - gap;
  const halfW = (stageW - gap) * 0.5;

  // Top-Left: OECD Sorting-Adjusted Productivity Evidence
  slideCard(ctx, stageX, stageY, halfW, topH, '#fff2e8', 20);
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('OECD Great Britain agglomeration study', stageX + 32, stageY + 44);
  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Controlling for individual worker skills & sorting', stageX + 32, stageY + 68);

  ctx.fillStyle = '#0284c7';
  ctx.font = '700 64px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('+0.9–1.0%', stageX + 32, stageY + 154);

  ctx.fillStyle = '#0f172a';
  ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('city productivity per +10% job density', stageX + 32, stageY + 190);

  ctx.fillStyle = '#475569';
  ctx.font = '400 14.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Zero structural break across the post-2008 digital shift.', stageX + 32, stageY + 218);

  let px = stageX + 32;
  const p1 = drawPill(ctx, px, topH + stageY - 60, 'OECD (2020) GB Study', '#fffbf7', '#0284c7', '600 13px "Plus Jakarta Sans", sans-serif', 14, 32);
  drawPill(ctx, px + p1 + 10, topH + stageY - 60, 'Sorting-adjusted', '#fffbf7', '#0d9488', '600 13px "Plus Jakarta Sans", sans-serif', 14, 32);

  drawFtSourceFootnote(ctx, stageX + 32, topH + stageY - 14, 'Source: OECD Spatial Economic Analysis');
  ctx.restore();

  // Top-Right: Hybrid 2-Day Commute Reliability
  const trX = stageX + halfW + gap;
  slideCard(ctx, trX, stageY, halfW, topH, '#fff2e8', 20);
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Fewer commute days ≠ connectivity optional', trX + 32, stageY + 44);
  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Hybrid 2-day attendance still gates labour-market reach', trX + 32, stageY + 68);

  // Two comparison rows inside Top-Right
  const boxW = halfW - 64;
  slideCard(ctx, trX + 32, stageY + 96, boxW, 114, '#fffbf7', 14);
  ctx.fillStyle = '#0d9488';
  ctx.font = '700 13.5px "JetBrains Mono", monospace';
  ctx.fillText('✓ SEGREGATED LIGHT RAIL · 22 MIN', trX + 50, stageY + 126);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 16.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Reliable 2–3 day/wk access to city-centre teams & clients', trX + 50, stageY + 154);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Suburb stays inside the specialist hiring & mentoring pool', trX + 50, stageY + 180);

  slideCard(ctx, trX + 32, stageY + 226, boxW, 114, '#fffbf7', 14);
  ctx.fillStyle = '#e11d48';
  ctx.font = '700 13.5px "JetBrains Mono", monospace';
  ctx.fillText('✗ UNRELIABLE MIXED BUSES · 70+ MIN', trX + 50, stageY + 256);
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 16.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Long, unpredictable transfers deter hybrid participation', trX + 50, stageY + 284);
  ctx.fillStyle = '#64748b';
  ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Shrinks effective talent pool even when Fridays are WFH', trX + 50, stageY + 310);
  ctx.restore();

  // Bottom Full-Width Card: Beyond Traditional 9-to-5 Commuters + DfT Oct 2024
  const botY = stageY + topH + gap;
  slideCard(ctx, stageX, botY, stageW, botH, '#fff2e8', 20);
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Urban transit connects whole ecosystems — not just 5-day office desks', stageX + 32, botY + 44);

  drawPill(
    ctx,
    stageX + stageW - 410,
    botY + 22,
    'DfT (Oct 2024): Agglomeration adapts via land use',
    '#fed7aa',
    '#9a3412',
    '700 12.5px "Plus Jakarta Sans", sans-serif',
    14,
    32
  );

  const pillars = [
    {
      tag: 'MATCHING',
      title: 'Specialist recruitment',
      body: 'Graduates & niche engineers matched to specialist employers across a 2M+ pool',
    },
    {
      tag: 'SPILLOVERS',
      title: 'Mentoring & networks',
      body: 'In-person collaboration, founder collisions & tacit skill transfer on anchor days',
    },
    {
      tag: 'INSTITUTIONS',
      title: 'Hospitals, labs & unis',
      body: 'Teaching hospitals, wet labs, campuses & clinical staff cannot work remotely',
    },
    {
      tag: 'GRAVITY',
      title: 'Amenities & culture',
      body: 'Commercial, cultural & civic life that attracts and retains mobile skilled workers',
    },
  ];

  const pGap = 18;
  const pW = (stageW - 64 - pGap * 3) / 4;
  const pY = botY + 74;
  const pH = botH - 106;

  pillars.forEach((p, i) => {
    const x = stageX + 32 + i * (pW + pGap) * (0.96 + 0.04 * prog);
    slideCard(ctx, x, pY, pW, pH, '#fffbf7', 14);

    ctx.fillStyle = '#7c2d12';
    ctx.font = '700 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(p.tag, x + 20, pY + 30);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(p.title, x + 20, pY + 58);

    ctx.fillStyle = '#475569';
    ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, p.body, x + 20, pY + 84, pW - 40, 19);
  });
  ctx.restore();
}

// ============================================================================
// IDENTIFICATION · 3-COHORT NATURAL EXPERIMENT + 3 LEVELS OF EVIDENCE
// ============================================================================
function renderNaturalExperimentStage(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.0, 0, 1));
  const gap = 20;
  const topH = stageH * 0.52;
  const botH = stageH - topH - gap;
  const colW = (stageW - gap * 2) / 3;

  const groups = [
    {
      bg: '#fff2e8',
      tag: 'GROUP A · UK DISMANTLERS',
      tagColor: '#e11d48',
      title: 'Scrapped trams → buses',
      desc: 'Reconstruct closure dates, bus replacements & lost 30-min reach',
      cities: ['Leeds', 'Birmingham', 'Liverpool', 'Sheffield', 'Manchester', 'Newcastle'],
      foot: 'Closed 1929–1960 · Mixed-traffic replacement',
    },
    {
      bg: '#fff2e8',
      tag: 'GROUP B · EU MODERNISERS',
      tagColor: '#0284c7',
      title: 'Retained or rebuilt LRT',
      desc: 'Upgraded pre-war networks with tunnels, priority & articulated rail',
      cities: ['Rotterdam', 'Cologne', 'Lyon', 'Strasbourg', 'Lille'],
      foot: 'Evolved continuously — not frozen in 1945',
    },
    {
      bg: '#fff2e8',
      tag: 'GROUP C · HISTORICAL CONTROLS',
      tagColor: '#0d9488',
      title: 'Post-industrial & DiD peers',
      desc: 'Isolate industrial transition & motorisation from transit choices',
      cities: ['Dresden', 'Leipzig', '120 W. German cities'],
      foot: '2026 German DiD: ≥10% permanent car jump',
    },
  ];

  groups.forEach((g, idx) => {
    const gx = stageX + idx * (colW + gap);
    slideCard(ctx, gx, stageY, colW, topH, g.bg, 20);

    ctx.save();
    ctx.fillStyle = g.tagColor;
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(g.tag, gx + 26, stageY + 38);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(g.title, gx + 26, stageY + 70);

    ctx.fillStyle = '#475569';
    ctx.font = '400 14.5px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, g.desc, gx + 26, stageY + 98, colW - 52, 20);

    // City pills wrap
    let px = gx + 26;
    let py = stageY + 168;
    g.cities.forEach((city) => {
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      const w = ctx.measureText(city).width + 26;
      if (px + w > gx + colW - 24) {
        px = gx + 26;
        py += 40;
      }
      drawPill(ctx, px, py, city, '#fffbf7', '#0f172a', '600 13px "Plus Jakarta Sans", sans-serif', 12, 30);
      px += w + 8;
    });

    ctx.fillStyle = '#7c2d12';
    ctx.font = '500 12.5px "JetBrains Mono", monospace';
    ctx.fillText(g.foot, gx + 26, stageY + topH - 24);
    ctx.restore();
  });

  // Bottom Card: Three Levels of Evidence Table
  const botY = stageY + topH + gap;
  slideCard(ctx, stageX, botY, stageW, botH, '#fff2e8', 20);

  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('What can we actually prove? Three levels of evidence', stageX + 32, botY + 42);

  const levels = [
    {
      lvl: '1. Accessibility',
      q: 'Did removal reduce workers reaching job centres in 30 min — never restored?',
      badge: 'Directly measurable (proven here)',
      bg: '#ccfbf1',
      fg: '#0f766e',
    },
    {
      lvl: '2. Urban corridors',
      q: 'Did former tram suburbs diverge in jobs, density & deprivation trajectories?',
      badge: 'Testable w/ route selection controls',
      bg: '#fed7aa',
      fg: '#9a3412',
    },
    {
      lvl: '3. Productivity',
      q: 'Did dismantler cities suffer weaker GVA growth than retained-rail comparators?',
      badge: 'Hardest causally · DiD event study',
      bg: '#e2e8f0',
      fg: '#334155',
    },
  ];

  const rowStart = botY + 66;
  const rowGap = 10;
  const rowH = (botH - 86 - rowGap * 2) / 3;

  levels.forEach((l, i) => {
    const ry = rowStart + i * (rowH + rowGap);
    slideCard(ctx, stageX + 28, ry, stageW - 56, rowH, '#fffbf7', 12);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(l.lvl, stageX + 46, ry + rowH * 0.5);

    ctx.fillStyle = '#334155';
    ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(l.q, stageX + 215, ry + rowH * 0.5);

    ctx.font = '600 12.5px "Plus Jakarta Sans", sans-serif';
    const bw = ctx.measureText(l.badge).width + 28;
    drawPill(
      ctx,
      stageX + stageW - 46 - bw,
      ry + (rowH - 30) * 0.5,
      l.badge,
      l.bg,
      l.fg,
      '600 12.5px "Plus Jakarta Sans", sans-serif',
      14,
      30
    );
  });

  drawFtSourceFootnote(ctx, stageX + 32, stageY + stageH - 12, 'Source: Causal inference framework · Kleinschmidt et al. (2026)');
  ctx.restore();
}

// ============================================================================
// MICRO-STORY · HAREHILLS 3-MAP NEIGHBOURHOOD TRIPTYCH (LEEDS)
// ============================================================================
function renderHarehillsTriptych(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  leedsCity: CityData | null,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.1, 0, 1));
  const gap = 20;
  const panelW = (stageW - gap * 2) / 3;

  // Geographic NE Leeds window: Briggate (-1.542, 53.798) -> Harehills / Chapeltown / Roundhay (-1.500, 53.828)
  const lonMin = -1.556;
  const lonMax = -1.492;
  const latMin = 53.790;
  const latMax = 53.830;

  const panels = [
    {
      tag: '1. 1930s–40s TRAM NETWORK',
      tagColor: '#7000ff',
      bg: '#f5f2ff',
      title: 'Dense electric streetcar spine',
      sub: 'Chapeltown & Roundhay trams + pre-1945 spur note',
      timeStat: '11 min',
      timeSub: 'Median to Briggate · 19 LSOAs (7–21m)',
      footPill: 'Spur to Reginald Terr shut pre-1945',
      mode: 'hist' as const,
    },
    {
      tag: '2. TODAY · 2026 MIXED BUSES',
      tagColor: '#e11d48',
      bg: '#f4f4f6',
      title: 'Congested kerbside bus crawl',
      sub: '~45% no-car households reliant on mixed road traffic',
      timeStat: '25 min',
      timeSub: 'Median to Briggate · 19 LSOAs (19–32m)',
      footPill: 'Shrinks reachable metro jobs',
      mode: 'mod' as const,
    },
    {
      tag: '3. COUNTERFACTUAL · ILLUSTRATIVE',
      tagColor: '#009e86',
      bg: '#eefbf8',
      title: 'Retained & modernised light rail',
      sub: 'Segregated LRT + completed Harehills cross-link',
      timeStat: '≤ 11 min?',
      timeSub: 'Not yet modelled · next research step',
      footPill: 'Run modern LRT GTFS through RAPTOR',
      mode: 'lrt' as const,
    },
  ];

  panels.forEach((p, idx) => {
    const px = stageX + idx * (panelW + gap);
    slideCard(ctx, px, stageY, panelW, stageH, p.bg, 22);

    ctx.save();
    ctx.fillStyle = p.tagColor;
    ctx.font = '700 12.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(p.tag, px + 26, stageY + 38);

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(p.title, px + 26, stageY + 70);

    ctx.fillStyle = '#475569';
    ctx.font = '400 14.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(p.sub, px + 26, stageY + 95);

    // Map viewport inside card
    const mapX = px + 22;
    const mapY = stageY + 118;
    const mapW = panelW - 44;
    const mapH = stageH - 304;

    slideCard(ctx, mapX, mapY, mapW, mapH, '#ffffff', 16);

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 16);
    ctx.clip();

    const proj = (lon: number, lat: number): [number, number] => [
      mapX + 20 + ((lon - lonMin) / (lonMax - lonMin)) * (mapW - 40),
      mapY + mapH - 20 - ((lat - latMin) / (latMax - latMin)) * (mapH - 40),
    ];

    // Subtle map grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let g = 1; g <= 3; g++) {
      ctx.beginPath();
      ctx.moveTo(mapX + (mapW * g) / 4, mapY);
      ctx.lineTo(mapX + (mapW * g) / 4, mapY + mapH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mapX, mapY + (mapH * g) / 4);
      ctx.lineTo(mapX + mapW, mapY + (mapH * g) / 4);
      ctx.stroke();
    }

    // Real Leeds LSOA population dots inside NE corridor
    if (leedsCity) {
      leedsCity.lsoas.forEach((d) => {
        const [lon, lat, , , , underserved] = d;
        if (lon < lonMin || lon > lonMax || lat < latMin || lat > latMax) return;
        const [dx, dy] = proj(lon, lat);
        ctx.fillStyle =
          p.mode === 'mod' && underserved
            ? 'rgba(225, 29, 72, 0.55)'
            : p.mode === 'lrt'
              ? 'rgba(0, 168, 143, 0.38)'
              : 'rgba(112, 0, 255, 0.30)';
        ctx.beginPath();
        ctx.arc(dx, dy, p.mode === 'mod' && underserved ? 4.2 : 3.4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Key NE Leeds coordinates
    const briggate = proj(-1.5419, 53.7976);
    const sheepscar = proj(-1.5345, 53.8085);
    const chapeltown = proj(-1.5335, 53.8225);
    const reginaldTerr = proj(-1.5225, 53.8195);
    const stJames = proj(-1.5220, 53.8068);
    const harehills = proj(-1.5115, 53.8125);
    const roundhay = proj(-1.5015, 53.8255);

    const drawCorridor = (pts: [number, number][], color: string, width: number, dash: number[] = []) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash(dash);
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.restore();
    };

    if (p.mode === 'hist') {
      // Chapeltown Rd & Roundhay Rd active trams
      drawCorridor([briggate, sheepscar, chapeltown], '#7000ff', 4.2);
      drawCorridor([briggate, sheepscar, harehills, roundhay], '#7000ff', 4.2);
      drawCorridor([briggate, stJames, harehills], '#7000ff', 3.4);
      // Pre-1945 disused Harehills Ave / Reginald Terrace spur
      drawCorridor([chapeltown, reginaldTerr, harehills], '#d97706', 2.8, [5, 5]);
    } else if (p.mode === 'mod') {
      // Slow congested mixed-traffic bus roads
      drawCorridor([briggate, sheepscar, chapeltown], '#e11d48', 3.0, [3, 6]);
      drawCorridor([briggate, sheepscar, harehills, roundhay], '#e11d48', 3.0, [3, 6]);
      drawCorridor([briggate, stJames, harehills], '#94a3b8', 2.4, [3, 6]);
    } else {
      // Counterfactual modernised segregated LRT + completed orbital link
      drawCorridor([briggate, sheepscar, chapeltown], '#00a88f', 4.6);
      drawCorridor([briggate, stJames, harehills, roundhay], '#00a88f', 4.6);
      drawCorridor([chapeltown, reginaldTerr, harehills], '#7000ff', 3.6);
    }

    // Node pins & labels inside map
    const mapNodes: Array<{ pt: [number, number]; name: string; align?: CanvasTextAlign; dy?: number }> = [
      { pt: briggate, name: 'Briggate (Jobs)', align: 'left', dy: 16 },
      { pt: stJames, name: 'St James’s Hosp', align: 'left', dy: 15 },
      { pt: harehills, name: 'Harehills', align: 'left', dy: -10 },
      { pt: chapeltown, name: 'Chapeltown Rd', align: 'right', dy: -10 },
    ];
    if (p.mode === 'hist') {
      mapNodes.push({ pt: reginaldTerr, name: 'Spur (pre-1945)', align: 'left', dy: -10 });
    }

    mapNodes.forEach((n) => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = p.tagColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(n.pt[0], n.pt[1], 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 12.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = n.align || 'left';
      ctx.fillText(n.name, n.pt[0] + (n.align === 'right' ? -8 : 8), n.pt[1] + (n.dy || -8));
    });

    ctx.restore(); // end map clip

    // Bottom stat block inside each triptych card
    const statY = mapY + mapH + 48;
    ctx.fillStyle = p.tagColor;
    ctx.font = '600 40px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.globalAlpha = 0.4 + 0.6 * prog;
    ctx.fillText(p.timeStat, px + 26, statY);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '500 15.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(p.timeSub, px + 26, statY + 26);

    drawPill(
      ctx,
      px + 26,
      stageY + stageH - 56,
      p.footPill,
      '#ffffff',
      p.tagColor,
      '600 13.5px "Plus Jakarta Sans", sans-serif',
      16,
      36
    );
    ctx.restore();
  });
}

// ============================================================================
// BOOKEND · WHAT IF THE NORTH WORKED LIKE ONE BIG POLYCENTRIC CITY? (8.3M)
// ============================================================================
function renderPolycentricNorthStage(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const prog = olmoEase(clamp(slideElapsed / 1.0, 0, 1));

  const gap = 22;
  const gridH = stageH * 0.75;
  const barH = stageH - gridH - gap;
  const cardW = (stageW - gap) * 0.5;
  const cardH = (gridH - gap) * 0.5;

  const cities = [
    {
      x: stageX,
      y: stageY,
      bg: '#fff2e8',
      name: 'Liverpool City Region',
      pop: '1.6M',
      role: 'GLOBAL GATEWAY & BIOTECH',
      clusters: 'Life sciences, vaccine R&D, maritime logistics, advanced manufacturing & creative industries',
      linkEx: 'Biotech firms recruit directly from Leeds & Manchester talent pool',
    },
    {
      x: stageX + cardW + gap,
      y: stageY,
      bg: '#fff2e8',
      name: 'West Yorkshire (Leeds)',
      pop: '2.4M',
      role: 'FINANCE, DATA & HEALTHCARE',
      clusters: 'Financial & legal services, NHS digital/health tech, data analytics & universities',
      linkEx: 'Capital, legal & data services scale across all four city cores',
    },
    {
      x: stageX,
      y: stageY + cardH + gap,
      bg: '#fff2e8',
      name: 'Greater Manchester',
      pop: '2.9M',
      role: 'AI, DIGITAL & LIFE SCIENCES',
      clusters: 'AI & software, media, graphene/materials, life sciences & two major research universities',
      linkEx: 'Manchester AI startups prototype hardware at Sheffield AMRC',
    },
    {
      x: stageX + cardW + gap,
      y: stageY + cardH + gap,
      bg: '#fff2e8',
      name: 'South Yorkshire (Sheffield)',
      pop: '1.4M',
      role: 'MATERIALS & PRECISION ENG',
      clusters: 'Advanced manufacturing (AMRC), metallurgy, clean-energy engineering & translational research',
      linkEx: 'Researchers collaborate daily with Manchester & Leeds labs',
    },
  ];

  cities.forEach((c) => {
    slideCard(ctx, c.x, c.y, cardW, cardH, c.bg, 20);
    ctx.save();

    ctx.fillStyle = '#7c2d12';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(c.role, c.x + 30, c.y + 38);

    ctx.fillStyle = '#0284c7';
    ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(c.pop, c.x + cardW - 30, c.y + 52);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(c.name, c.x + 30, c.y + 74);

    ctx.fillStyle = '#475569';
    ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, c.clusters, c.x + 30, c.y + 108, cardW - 60, 22);

    drawPill(
      ctx,
      c.x + 30,
      c.y + cardH - 54,
      `↔ ${c.linkEx}`,
      '#fffbf7',
      '#0f172a',
      '600 13px "Plus Jakarta Sans", sans-serif',
      14,
      32
    );
    ctx.restore();
  });

  // Central Interlocking Polycentric Hub Badge
  const hubCx = stageX + stageW * 0.5;
  const hubCy = stageY + gridH * 0.5;
  ctx.save();
  ctx.globalAlpha = prog;
  drawPill(
    ctx,
    hubCx - 180,
    hubCy - 22,
    '8.3M SHARED LABOUR MARKET · RHINE-RUHR SCALE',
    '#fed7aa',
    '#9a3412',
    '700 12px "JetBrains Mono", monospace',
    18,
    44
  );
  ctx.restore();

  // Bottom 3-Ingredient Policy Strip (Transit + Intercity + R&D/Devolution)
  const botY = stageY + gridH + gap;
  slideCard(ctx, stageX, botY, stageW, barH, '#fff2e8', 20);

  const ingredients = [
    {
      num: '1 · WITHIN CITIES',
      title: 'Segregated urban light rail',
      sub: 'Reconnect suburbs like Harehills to city centres inside 20–30 min',
      color: '#0d9488',
    },
    {
      num: '2 · BETWEEN CITIES',
      title: 'Northern Powerhouse Rail',
      sub: 'Fast, high-capacity Liverpool–Manchester–Leeds–Sheffield rail spine',
      color: '#0284c7',
    },
    {
      num: '3 · BEYOND TRANSPORT',
      title: 'Public R&D & fiscal devolution',
      sub: 'Match business innovation with regional R&D & local decision-making',
      color: '#7c2d12',
    },
  ];

  const iGap = 20;
  const iW = (stageW - 56 - iGap * 2) / 3;
  ingredients.forEach((ing, idx) => {
    const ix = stageX + 28 + idx * (iW + iGap);
    const iy = botY + 18;
    const ih = barH - 36;
    slideCard(ctx, ix, iy, iW, ih, '#fffbf7', 14);

    ctx.save();
    ctx.fillStyle = ing.color;
    ctx.font = '700 11.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(ing.num, ix + 20, iy + 28);

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(ing.title, ix + 20, iy + 56);

    ctx.fillStyle = '#475569';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    wrapCanvasText(ctx, ing.sub, ix + 20, iy + 80, iW - 40, 19);
    ctx.restore();
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
  }
}
