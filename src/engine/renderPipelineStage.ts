import { CityData } from '../types';
import { clamp, lerp, olmoEase, ViewportTransform } from './math';

export interface PipelineRenderParams {
  ctx: CanvasRenderingContext2D;
  vt: ViewportTransform;
  scene: string;
  slideElapsed: number;
  globalTime: number;
  scanImg: HTMLImageElement | null;
  leedsCity: CityData | null;
  alpha: number;
  subStep?: number;
}

export function renderPipelineStage(params: PipelineRenderParams) {
  const { ctx, vt, scene, slideElapsed, globalTime, scanImg, leedsCity, alpha, subStep = 0 } = params;
  if (alpha <= 0.005) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (scene === 'crich-desk') {
    renderCrichDesk(ctx, vt, scanImg, slideElapsed, globalTime, subStep);
  } else if (scene === 'surya-bands') {
    renderSuryaBands(ctx, vt, scanImg, slideElapsed, globalTime);
  } else if (scene === 'surya-ocr') {
    renderSuryaOcrValidation(ctx, vt, scanImg, slideElapsed, globalTime);
  } else if (scene === 'track-interp') {
    renderTrackInterpolation(ctx, vt, leedsCity, slideElapsed, globalTime);
  } else if (scene === 'gtfs-stack') {
    renderGtfsRelationalStack(ctx, vt, slideElapsed, globalTime);
  }

  ctx.restore();
}

function drawSlideSurface(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = '#f6f6f8',
  borderStroke?: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (borderStroke) {
    ctx.strokeStyle = borderStroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();
}

function renderCrichDesk(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  scanImg: HTMLImageElement | null,
  slideElapsed: number,
  globalTime: number,
  subStep: number = 0
) {
  const { stageX, stageY, stageW, stageH } = vt;
  drawSlideSurface(ctx, stageX, stageY, stageW, stageH, 22, 'rgba(255, 255, 255, 0.94)', '#e5e7eb');

  const centerX = stageX + stageW * 0.5;
  const centerY = stageY + stageH * 0.5;
  const entry = olmoEase(clamp(slideElapsed / 1.0, 0, 1));

  if (!scanImg || !scanImg.complete || scanImg.naturalWidth === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Loading archival scan…', centerX, centerY);
    return;
  }

  const aspect = scanImg.naturalWidth / scanImg.naturalHeight;
  const calloutW = 316;
  const calloutGap = 28;
  const fitsRight = stageW >= 760;
  // If subStep === 0, center the photo in the stage; if subStep >= 1, shift left for callouts
  const showCallouts = subStep >= 1;
  const totalGroupW = fitsRight && showCallouts ? (stageH - 56) * aspect + calloutGap + calloutW : (stageH - 56) * aspect;
  const availImgW = fitsRight && showCallouts ? stageW - calloutW - calloutGap - 64 : stageW - 48;
  const maxImgH = stageH - 56;
  const fitH = Math.min(maxImgH, availImgW / aspect);
  const imgH = fitH * (0.95 + 0.05 * entry);
  const imgW = imgH * aspect;
  const imgX = stageX + Math.max(24, (stageW - (fitsRight && showCallouts ? imgW + calloutGap + calloutW : imgW)) * 0.5);
  const imgY = centerY - imgH * 0.5;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 12;
  ctx.drawImage(scanImg, imgX, imgY, imgW, imgH);
  ctx.restore();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(imgX, imgY, imgW, imgH);

  // If subStep === 0, show a small hint pill at bottom right of desk
  if (!showCallouts) {
    ctx.save();
    ctx.fillStyle = '#7000ff';
    ctx.beginPath();
    ctx.roundRect(imgX + imgW - 220, imgY + imgH - 42, 210, 32, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press Next to annotate ➔', imgX + imgW - 115, imgY + imgH - 21);
    ctx.restore();
    return;
  }

  const callouts = [
    {
      rx: 0.19,
      ry: 0.042,
      rw: 0.73,
      rh: 0.062,
      cardY: imgY + 24,
      label: '20-column brass rules',
      sub: 'Spanning headers cause row drift',
      color: '#7000ff',
      delay: 0.2,
    },
    {
      rx: 0.355,
      ry: 0.048,
      rw: 0.055,
      rh: 0.056,
      cardY: imgY + 118,
      label: 'Fractional “7½ min” headways',
      sub: 'Clock times mixed with intervals',
      color: '#00a88f',
      delay: 0.42,
    },
    {
      rx: 0.05,
      ry: 0.052,
      rw: 0.14,
      rh: 0.055,
      cardY: imgY + 212,
      label: 'Ditto marks (“,,”) & codes',
      sub: 'Only 5 timing anchors printed',
      color: '#e11d48',
      delay: 0.64,
    },
    {
      rx: 0.62,
      ry: 0.575,
      rw: 0.31,
      rh: 0.032,
      cardY: imgY + imgH * 0.55,
      label: 'Spelling drift across pages',
      sub: '“TEMPLENEWSAM” vs “Temple Newsam”',
      color: '#7000ff',
      delay: 0.86,
    },
  ];

  const labelColumnX = imgX + imgW + calloutGap;

  callouts.forEach((c) => {
    const p = olmoEase(clamp((slideElapsed - c.delay) / 0.6, 0, 1));
    if (p <= 0.01) return;

    const bx = imgX + c.rx * imgW;
    const by = imgY + c.ry * imgH;
    const bw = c.rw * imgW;
    const bh = c.rh * imgH;

    ctx.save();
    ctx.globalAlpha *= p;

    ctx.fillStyle = `${c.color}20`;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    if (fitsRight) {
      const cardY = c.cardY;
      const anchorX = bx + bw;
      const anchorY = by + bh * 0.5;
      const elbowX = Math.max(imgX + imgW + 8, lerp(anchorX, labelColumnX, 0.55));

      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(elbowX, cardY + 34);
      ctx.lineTo(labelColumnX - 6, cardY + 34);
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      drawSlideSurface(ctx, labelColumnX, cardY, calloutW, 68, 14, '#ffffff', '#e5e7eb');
      ctx.fillStyle = '#0a0a0a';
      ctx.font = '600 15.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c.label, labelColumnX + 16, cardY + 28);

      ctx.fillStyle = '#64748b';
      ctx.font = '400 13.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(c.sub, labelColumnX + 16, cardY + 50);
    }
    ctx.restore();
  });

  const spineY = imgY + imgH * 0.495 + Math.sin(globalTime * 2) * 0.4;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
  ctx.beginPath();
  ctx.moveTo(imgX - 8, spineY);
  ctx.lineTo(imgX + imgW + 8, spineY);
  ctx.stroke();
  ctx.restore();
}

function renderSuryaBands(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  scanImg: HTMLImageElement | null,
  slideElapsed: number,
  globalTime: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  drawSlideSurface(ctx, stageX, stageY, stageW, stageH, 22, 'rgba(255, 255, 255, 0.94)', '#e5e7eb');
  if (!scanImg || !scanImg.complete || scanImg.naturalWidth === 0) return;

  const entry = olmoEase(clamp(slideElapsed / 0.9, 0, 1));
  const srcW = scanImg.naturalWidth;
  const srcH = scanImg.naturalHeight * 0.49;
  const aspect = srcW / srcH;

  // Preserve exact aspect ratio without stretching
  const maxAvailW = Math.min(stageW - 140, 840);
  const maxAvailH = stageH - 260;
  let dispW = maxAvailW;
  let dispH = dispW / aspect;
  if (dispH > maxAvailH) {
    dispH = maxAvailH;
    dispW = dispH * aspect;
  }
  const dispX = stageX + 90 + Math.max(0, (stageW - 120 - dispW) * 0.5);
  const dispY = stageY + 22;

  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 20;
  ctx.drawImage(scanImg, 0, 0, srcW, srcH, dispX, dispY, dispW, dispH);
  ctx.restore();

  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(dispX, dispY, dispW, dispH);

  const nBands = 5;
  const bandFracH = 0.255;
  const stepFrac = (1 - bandFracH) / (nBands - 1);
  const activeBand = Math.floor((globalTime * 0.75) % nBands);

  for (let b = 0; b < nBands; b++) {
    const bandReveal = olmoEase(clamp((slideElapsed - 0.14 * b) / 0.55, 0, 1));
    if (bandReveal <= 0.01) continue;

    const y0 = dispY + b * stepFrac * dispH;
    const bh = bandFracH * dispH;
    const isActive = b === activeBand;

    ctx.save();
    ctx.globalAlpha *= bandReveal;

    if (b > 0) {
      const prevBottom = dispY + (b - 1) * stepFrac * dispH + bh;
      const overlapH = prevBottom - y0;
      if (overlapH > 0) {
        ctx.fillStyle = 'rgba(112, 0, 255, 0.16)';
        ctx.fillRect(dispX, y0, dispW, overlapH);
      }
    }

    ctx.strokeStyle = isActive ? '#7000ff' : 'rgba(0, 168, 143, 0.55)';
    ctx.lineWidth = isActive ? 2.8 : 1.3;
    ctx.strokeRect(dispX - 3, y0, dispW + 6, bh);

    ctx.fillStyle = isActive ? '#7000ff' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(dispX - 88, y0 + 6, 78, 26, 13);
    ctx.fill();
    if (!isActive) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.fillStyle = isActive ? '#ffffff' : '#475569';
    ctx.font = '600 12.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`band ${b}`, dispX - 49, y0 + 23);
    ctx.restore();
  }

  // Bottom zoomed 3x Lanczos preview strip - preserving exact aspect ratio of active band
  const zoomY = dispY + dispH + 42;
  const zoomAvailH = stageY + stageH - zoomY - 18;
  if (zoomAvailH > 60) {
    const sy = activeBand * stepFrac * srcH;
    const sh = bandFracH * srcH;
    const bandAspect = srcW / sh;
    const previewH = Math.min(zoomAvailH - 42, dispW / bandAspect);
    const boxH = previewH + 42;

    ctx.save();
    ctx.globalAlpha *= entry;
    drawSlideSurface(ctx, dispX - 16, zoomY - 28, dispW + 32, boxH, 16, '#ffffff', '#7000ff');

    ctx.fillStyle = '#7000ff';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `3× LANCZOS · band_${activeBand}.png · 170px HEIGHT + 40px SEAM OVERLAP`,
      dispX,
      zoomY - 8
    );

    ctx.drawImage(scanImg, 0, sy, srcW, sh, dispX, zoomY + 6, dispW, previewH);

    const scanLineY = zoomY + 6 + ((globalTime * 38) % Math.max(10, previewH));
    ctx.beginPath();
    ctx.moveTo(dispX, scanLineY);
    ctx.lineTo(dispX + dispW, scanLineY);
    ctx.strokeStyle = 'rgba(0, 196, 167, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }
}

function renderSuryaOcrValidation(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  scanImg: HTMLImageElement | null,
  slideElapsed: number,
  globalTime: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const panelX = stageX;
  const panelW = stageW;

  // 1. Top Strip: Active Band with Surya OCR Cell Detection
  const topY = stageY;
  const bandH = Math.min(stageH * 0.32, 216);

  drawSlideSurface(ctx, panelX, topY, panelW, bandH + 34, 20, 'rgba(255, 255, 255, 0.94)', '#e5e7eb');

  ctx.fillStyle = '#7000ff';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(
    'SURYA TABLE DETECTION · 4,096 TOKENS PER SPREAD',
    panelX + 24,
    topY + 24
  );

  if (scanImg && scanImg.complete && scanImg.naturalWidth > 0) {
    const srcW = scanImg.naturalWidth;
    const srcH = 138;
    const srcY = 20;
    const sliceAspect = srcW / srcH;

    const availW = panelW - 48;
    const availH = bandH - 14;
    let drawW = availW;
    let drawH = drawW / sliceAspect;
    if (drawH > availH) {
      drawH = availH;
      drawW = drawH * sliceAspect;
    }
    const drawX = panelX + (panelW - drawW) * 0.5;
    const drawY = topY + 36 + (availH - drawH) * 0.5;

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = 12;
    ctx.drawImage(scanImg, 0, srcY, srcW, srcH, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX, drawY, drawW, drawH);

    const scaleX = drawW / srcW;
    const scaleY = drawH / srcH;

    // Laser-aligned row positions in the crop (y=20 to y=158)
    const rowYs = [38, 48.5, 59, 69.5, 80];
    const rowH = 8.5;

    // Stop-name bounding boxes on left (Cross Gates -> Middleton)
    for (const ry of rowYs) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(
        drawX + 42 * scaleX,
        drawY + ry * scaleY,
        (157 - 42) * scaleX,
        rowH * scaleY
      );
    }

    // Exact columns detected by Surya OCR in this timetable spread
    const cols: Array<[number, number, boolean]> = [
      [161, 186, false],   // 4 40
      [186, 210.5, false], // -
      [210.5, 235, false], // 5 10
      [235, 259.5, false], // 5 20
      [259.5, 284, false], // 5 30
      [284, 320, true],    // then every 7½ mins until
      [320, 344, false],   // 6 53
      [344, 380, true],    // then every 4 mins until
      [380, 405, false],   // 8 13
      [405, 442, true],    // then every 7½ mins until
      [442, 466, false],   // 4 13
      [466, 490, false],   // 4 19
      [490, 514, false],   // 4 23
      [514, 551, true],    // then every 6 mins until
      [551, 576, false],   // 4 59
      [576, 613, true],    // then every 3 mins until
      [613, 638, false],   // 5 56
      [638, 662, false],   // 6 6
      [662, 698, true],    // then every 7½ mins until
      [698, 726, false],   // 10 36
    ];

    const sweep = (globalTime * 0.55) % 1.25;
    for (let c = 0; c < cols.length; c++) {
      const [cStart, cEnd, isHeadway] = cols[c];
      const colFrac = c / cols.length;
      if (colFrac > sweep) continue;
      const isFresh = sweep - colFrac < 0.12;
      const cx = drawX + cStart * scaleX;
      const cw = (cEnd - cStart) * scaleX;

      if (isHeadway) {
        const topRowY = drawY + 38 * scaleY;
        const totalRowsH = (80 + 8.5 - 38) * scaleY;
        ctx.fillStyle = isFresh ? 'rgba(112, 0, 255, 0.28)' : 'rgba(112, 0, 255, 0.14)';
        ctx.strokeStyle = '#7000ff';
        ctx.lineWidth = 1.8;
        ctx.fillRect(cx, topRowY, cw, totalRowsH);
        ctx.strokeRect(cx, topRowY, cw, totalRowsH);
      } else {
        for (const ry of rowYs) {
          const cy = drawY + ry * scaleY;
          const ch = rowH * scaleY;
          ctx.strokeStyle = isFresh ? '#7000ff' : '#0284c7';
          ctx.lineWidth = isFresh ? 1.8 : 1.1;
          ctx.strokeRect(cx, cy, cw, ch);
        }
      }
    }
  }

  // 2. Bottom Split: Structured JSON (Left) + 4 Invariant Checks (Right)
  const botY = topY + bandH + 56;
  const botH = stageY + stageH - botY;
  const gap = 24;
  const colW = (panelW - gap) * 0.5;

  drawSlideSurface(ctx, panelX, botY, colW, botH, 20, '#f4f4f6');
  ctx.fillStyle = '#0a0a0a';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Extracted service pattern', panelX + 26, botY + 38);

  const jsonLines = [
    '{ "route": "Cross Gates — Middleton",',
    '  "stops": [',
    '    "Cross Gates", "Harehills Ln",',
    '    "Kirkgate", "Hunslet", "Middleton"',
    '  ],',
    '  "offsets_min": [0, 10, 15, 21, 33],',
    '  "pattern": [',
    '    { "time": "04:40" },',
    '    { "every_min": 7.5, "until": "06:53" },',
    '    { "every_min": 3.5, "until": "08:13" }',
    '  ]',
    '}',
  ];
  ctx.font = '500 14.5px "JetBrains Mono", monospace';
  jsonLines.forEach((line, idx) => {
    const lineY = botY + 76 + idx * 28;
    if (lineY > botY + botH - 18) return;
    ctx.fillStyle =
      line.includes('every_min') || line.includes('offsets_min') ? '#7000ff' : '#334155';
    ctx.fillText(line, panelX + 26, lineY);
  });

  // Right Card: 4 Fuzzy-Labs-style Check Rows
  const rightX = panelX + colW + gap;
  drawSlideSurface(ctx, rightX, botY, colW, botH, 20, '#f2ecff');
  ctx.fillStyle = '#0a0a0a';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Deterministic domain checks', rightX + 26, botY + 38);

  const checks = [
    { title: 'Stop name canonicaliser', detail: 'TEMPLENEWSAM → Temple Newsam', delay: 0.18 },
    { title: 'Frequency block expansion', detail: 'Expands “every 3½ mins” to exact trips', delay: 0.36 },
    { title: 'Monotonic offset assertion', detail: '0 → 10 → 15 → 21 → 33 min strictly rising', delay: 0.54 },
    { title: 'First & last car gap check', detail: 'No missing departures > 65 min', delay: 0.72 },
  ];

  const availCheckH = botH - 72;
  const rowStep = availCheckH / 4;

  checks.forEach((chk, i) => {
    const p = olmoEase(clamp((slideElapsed - chk.delay) / 0.55, 0, 1));
    if (p <= 0.01) return;
    const cy = botY + 62 + i * rowStep;

    ctx.save();
    ctx.globalAlpha *= p;
    drawSlideSurface(ctx, rightX + 20, cy, colW - 40, rowStep - 12, 14, '#ffffff');

    ctx.fillStyle = '#009e86';
    ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✓', rightX + 38, cy + 29);

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(chk.title, rightX + 64, cy + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '400 13.5px "JetBrains Mono", monospace';
    ctx.fillText(chk.detail, rightX + 64, cy + 52);
    ctx.restore();
  });
}

function renderTrackInterpolation(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  leedsCity: CityData | null,
  slideElapsed: number,
  globalTime: number
) {
  const xmRoute = leedsCity?.routes.find((r) => r.stem === 'lds_t_XM');
  const coords: [number, number][] =
    xmRoute && xmRoute.coords.length > 6
      ? xmRoute.coords
      : [
          [-1.452, 53.806],
          [-1.482, 53.807],
          [-1.501, 53.809],
          [-1.522, 53.801],
          [-1.541, 53.797],
          [-1.536, 53.782],
          [-1.542, 53.765],
          [-1.549, 53.749],
        ];

  if (leedsCity) {
    ctx.save();
    ctx.beginPath();
    for (const seg of leedsCity.tramLines) {
      for (let i = 0; i < seg.length; i++) {
        const [x, y] = vt.project(seg[i][0], seg[i][1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  coords.forEach(([lon, lat], i) => {
    const [x, y] = vt.project(lon, lat);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(112, 0, 255, 0.24)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = '#7000ff';
  ctx.lineWidth = 3.4;
  ctx.stroke();

  const screenPts = coords.map(([lon, lat]) => vt.project(lon, lat));
  const cumLen = [0];
  for (let i = 1; i < screenPts.length; i++) {
    cumLen.push(
      cumLen[i - 1] +
        Math.hypot(screenPts[i][0] - screenPts[i - 1][0], screenPts[i][1] - screenPts[i - 1][1])
    );
  }
  const totalLen = cumLen[cumLen.length - 1] || 1;

  const sampleAt = (u: number): [number, number] => {
    const target = clamp(u, 0, 1) * totalLen;
    for (let i = 1; i < cumLen.length; i++) {
      if (cumLen[i] >= target) {
        const segLen = cumLen[i] - cumLen[i - 1] || 1;
        const f = (target - cumLen[i - 1]) / segLen;
        return [
          lerp(screenPts[i - 1][0], screenPts[i][0], f),
          lerp(screenPts[i - 1][1], screenPts[i][1], f),
        ];
      }
    }
    return screenPts[screenPts.length - 1];
  };

  const interpProgress = olmoEase(clamp((slideElapsed - 0.3) / 1.7, 0, 1));
  const nInterp = 32;
  for (let k = 0; k <= nInterp; k++) {
    const u = k / nInterp;
    if (u > interpProgress) continue;
    const [sx, sy] = sampleAt(u);
    ctx.fillStyle = '#00a88f';
    ctx.beginPath();
    ctx.arc(sx, sy, 3.8, 0, Math.PI * 2);
    ctx.fill();

    if (Math.abs(u - 0.5) < 0.06) {
      const pulse = 12 + 3 * Math.sin(globalTime * 3);
      ctx.strokeStyle = 'rgba(0, 168, 143, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const anchors = [
    { u: 0.0, name: 'Cross Gates', min: '+0m', side: -1, dy: -42 },
    { u: 0.28, name: 'Harehills Ln', min: '+10m', side: -1, dy: -44 },
    { u: 0.5, name: 'Kirkgate Hub', min: '+15m', side: 1, dy: 10 },
    { u: 0.68, name: 'Hunslet Rd', min: '+21m', side: 1, dy: 8 },
    { u: 1.0, name: 'Middleton', min: '+33m', side: 1, dy: 6 },
  ];

  const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];

  anchors.forEach((a) => {
    const [ax, ay] = sampleAt(a.u);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7000ff';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(ax, ay, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    const nameW = ctx.measureText(a.name).width;
    ctx.font = '600 13px "JetBrains Mono", monospace';
    const minW = ctx.measureText(a.min).width;
    const tagW = Math.ceil(Math.max(176, nameW + minW + 38));

    const rawBoxX = a.side > 0 ? ax + 24 : ax - 24 - tagW;
    const boxX = clamp(rawBoxX, vt.stageX + 20, vt.stageX + vt.stageW - tagW - 20);
    let ly = clamp(ay + a.dy, vt.stageY + 34, vt.stageY + vt.stageH - 34);

    for (let attempt = 0; attempt < 4; attempt++) {
      const hit = placedBoxes.some(
        (b) =>
          boxX < b.x + b.w + 8 &&
          boxX + tagW + 8 > b.x &&
          ly - 18 < b.y + b.h + 6 &&
          ly + 18 + 6 > b.y
      );
      if (!hit) break;
      ly += a.dy < 0 ? -38 : 38;
    }
    placedBoxes.push({ x: boxX, y: ly - 18, w: tagW, h: 36 });

    const leaderTargetX = ax < boxX ? boxX : ax > boxX + tagW ? boxX + tagW : boxX + tagW * 0.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(leaderTargetX, ly);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    drawSlideSurface(ctx, boxX, ly - 18, tagW, 36, 18, '#ffffff', '#e2e8f0');
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(a.name, boxX + 14, ly + 5);

    ctx.fillStyle = '#7000ff';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(a.min, boxX + tagW - 14, ly + 5);
  });

  ctx.restore();
}

function renderGtfsRelationalStack(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  slideElapsed: number,
  _globalTime: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  drawSlideSurface(ctx, stageX, stageY, stageW, stageH, 22, '#f6f6f8');

  const cx = stageX + stageW * 0.5;
  const cy = stageY + stageH * 0.5;
  const fan = olmoEase(clamp(slideElapsed / 1.2, 0, 1));

  const nodes = [
    { id: 'agency.txt', pk: 'agency_id', stat: '1 agency', sample: 'LCT · Leeds 1957', rx: -0.27, ry: -0.35, color: '#7000ff' },
    { id: 'calendar.txt', pk: 'service_id', stat: '3 schedules', sample: 'weekday · sat · sun', rx: 0.27, ry: -0.35, color: '#00a88f' },
    { id: 'routes.txt', pk: 'route_id', stat: '65 routes', sample: 'tram + bus lines', rx: -0.27, ry: -0.11, color: '#7000ff' },
    { id: 'shapes.txt', pk: 'shape_id', stat: '79 tracks', sample: 'surveyed OS KMZ', rx: 0.27, ry: -0.11, color: '#00a88f' },
    { id: 'trips.txt', pk: 'trip_id', stat: '8,651 trips', sample: 'expanded departures', rx: 0.0, ry: 0.13, color: '#7000ff' },
    { id: 'stops.txt', pk: 'stop_id', stat: '1,257 stops', sample: '300m spatial index', rx: 0.27, ry: 0.36, color: '#00a88f' },
    { id: 'stop_times.txt', pk: 'trip_id + seq', stat: '241k rows', sample: '08:07:30 · Kirkgate', rx: -0.27, ry: 0.36, color: '#7000ff' },
  ];

  const cardW = Math.min(stageW * 0.38, 336);
  const cardH = 102;
  const spanX = Math.min(stageW * 0.88, 820);
  const spanY = Math.min(stageH * 0.84, 650);

  const posOf = (n: (typeof nodes)[number]) => ({
    x: cx + n.rx * spanX * (0.25 + 0.75 * fan) - cardW * 0.5,
    y: cy + n.ry * spanY * (0.15 + 0.85 * fan) - cardH * 0.5,
  });

  const edges: [number, number, string, string][] = [
    [0, 2, 'agency_id', '#7000ff'],
    [2, 4, 'route_id', '#7000ff'],
    [1, 4, 'service_id', '#00a88f'],
    [3, 4, 'shape_id', '#00a88f'],
    [4, 6, 'trip_id', '#7000ff'],
    [5, 6, 'stop_id', '#00a88f'],
  ];

  edges.forEach(([fi, ti, keyName, col]) => {
    const p1 = posOf(nodes[fi]);
    const p2 = posOf(nodes[ti]);
    const isHoriz = fi === 5 && ti === 6;

    const x1 = isHoriz ? p1.x : p1.x + cardW * 0.5;
    const y1 = isHoriz ? p1.y + cardH * 0.5 : p1.y + cardH;
    const x2 = isHoriz ? p2.x + cardW : p2.x + cardW * 0.5;
    const y2 = isHoriz ? p2.y + cardH * 0.5 : p2.y;
    const midY = (y1 + y2) * 0.5;

    ctx.save();
    ctx.strokeStyle = `${col}55`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    if (isHoriz) ctx.lineTo(x2, y2);
    else ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
    ctx.stroke();

    if (fan > 0.7) {
      const lx = (x1 + x2) * 0.5;
      const ly = midY;
      ctx.font = '600 12.5px "JetBrains Mono", monospace';
      const kw = ctx.measureText(keyName).width + 20;
      drawSlideSurface(ctx, lx - kw * 0.5, ly - 12, kw, 24, 12, '#ffffff', '#e2e8f0');
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.fillText(keyName, lx, ly + 4);
    }
    ctx.restore();
  });

  nodes.forEach((n) => {
    const { x, y } = posOf(n);
    ctx.save();
    drawSlideSurface(ctx, x, y, cardW, cardH, 16, '#ffffff', '#e5e7eb');

    ctx.fillStyle = n.color;
    ctx.font = '700 15.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(n.id, x + 16, y + 28);

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(n.stat, x + cardW - 16, y + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PK: ${n.pk}`, x + 16, y + 56);

    ctx.fillStyle = '#1e293b';
    ctx.font = '400 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(n.sample, x + 16, y + 82);
    ctx.restore();
  });
}
