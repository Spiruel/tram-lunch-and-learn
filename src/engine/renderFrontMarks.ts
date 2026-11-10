import { CityData, OverviewData, RouteInfo } from '../types';
import { clamp, olmoEase, smoothstep, ViewportTransform } from './math';

export interface FrontMarksParams {
  ctx: CanvasRenderingContext2D;
  vt: ViewportTransform;
  scene: string;
  overview: OverviewData;
  city: CityData | null;
  slideElapsed: number;
  hoveredRoute: RouteInfo | null;
  mousePos: { x: number; y: number } | null;
}

export function renderFrontMarks(params: FrontMarksParams) {
  const { ctx, vt, scene, overview, city, slideElapsed } = params;
  const { stageX, stageY, stageW, stageH } = vt;

  const spanKm = stageH / vt.kmToPx(1);
  const macroWeight = smoothstep(65, 175, spanKm);

  if (
    scene === 'agglomeration-theory' ||
    scene === 'centre-for-cities' ||
    scene === 'netherlands-backtest' ||
    scene === 'productivity-chart' ||
    scene === 'crich-desk' ||
    scene === 'surya-bands' ||
    scene === 'surya-ocr' ||
    scene === 'track-interp' ||
    scene === 'gtfs-stack' ||
    scene === 'trans-pennine-expanse' ||
    scene === 'tramway-conspiracy' ||
    scene === 'five-city-scoreboard' ||
    scene === 'two-speed-curves' ||
    scene === 'northern-megacity'
  ) {
    return;
  }

  // 1. Macro UK City Pins + Ratios (uk-archive-orbit, etc.)
  if (macroWeight > 0.15) {
    ctx.save();
    ctx.globalAlpha = macroWeight;

    const offsets: Record<string, [number, number]> = {
      leeds: [30, -20],
      liverpool: [-32, -16],
      manchester: [32, 6],
      sheffield: [32, 22],
      birmingham: [30, 14],
    };

    overview.cities.forEach((oc, idx) => {
      const p = olmoEase(clamp((slideElapsed - idx * 0.08) / 0.7, 0, 1));
      if (p <= 0.02) return;

      const [cx, cy] = vt.project(oc.centre.lon, oc.centre.lat);
      const [ox, oy] = offsets[oc.slug] || [24, -10];
      const lx = cx + ox;
      const ly = cy + oy;
      const isLeft = ox < 0;

      ctx.save();
      ctx.globalAlpha *= p;

      ctx.fillStyle = '#7000ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 5.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      const h30 = oc.populationCurve.historical['30'] || 1;
      const m30 = oc.populationCurve.modern['30'] || 1;
      const ratio = (h30 / m30).toFixed(2) + '×';
      const label = `${oc.displayName} (${oc.historicalYear})`;

      ctx.font = '600 13.5px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(label).width + 82;
      const rawBoxX = isLeft ? lx - tw : lx;
      const boxX = clamp(rawBoxX, stageX + 14, stageX + stageW - tw - 14);
      const clampedLy = clamp(ly, stageY + 24, stageY + stageH - 24);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(boxX, clampedLy - 16, tw, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0a0a0a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, boxX + 14, clampedLy + 0.5);

      ctx.fillStyle = '#7000ff';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ratio, boxX + tw - 14, clampedLy + 0.5);

      ctx.restore();
    });

    if (scene === 'uk-archive-orbit') {
      const [ox, oy] = vt.project(-1.486, 53.09);
      const pillW = 216;
      const px = clamp(ox + 16, stageX + 14, stageX + stageW - pillW - 14);
      const py = clamp(oy, stageY + 24, stageY + stageH - 24);
      ctx.fillStyle = '#7000ff';
      ctx.beginPath();
      ctx.roundRect(px, py - 16, pillW, 32, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ Crich Tramway Archive', px + pillW * 0.5, py + 0.5);
    }

    ctx.restore();
  }

  // 2. City Centre Target & Underserved Neighbourhood Convex Hulls
  if (city && macroWeight < 0.5) {
    const [cx, cy] = vt.project(city.centre.lon, city.centre.lat);

    ctx.save();
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7000ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (scene === 'city-underserved' || scene === 'leeds-stress') {
      const placedRects: Array<{ x: number; y: number; w: number; h: number }> = [];
      if (scene === 'leeds-stress') {
        const stressW = Math.min(stageW * 0.44, 460);
        placedRects.push({
          x: stageX + stageW - stressW - 28,
          y: stageY + stageH - 264 - 28,
          w: stressW + 12,
          h: 276,
        });
      }

      city.underservedClusters.forEach((cl, idx) => {
        const p = olmoEase(clamp((slideElapsed - 0.16 * idx) / 0.7, 0, 1));
        if (p <= 0.02) return;

        ctx.save();
        ctx.globalAlpha = p;

        if (cl.hull.length >= 3) {
          ctx.beginPath();
          cl.hull.forEach(([lon, lat], i) => {
            const [hx, hy] = vt.project(lon, lat);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(225, 29, 72, 0.13)';
          ctx.fill();
          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }

        const [ax, ay] = vt.project(cl.center[0], cl.center[1]);
        const dirX = ax >= cx ? 1 : -1;
        const dirY = ay >= cy ? 1 : -1;
        const lx = ax + dirX * 28;
        const baseLy = ay + dirY * 18;

        const tagText = `${cl.name} · −${cl.worseBy.toFixed(0)}m`;
        ctx.font = '600 13.5px "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(tagText).width + 26;
        const bx = clamp(dirX > 0 ? lx : lx - tw, stageX + 16, stageX + stageW - tw - 16);

        const stepY = dirY * 36;
        const candidateOffsets = [0, stepY, -stepY, stepY * 2, -stepY * 2, stepY * 3];
        let ly = clamp(baseLy, stageY + 26, stageY + stageH - 26);
        for (const dy of candidateOffsets) {
          const testLy = clamp(baseLy + dy, stageY + 26, stageY + stageH - 26);
          const collides = placedRects.some(
            (r) =>
              bx < r.x + r.w + 8 &&
              bx + tw + 8 > r.x &&
              testLy - 16 < r.y + r.h + 8 &&
              testLy + 16 + 8 > r.y
          );
          if (!collides) {
            ly = testLy;
            break;
          }
        }
        placedRects.push({ x: bx, y: ly - 16, w: tw, h: 32 });

        const targetX = ax < bx ? bx : ax > bx + tw ? bx + tw : bx + tw * 0.5;
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(targetX, ly);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(bx, ly - 16, tw, 32, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#be123c';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagText, bx + 13, ly + 0.5);
        ctx.restore();
      });
    }
  }
}
