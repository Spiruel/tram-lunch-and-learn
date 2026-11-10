import { CityData, GeoShape, OverviewData, RouteInfo } from '../types';
import { clamp, olmoEase, smoothstep, ViewportTransform } from './math';
import { drawFtSourceFootnote } from './renderChartsStage';

export interface MapRenderParams {
  ctx: CanvasRenderingContext2D;
  vt: ViewportTransform;
  overview: OverviewData;
  city: CityData | null;
  citiesBySlug?: Record<string, CityData>;
  scene: string;
  slideElapsed: number; // seconds since arriving/triggering current slide
  globalTime: number; // continuous clock in seconds
  wipePos: number; // legacy param, now unused
  hoveredRoute: RouteInfo | null;
  alpha: number;
  satelliteImg?: HTMLImageElement | null;
  nightSatelliteImg?: HTMLImageElement | null;
}

function traceRing(ctx: CanvasRenderingContext2D, ring: [number, number][], vt: ViewportTransform) {
  if (!ring || ring.length < 2) return;
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = vt.project(ring[i][0], ring[i][1]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}


function traceGeoShapes(ctx: CanvasRenderingContext2D, shapes: GeoShape[] | undefined, vt: ViewportTransform) {
  if (!shapes || shapes.length === 0) return;
  ctx.beginPath();
  for (const sh of shapes) {
    if (!sh) continue;
    if (sh.type === 'Polygon') {
      for (const ring of sh.coordinates) {
        traceRing(ctx, ring, vt);
        ctx.closePath();
      }
    } else if (sh.type === 'MultiPolygon') {
      for (const poly of sh.coordinates) {
        for (const ring of poly) {
          traceRing(ctx, ring, vt);
          ctx.closePath();
        }
      }
    } else if (sh.type === 'LineString') {
      traceRing(ctx, sh.coordinates, vt);
    } else if (sh.type === 'MultiLineString') {
      for (const line of sh.coordinates) {
        traceRing(ctx, line, vt);
      }
    }
  }
}

// ============================================================================
// SURVEYED REGIONAL TRAMWAY NETWORK CONNECTORS (KMZ INTERURBAN SKELETON)
// Linking Liverpool, Manchester, Leeds, Sheffield, and Birmingham
// ============================================================================
export const TP_CORRIDOR_EAST: [number, number][] = [
  [-1.5419, 53.7976], // Leeds Briggate
  [-1.612, 53.805],  // Armley / Bramley
  [-1.675, 53.802],  // Stanningley
  [-1.753, 53.793],  // Bradford Town Hall
  [-1.815, 53.760],  // Queensbury / Shelf
  [-1.860, 53.725],  // Halifax
  [-1.908, 53.710],  // Sowerby Bridge
  [-1.975, 53.730],  // Mytholmroyd
  [-2.012, 53.742],  // Hebden Bridge
  [-2.098, 53.714],  // Todmorden
];

export const TP_GAP_START: [number, number] = [-2.098, 53.714]; // Todmorden
export const TP_GAP_END: [number, number] = [-2.095, 53.642];   // Littleborough

export const TP_CORRIDOR_WEST: [number, number][] = [
  [-2.095, 53.642], // Littleborough
  [-2.158, 53.615], // Rochdale
  [-2.140, 53.570], // Castleton
  [-2.115, 53.541], // Oldham
  [-2.160, 53.510], // Failsworth
  [-2.237, 53.481], // Manchester Piccadilly
  [-2.270, 53.485], // Salford
  [-2.335, 53.484], // Eccles
  [-2.520, 53.460], // Leigh
  [-2.735, 53.452], // St Helens
  [-2.805, 53.430], // Prescot
  [-2.890, 53.420], // Knotty Ash
  [-2.996, 53.405], // Liverpool Pier Head
];

export const SLT_LIVERPOOL_MANCHESTER: [number, number][] = [
  [-2.996, 53.405], // Liverpool Pier Head
  [-2.945, 53.412], // Edge Hill
  [-2.890, 53.420], // Knotty Ash
  [-2.805, 53.430], // Prescot
  [-2.735, 53.452], // St Helens
  [-2.685, 53.468], // Haydock
  [-2.635, 53.485], // Ashton-in-Makerfield
  [-2.585, 53.498], // Hindley
  [-2.520, 53.518], // Atherton
  [-2.520, 53.460], // Leigh
  [-2.465, 53.505], // Tyldesley
  [-2.415, 53.500], // Boothstown
  [-2.385, 53.495], // Worsley
  [-2.340, 53.505], // Swinton
  [-2.290, 53.490], // Pendleton
  [-2.270, 53.485], // Salford
  [-2.237, 53.481], // Manchester Piccadilly
];

export const LANCASHIRE_NORTH_CHAIN: [number, number][] = [
  [-2.735, 53.452], // St Helens
  [-2.685, 53.490], // Garswood
  [-2.632, 53.545], // Wigan Wallgate
  [-2.585, 53.540], // Ince
  [-2.520, 53.550], // Westhoughton
  [-2.428, 53.578], // Bolton Town Hall
  [-2.360, 53.585], // Ainsworth
  [-2.298, 53.593], // Bury Market
  [-2.220, 53.590], // Heywood
  [-2.158, 53.615], // Rochdale
];

export const BOLTON_SALFORD_CORRIDOR: [number, number][] = [
  [-2.428, 53.578], // Bolton
  [-2.390, 53.550], // Moses Gate
  [-2.370, 53.535], // Farnworth
  [-2.350, 53.520], // Kearsley
  [-2.310, 53.510], // Clifton
  [-2.270, 53.485], // Salford
];

export const WEST_MIDLANDS_BLACK_COUNTRY: [number, number][] = [
  [-1.8978, 52.4797], // Birmingham New St
  [-1.925, 52.495],  // Handsworth
  [-1.990, 52.518],  // West Bromwich
  [-2.030, 52.525],  // Wednesbury
  [-2.060, 52.570],  // Bilston
  [-2.128, 52.585],  // Wolverhampton
];

export const WEST_MIDLANDS_DUDLEY: [number, number][] = [
  [-1.990, 52.518],  // West Bromwich
  [-2.040, 52.512],  // Tipton
  [-2.080, 52.510],  // Dudley
  [-2.115, 52.455],  // Stourbridge
];

export const SOUTH_YORKSHIRE_CHAIN: [number, number][] = [
  [-1.469, 53.381],  // Sheffield Fitzalan Square
  [-1.415, 53.415],  // Attercliffe
  [-1.385, 53.425],  // Meadowhall / Tinsley
  [-1.355, 53.430],  // Rotherham
];

export const WEST_YORKSHIRE_SOUTH_CHAIN: [number, number][] = [
  [-1.5419, 53.7976], // Leeds Briggate
  [-1.530, 53.750],  // Hunslet
  [-1.515, 53.710],  // Lofthouse
  [-1.498, 53.683],  // Wakefield
];

export const ALL_REGIONAL_CONNECTORS: [number, number][][] = [
  TP_CORRIDOR_EAST,
  TP_CORRIDOR_WEST,
  SLT_LIVERPOOL_MANCHESTER,
  LANCASHIRE_NORTH_CHAIN,
  BOLTON_SALFORD_CORRIDOR,
  WEST_MIDLANDS_BLACK_COUNTRY,
  WEST_MIDLANDS_DUDLEY,
  SOUTH_YORKSHIRE_CHAIN,
  WEST_YORKSHIRE_SOUTH_CHAIN,
];

function slideCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = '#ffffff',
  radius = 18
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
}

function renderRegionalTramwayNetwork(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  citiesBySlug?: Record<string, CityData>,
  overview?: OverviewData,
  currentCity?: CityData | null
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  // 1. Surveyed Interurban Connector Tracks
  for (const track of ALL_REGIONAL_CONNECTORS) {
    traceRing(ctx, track, vt);
  }

  // 2. All Surveyed Municipal Tramway Tracks (Liverpool, Manchester, Leeds, Sheffield, Birmingham)
  const slugs = ['leeds', 'liverpool', 'manchester', 'sheffield', 'birmingham'];
  for (const s of slugs) {
    const c = citiesBySlug ? citiesBySlug[s] : null;
    if (c && c.tramLines) {
      if (currentCity && currentCity.slug === s) continue;
      for (const line of c.tramLines) {
        traceRing(ctx, line, vt);
      }
    } else if (overview && overview.cities) {
      const oc = overview.cities.find((x) => x.slug === s);
      if (oc && oc.skeleton) {
        for (const seg of oc.skeleton) {
          traceRing(ctx, seg, vt);
        }
      }
    }
  }

  ctx.strokeStyle = 'rgba(124, 58, 237, 0.28)';
  ctx.lineWidth = clamp(vt.kmToPx(0.06), 1.2, 2.0);
  ctx.stroke();
  ctx.restore();
}

interface TrackGeometry {
  coords: [number, number][];
  cumDistKm: number[];
  totalKm: number;
  inward: boolean;
}

const trackCache = new WeakMap<[number, number][][], TrackGeometry[]>();

function getTrackGeometries(
  lines: [number, number][][],
  centre: [number, number]
): TrackGeometry[] {
  let cached = trackCache.get(lines);
  if (cached) return cached;
  cached = lines.map((pts) => {
    const cumDistKm: number[] = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cosLat = Math.cos(((p0[1] + p1[1]) * 0.5 * Math.PI) / 180);
      const dx = (p1[0] - p0[0]) * cosLat * 111.32;
      const dy = (p1[1] - p0[1]) * 111.32;
      total += Math.hypot(dx, dy);
      cumDistKm.push(total);
    }
    const dStart = Math.hypot(pts[0][0] - centre[0], pts[0][1] - centre[1]);
    const dEnd = Math.hypot(pts[pts.length - 1][0] - centre[0], pts[pts.length - 1][1] - centre[1]);
    return {
      coords: pts,
      cumDistKm,
      totalKm: Math.max(0.02, total),
      inward: dEnd < dStart,
    };
  });
  trackCache.set(lines, cached);
  return cached;
}

function sampleTrack(
  track: TrackGeometry,
  distKm: number
): { lon: number; lat: number; angle: number } {
  const clamped = Math.max(0, Math.min(track.totalKm, distKm));
  const cum = track.cumDistKm;
  let low = 0;
  let high = cum.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (cum[mid] <= clamped) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const idx = Math.max(0, Math.min(track.coords.length - 2, high));
  const d0 = cum[idx];
  const d1 = cum[idx + 1];
  const segDist = d1 - d0;
  const t = segDist > 0.00001 ? (clamped - d0) / segDist : 0;
  const p0 = track.coords[idx];
  const p1 = track.coords[idx + 1];
  const lon = p0[0] + (p1[0] - p0[0]) * t;
  const lat = p0[1] + (p1[1] - p0[1]) * t;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const angle = Math.atan2(p1[1] - p0[1], (p1[0] - p0[0]) * cosLat);
  return { lon, lat, angle };
}

function renderTransitVehicles(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  tracks: TrackGeometry[],
  simElapsedSec: number,
  options: {
    speedKmH: number;
    headwaySec: number;
    color: string;
    glowColor: string;
    dotRadiusPx?: number;
    maxVehiclesPerTrack?: number;
  }
) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const speedKmPerSimSec = options.speedKmH / 3600;

  for (let s = 0; s < tracks.length; s++) {
    const track = tracks[s];
    if (track.totalKm < 0.2) continue;

    // Headway spacing along track according to timetable frequency & speed
    const headwayKm = Math.max(0.65, options.speedKmH * (options.headwaySec / 3600));
    const numVehicles = Math.min(
      options.maxVehiclesPerTrack ?? 4,
      Math.max(1, Math.floor(track.totalKm / headwayKm))
    );

    for (let v = 0; v < numVehicles; v++) {
      const phaseKm = (s * 0.73 + v * headwayKm) % (track.totalKm * 2);
      const totalTraveled = simElapsedSec * speedKmPerSimSec + phaseKm;
      const cycleDist = totalTraveled % (track.totalKm * 2);

      let distAlong: number;
      let isOutward = false;
      if (cycleDist < track.totalKm) {
        distAlong = track.inward ? cycleDist : track.totalKm - cycleDist;
      } else {
        isOutward = true;
        const returnDist = cycleDist - track.totalKm;
        distAlong = track.inward ? track.totalKm - returnDist : returnDist;
      }

      const pt = sampleTrack(track, distAlong);
      const [px, py] = vt.project(pt.lon, pt.lat);

      if (px < -20 || px > vt.width + 20 || py < -20 || py > vt.height + 20) continue;

      const r = options.dotRadiusPx ?? (isOutward ? 2.4 : 3.2);

      // Subtle ambient glow halo
      const glowR = r * 2.4;
      const grad = ctx.createRadialGradient(px, py, 1, px, py, glowR);
      grad.addColorStop(0, options.color);
      grad.addColorStop(0.5, options.glowColor);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Clean, crisp transit dot (outer colored ring, white core, zero lightcones)
      ctx.fillStyle = options.color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}



let cachedBasemapCanvas: HTMLCanvasElement | null = null;
let lastCacheKey = '';

export function renderCartographicBackdrop(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  _globalTime: number,
  overview?: OverviewData | null,
  satelliteImg?: HTMLImageElement | null
) {
  const { width, height } = vt;
  const cacheKey = `${width}x${height}_${vt.centerLon.toFixed(3)}_${vt.centerLat.toFixed(3)}_${vt.pxPerDegLon.toFixed(1)}_${!!overview}_${!!(satelliteImg && satelliteImg.complete)}`;

  if (cachedBasemapCanvas && lastCacheKey === cacheKey) {
    ctx.drawImage(cachedBasemapCanvas, 0, 0);
    return;
  }

  if (!cachedBasemapCanvas) {
    cachedBasemapCanvas = document.createElement('canvas');
  }
  if (cachedBasemapCanvas.width !== width || cachedBasemapCanvas.height !== height) {
    cachedBasemapCanvas.width = width;
    cachedBasemapCanvas.height = height;
  }
  lastCacheKey = cacheKey;

  const bCtx = cachedBasemapCanvas.getContext('2d');
  if (!bCtx) return;

  bCtx.clearRect(0, 0, width, height);

  // 1. Oceanic wash with subtle soft vignette
  const bg = bCtx.createRadialGradient(
    width * 0.5,
    height * 0.5,
    Math.min(width, height) * 0.1,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.88
  );
  bg.addColorStop(0, '#f9fafb');
  bg.addColorStop(0.5, '#f2f5f9');
  bg.addColorStop(1, '#e5ebf4');
  bCtx.fillStyle = bg;
  bCtx.fillRect(0, 0, width, height);

  // 2. High-precision Coastlines & Landmass Silhouette
  if (overview && overview.uk) {
    bCtx.save();
    bCtx.beginPath();
    for (const r of overview.uk.ukRings) {
      traceRing(bCtx, r, vt);
      bCtx.closePath();
    }
    for (const r of overview.uk.ieRings) {
      traceRing(bCtx, r, vt);
      bCtx.closePath();
    }
    bCtx.fillStyle = '#ffffff';
    bCtx.fill();
    bCtx.strokeStyle = '#cbd5e1';
    bCtx.lineWidth = 1.0;
    bCtx.stroke();
    bCtx.restore();

    // 3. Faint Real Topography / Hillshade Shading (Clipped inside UK landmass)
    if (satelliteImg && satelliteImg.complete && satelliteImg.naturalWidth > 0) {
      bCtx.save();
      bCtx.beginPath();
      for (const r of overview.uk.ukRings) {
        traceRing(bCtx, r, vt);
        bCtx.closePath();
      }
      bCtx.clip();

      const [xTL, yTL] = vt.project(-3.515625, 54.57206165565852);
      const [xBR, yBR] = vt.project(0.0, 52.05249047600099);
      const imgW = xBR - xTL;
      const imgH = yBR - yTL;

      bCtx.globalAlpha = 0.16;
      bCtx.drawImage(satelliteImg, xTL, yTL, imgW, imgH);
      bCtx.restore();
    }

    // 4. Subtle Topographical Contour Accents (Pennines ridge line & Peak District)
    bCtx.save();
    bCtx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    bCtx.lineWidth = 0.85;
    bCtx.setLineDash([3, 4]);
    const ridgeLines: [number, number][][] = [
      [[-2.25, 53.35], [-2.15, 53.50], [-2.05, 53.68], [-2.10, 53.85], [-2.18, 54.05], [-2.32, 54.20]],
      [[-1.85, 53.30], [-1.88, 53.52], [-1.82, 53.72], [-1.86, 53.95], [-1.95, 54.18]],
      [[-2.40, 53.55], [-2.35, 53.72], [-2.28, 53.92], [-2.42, 54.10]],
    ];
    for (const ridge of ridgeLines) {
      bCtx.beginPath();
      traceRing(bCtx, ridge, vt);
      bCtx.stroke();
    }
    bCtx.restore();
  }

  // 5. Subtle presentation graticule
  const spanDeg = height / vt.pxPerDegLat;
  const stepDeg = spanDeg > 3.0 ? 1.0 : spanDeg > 0.8 ? 0.25 : 0.05;
  const [lonMin, latMax] = vt.unproject(0, 0);
  const [lonMax, latMin] = vt.unproject(width, height);

  bCtx.save();
  bCtx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  bCtx.lineWidth = 0.75;
  bCtx.beginPath();
  const startLon = Math.floor(lonMin / stepDeg) * stepDeg;
  for (let lon = startLon; lon <= lonMax; lon += stepDeg) {
    const [x] = vt.project(lon, vt.centerLat);
    bCtx.moveTo(x, 0);
    bCtx.lineTo(x, height);
  }
  const startLat = Math.floor(latMin / stepDeg) * stepDeg;
  for (let lat = startLat; lat <= latMax; lat += stepDeg) {
    const [, y] = vt.project(vt.centerLon, lat);
    bCtx.moveTo(0, y);
    bCtx.lineTo(width, y);
  }
  bCtx.stroke();
  bCtx.restore();

  ctx.drawImage(cachedBasemapCanvas, 0, 0);
}

export function renderMapStage(params: MapRenderParams) {
  const {
    ctx,
    vt,
    overview,
    city,
    citiesBySlug,
    scene,
    slideElapsed,
    globalTime,
    hoveredRoute,
    alpha,
    satelliteImg,
    nightSatelliteImg,
  } = params;
  if (alpha <= 0.005) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const spanKm = vt.stageH / vt.kmToPx(1);
  const macroWeight = smoothstep(55, 160, spanKm);
  const cityWeight = 1 - smoothstep(75, 180, spanKm);

  // 1. UK & Ireland Coastline + OlmoEarth GDOT-style land dot matrix
  if (macroWeight > 0.01) {
    ctx.save();
    ctx.globalAlpha = alpha * (0.28 + 0.72 * macroWeight);

    // Fill subtle landmass silhouette
    ctx.beginPath();
    for (const r of overview.uk.ukRings) {
      traceRing(ctx, r, vt);
      ctx.closePath();
    }
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    for (const r of overview.uk.ieRings) {
      traceRing(ctx, r, vt);
      ctx.closePath();
    }
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // GDOT dot matrix with subtle latitude wave (homage to globeLayer develop())
    const dotRadius = clamp(vt.kmToPx(2.3), 1.1, 2.6);
    for (let i = 0; i < overview.uk.dots.length; i++) {
      const [lon, lat, isUk] = overview.uk.dots[i];
      const [x, y] = vt.project(lon, lat);
      if (x < -10 || x > vt.width + 10 || y < -10 || y > vt.height + 10) continue;
      const shimmer = 0.82 + 0.18 * Math.sin(globalTime * 1.6 + lat * 2.2 + lon * 1.5);
      ctx.fillStyle = isUk
        ? `rgba(124, 58, 237, ${0.18 * shimmer * macroWeight})`
        : `rgba(148, 163, 184, ${0.12 * macroWeight})`;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    // Faint UK coastline context if visible at city edge
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (const r of overview.uk.ukRings) {
      traceRing(ctx, r, vt);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
  }

  // High-res Mersey coastline when over Liverpool
  if (city && city.coastline && city.coastline.length > 0 && cityWeight > 0.05) {
    ctx.save();
    traceGeoShapes(ctx, city.coastline, vt);
    ctx.strokeStyle = `rgba(14, 165, 233, ${0.35 * cityWeight})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // 2. Macro UK Tramway Skeletons + Crich Archive Beams (Skip on northern-megacity to avoid Birmingham duplicate)
  if (macroWeight > 0.02 && scene !== 'northern-megacity') {
    ctx.save();
    for (let ci = 0; ci < overview.cities.length; ci++) {
      const oc = overview.cities[ci];
      const [cx, cy] = vt.project(oc.centre.lon, oc.centre.lat);

      // Ambient city glow
      const pulse = 1 + 0.12 * Math.sin(globalTime * 2.1 + ci * 1.1);
      const glowR = clamp(vt.kmToPx(24) * pulse, 24, 95);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      g.addColorStop(0, `rgba(124, 58, 237, ${0.22 * macroWeight})`);
      g.addColorStop(0.5, `rgba(124, 58, 237, ${0.06 * macroWeight})`);
      g.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Surveyed historical tramway skeleton
      ctx.beginPath();
      for (const seg of oc.skeleton) {
        traceRing(ctx, seg, vt);
      }
      ctx.strokeStyle = `rgba(124, 58, 237, ${0.75 * macroWeight})`;
      ctx.lineWidth = clamp(vt.kmToPx(0.45), 1.3, 2.4);
      ctx.stroke();
    }

    // Special Slide 04: Crich Tramway Village (53.090°N, -1.486°W) archival beams!
    if (scene === 'uk-archive-orbit') {
      const crichLon = -1.486;
      const crichLat = 53.09;
      const [ox, oy] = vt.project(crichLon, crichLat);
      const beamProg = olmoEase(clamp(slideElapsed / 1.4, 0, 1));

      for (let i = 0; i < overview.cities.length; i++) {
        const oc = overview.cities[i];
        const [tx, ty] = vt.project(oc.centre.lon, oc.centre.lat);
        const mx = (ox + tx) * 0.5 + (ty - oy) * 0.16;
        const my = (oy + ty) * 0.5 - (tx - ox) * 0.16;

        ctx.save();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.55)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -globalTime * 24;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        const steps = Math.max(12, Math.floor(40 * beamProg));
        for (let s = 1; s <= steps; s++) {
          const u = (s / 40) * beamProg;
          if (u > beamProg) break;
          const bx = (1 - u) * (1 - u) * ox + 2 * (1 - u) * u * mx + u * u * tx;
          const by = (1 - u) * (1 - u) * oy + 2 * (1 - u) * u * my + u * u * ty;
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Crich beacon
      const cg = ctx.createRadialGradient(ox, oy, 0, ox, oy, 36);
      cg.addColorStop(0, 'rgba(124, 58, 237, 0.85)');
      cg.addColorStop(0.35, 'rgba(124, 58, 237, 0.35)');
      cg.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(ox, oy, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2.5. Continuous regional surveyed tramway network underlay across all geospatial views
  if (scene !== 'northern-megacity') {
    renderRegionalTramwayNetwork(ctx, vt, citiesBySlug, overview, city);
  }

  // 3. City-Level Scenes
  if (city && cityWeight > 0.02) {
    ctx.save();
    ctx.globalAlpha = alpha * cityWeight;

    if (scene === 'birmingham-small-city') {
      renderBirminghamSmallCity(ctx, vt, city, slideElapsed, globalTime);
    } else if (scene === 'car-collapse') {
      renderCarCongestionCollapse(ctx, vt, city, slideElapsed, globalTime);
    } else if (scene === 'raptor-wave' || scene === 'city-historical') {
      renderCityHistorical(ctx, vt, city, slideElapsed, globalTime);
    } else if (scene === 'city-wartime') {
      renderManchesterWartime(ctx, vt, city, slideElapsed, globalTime);
    } else if (scene === 'city-underserved' || scene === 'leeds-stress') {
      renderUnderservedScene(ctx, vt, city, slideElapsed, globalTime);
    } else if (scene === 'city-crossfade' || scene === 'city-wipe') {
      renderCityCrossFade(ctx, vt, city, slideElapsed, globalTime);
    }

    // Highlight hovered historical route for click-to-inspect Crich scan
    if (hoveredRoute && hoveredRoute.coords.length > 1) {
      ctx.save();
      ctx.beginPath();
      traceRing(ctx, hoveredRoute.coords, vt);
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // 4. Regional & Macro Presentation Map Scenes
  if (scene === 'trans-pennine-expanse') {
    renderTransPennineExpanse(ctx, vt, overview, slideElapsed, globalTime);
  } else if (scene === 'northern-megacity') {
    renderNorthernMegaCity(ctx, vt, overview, slideElapsed, globalTime, satelliteImg, nightSatelliteImg);
  }

  ctx.restore();
}

function drawRingPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  borderColor: string,
  textColor: string,
  bgColor = '#ffffff'
) {
  ctx.save();
  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  const tw = ctx.measureText(text).width + 28;
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x - tw * 0.5, y - 16, tw, 32, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 0.5);
  ctx.restore();
}

// ============================================================================
// TOM FORTH · BIRMINGHAM IS A SMALL CITY (2019) EMPIRICAL DATA
// ============================================================================
interface ForthCityPoint {
  name: string;
  popM: number;
  gdpCapita: number;
}

const FORTH_FRENCH_CITIES: ForthCityPoint[] = [
  { name: 'St-Étienne', popM: 0.52, gdpCapita: 29500 },
  { name: 'Grenoble', popM: 0.55, gdpCapita: 34600 },
  { name: 'Montpellier', popM: 0.62, gdpCapita: 31500 },
  { name: 'Rouen', popM: 0.66, gdpCapita: 33000 },
  { name: 'Rennes', popM: 0.70, gdpCapita: 35000 },
  { name: 'Strasbourg', popM: 0.78, gdpCapita: 36000 },
  { name: 'Nice', popM: 0.85, gdpCapita: 36700 },
  { name: 'Nantes', popM: 0.89, gdpCapita: 36200 },
  { name: 'Bordeaux', popM: 1.18, gdpCapita: 35800 },
  { name: 'Toulouse', popM: 1.28, gdpCapita: 39500 },
  { name: 'Lille', popM: 1.48, gdpCapita: 31700 },
  { name: 'Marseille', popM: 1.75, gdpCapita: 37000 },
  { name: 'Lyon', popM: 2.18, gdpCapita: 44800 },
];

const FORTH_UK_CITIES: ForthCityPoint[] = [
  { name: 'Bradford', popM: 0.55, gdpCapita: 24300 },
  { name: 'Portsmouth', popM: 0.60, gdpCapita: 37600 },
  { name: 'Cardiff', popM: 0.65, gdpCapita: 30500 },
  { name: 'Edinburgh', popM: 0.78, gdpCapita: 44900 },
  { name: 'Bristol', popM: 0.88, gdpCapita: 40600 },
  { name: 'Glasgow', popM: 0.96, gdpCapita: 38800 },
  { name: 'Sheffield', popM: 1.00, gdpCapita: 26500 },
  { name: 'Liverpool', popM: 1.05, gdpCapita: 31200 },
  { name: 'Newcastle', popM: 1.15, gdpCapita: 27000 },
  { name: 'Leeds', popM: 1.30, gdpCapita: 36500 },
  { name: 'Manchester', popM: 2.00, gdpCapita: 35500 },
];

const BIRMINGHAM_EFFECTIVE_STEPS = [
  { popM: 2.0, mode: 'Official OECD', label: 'Official: 2.0M', gap: '33% shortfall', color: '#059669' },
  { popM: 1.7, mode: 'Simulated tram', label: 'Tram: 1.7M', gap: '26% gap', color: '#2563eb' },
  { popM: 1.3, mode: 'Off-peak bus', label: 'Off-peak: 1.3M', gap: '19% gap', color: '#d97706' },
  { popM: 0.9, mode: 'Peak bus 08:15', label: 'Peak 08:15: 0.9M', gap: '9% gap (on trend!)', color: '#e11d48' },
];

function renderBirminghamSmallCity(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  globalTime: number
) {
  const { stageX, stageY, stageW, stageH } = vt;
  const isCompact = stageW < 960 || stageH < 620;

  // Split layout: 63% Left = Tom Forth Chart, 37% Right = Spatial Reach Map
  const gap = 16;
  const chartW = isCompact ? stageW : Math.round((stageW - gap) * 0.63);
  const mapW = isCompact ? stageW : stageW - gap - chartW;
  const chartX = stageX;
  const mapX = chartX + chartW + gap;

  // ========================================================================
  // 1. LEFT CARD: TOM FORTH'S "BIRMINGHAM IS A SMALL CITY" CHART
  // ========================================================================
  slideCard(ctx, chartX, stageY, chartW, stageH, '#fff2e8', 20);

  ctx.save();
  ctx.strokeStyle = '#ebd9c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(chartX, stageY, chartW, stageH, 20);
  ctx.stroke();

  // Card Title & Subtitle
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.font = `700 ${isCompact ? 15 : 18}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText('“Birmingham isn’t a big city at peak times”', chartX + 24, stageY + 18);

  ctx.fillStyle = '#7c2d12';
  ctx.font = `500 ${isCompact ? 11 : 12.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(
    'Tom Forth (2019) · GDP/capita vs city population (France vs UK non-capital cities)',
    chartX + 24,
    stageY + (isCompact ? 38 : 44)
  );

  // Legend
  const legY = stageY + (isCompact ? 56 : 68);
  ctx.font = `600 ${isCompact ? 10.5 : 11.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = 'middle';

  // France (FT Blue)
  ctx.strokeStyle = '#0284c7';
  ctx.fillStyle = 'rgba(219, 234, 254, 0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(chartX + 30, legY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0284c7';
  ctx.fillText('France (non-capital)', chartX + 42, legY);

  // UK (FT Red)
  const leg2X = chartX + (isCompact ? 165 : 185);
  ctx.fillStyle = '#ffd5e1';
  ctx.strokeStyle = '#e11d48';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(leg2X + 6, legY, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e11d48';
  ctx.fillText('UK (non-capital)', leg2X + 16, legY);

  // Birmingham
  const leg3X = leg2X + (isCompact ? 135 : 150);
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(leg3X, legY - 4.5, 9, 9);
  ctx.fillStyle = '#9f1239';
  ctx.fillText('Birmingham effective size', leg3X + 16, legY);
  ctx.restore();

  // Plot Area Coordinates
  const padBottom = isCompact ? 72 : 88;
  const gX = chartX + (isCompact ? 52 : 62);
  const gY = legY + 18;
  const gW = chartW - (gX - chartX) - (isCompact ? 22 : 28);
  const gH = stageH - (gY - stageY) - padBottom;
  const gPadX = 14;
  const gInnerW = gW - gPadX * 2;

  const xOfPop = (p: number) => gX + gPadX + (p / 2.5) * gInnerW;
  const yOfGdp = (g: number) => gY + gH - ((g - 20000) / 30000) * gH;

  // Horizontal Gridlines & Y-ticks
  ctx.save();
  ctx.font = `500 ${isCompact ? 10 : 11}px "JetBrains Mono", monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const gdpTicks = [20000, 25000, 30000, 35000, 40000, 45000, 50000];
  for (const gt of gdpTicks) {
    const y = yOfGdp(gt);
    ctx.strokeStyle = gt === 20000 ? '#cbd5e1' : 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = gt === 20000 ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(gX, y);
    ctx.lineTo(gX + gW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(`$${gt / 1000}k`, gX - 7, y);
  }

  // Y-Axis Title (Rotated)
  ctx.save();
  ctx.translate(gX - (isCompact ? 36 : 44), gY + gH * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = `600 ${isCompact ? 10.5 : 11.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('GDP per person ($ PPP 2013)', 0, 0);
  ctx.restore();

  // Vertical Gridlines & X-ticks
  const popTicks = [0, 0.5, 1.0, 1.5, 2.0, 2.5];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const pt of popTicks) {
    const x = xOfPop(pt);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, gY);
    ctx.lineTo(x, gY + gH);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillText(`${pt}M`, x, gY + gH + 6);
  }

  // X-Axis Title
  ctx.font = `600 ${isCompact ? 10.5 : 11.5}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = '#475569';
  ctx.fillText('City population (millions)', gX + gW * 0.5, gY + gH + (isCompact ? 22 : 26));

  // Axes border lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(gX, gY);
  ctx.lineTo(gX, gY + gH);
  ctx.lineTo(gX + gW, gY + gH);
  ctx.stroke();

  // Regression line for France (upward agglomeration: y = 28000 + 7500 * popM)
  const fx1 = xOfPop(0.35);
  const fy1 = yOfGdp(28000 + 7500 * 0.35);
  const fx2 = xOfPop(2.35);
  const fy2 = yOfGdp(28000 + 7500 * 2.35);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(fx1, fy1);
  ctx.lineTo(fx2, fy2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#1e40af';
  ctx.font = `700 ${isCompact ? 10 : 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('French best fit (↗ agglomeration)', fx2 - 4, fy2 - 12);

  // Regression line for UK (flat: y = 32800 + 900 * popM)
  const ux1 = xOfPop(0.35);
  const uy1 = yOfGdp(32800 + 900 * 0.35);
  const ux2 = xOfPop(2.35);
  const uy2 = yOfGdp(32800 + 900 * 2.35);
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2.0;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(ux1, uy1);
  ctx.lineTo(ux2, uy2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#065f46';
  ctx.textAlign = 'right';
  ctx.fillText('UK best fit (→ flat)', ux2 - 4, uy2 + 14);

  // Plot French Cities (blue circles)
  ctx.font = `500 ${isCompact ? 9 : 10}px "Plus Jakarta Sans", sans-serif`;
  for (const fc of FORTH_FRENCH_CITIES) {
    const px = xOfPop(fc.popM);
    const py = yOfGdp(fc.gdpCapita);
    ctx.strokeStyle = '#2563eb';
    ctx.fillStyle = 'rgba(219, 234, 254, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e3a8a';
    ctx.textAlign = fc.name === 'Lyon' || fc.name === 'Marseille' ? 'right' : 'left';
    const offsetX = fc.name === 'Lyon' || fc.name === 'Marseille' ? -7 : 7;
    ctx.fillText(fc.name, px + offsetX, py - 3);
  }

  // Plot UK Cities (green squares)
  for (const uc of FORTH_UK_CITIES) {
    const px = xOfPop(uc.popM);
    const py = yOfGdp(uc.gdpCapita);
    ctx.fillStyle = '#059669';
    ctx.fillRect(px - 4, py - 4, 8, 8);

    ctx.fillStyle = '#064e3b';
    ctx.textAlign = uc.name === 'Manchester' || uc.name === 'Cardiff' ? 'right' : 'left';
    const offsetX = uc.name === 'Manchester' || uc.name === 'Cardiff' ? -8 : 7;
    const offsetY = uc.name === 'Cardiff' ? 10 : 4;
    ctx.fillText(uc.name, px + offsetX, py + offsetY);
  }

  // Birmingham Effective Size Points along $31,500
  const bY = yOfGdp(31500);
  const pStart = xOfPop(2.0);
  const pEnd = xOfPop(0.9);

  // Trajectory Line connecting the 4 points
  ctx.strokeStyle = 'rgba(225, 29, 72, 0.45)';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pStart, bY);
  ctx.lineTo(pEnd, bY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Fixed arrowhead at 0.9M pointing leftwards (towards French agglomeration line)
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.moveTo(pEnd - 7, bY);
  ctx.lineTo(pEnd + 5, bY - 6);
  ctx.lineTo(pEnd + 5, bY + 6);
  ctx.closePath();
  ctx.fill();

  // Draw the 4 discrete steps
  for (let i = 0; i < BIRMINGHAM_EFFECTIVE_STEPS.length; i++) {
    const s = BIRMINGHAM_EFFECTIVE_STEPS[i];
    const sx = xOfPop(s.popM);

    ctx.fillStyle = s.color;
    ctx.fillRect(sx - 5.5, bY - 5.5, 11, 11);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(sx - 5.5, bY - 5.5, 11, 11);

    // Label alternating above / below
    ctx.font = `700 ${isCompact ? 9 : 10.5}px "JetBrains Mono", monospace`;
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    const isTop = i % 2 === 0;
    ctx.fillText(s.label, sx, isTop ? bY - 14 : bY + 16);

    // Badge callout for official (33% shortfall) and peak (9% gap)
    if (i === 0 || i === 3) {
      ctx.font = `600 ${isCompact ? 8.5 : 9.5}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = i === 3 ? '#991b1b' : '#065f46';
      ctx.fillText(s.gap, sx, isTop ? bY - 27 : bY + 28);
    }
  }

  // Subtle animated transit wave gliding along the arrow
  const glideT = (globalTime * 0.45) % 1;
  const pulseX = pStart - (pStart - pEnd) * olmoEase(glideT);
  ctx.save();
  ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
  ctx.beginPath();
  ctx.arc(pulseX, bY, 7 + 2 * Math.sin(globalTime * 3), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bottom Takeaway Ribbon
  const ribH = isCompact ? 28 : 32;
  const ribY = stageY + stageH - ribH - 30;
  ctx.fillStyle = '#fee2e2';
  ctx.beginPath();
  ctx.roundRect(chartX + 16, ribY, chartW - 32, ribH, 8);
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#991b1b';
  ctx.font = `600 ${isCompact ? 9.5 : 11}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    '★ Productivity gap drops 33% → 9%: Birmingham is an effective city of only 900k at morning peak.',
    chartX + chartW * 0.5,
    ribY + ribH * 0.5
  );

  drawFtSourceFootnote(ctx, chartX + 20, stageY + stageH - 12, 'Source: Tom Forth (2019) · Insee & ONS microdata');
  ctx.restore();

  // If compact, only show chart
  if (isCompact) return;

  // ========================================================================
  // 2. RIGHT CARD: SPATIAL PUBLIC TRANSIT CATCHMENT
  // ========================================================================
  slideCard(ctx, mapX, stageY, mapW, stageH, '#fff2e8', 20);

  ctx.save();
  ctx.strokeStyle = '#ebd9c8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(mapX, stageY, mapW, stageH, 20);
  ctx.stroke();

  // Right Card Header
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Spatial Public Transit Reach', mapX + 20, stageY + 18);

  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('30-min peak reach vs 30km metro ring', mapX + 20, stageY + 40);

  // Local Projection inside Right Card
  const cardCx = mapX + mapW * 0.5;
  const cardCy = stageY + 74 + (stageH - 140) * 0.44;
  const r30km = Math.min((mapW - 32) * 0.44, (stageH - 160) * 0.44);
  const pxPerKm = r30km / 30;
  const cosLat = Math.cos((city.centre.lat * Math.PI) / 180);
  const pxPerDegLat = pxPerKm * 111.32;
  const pxPerDegLon = pxPerKm * 111.32 * cosLat;

  const projMap = (lon: number, lat: number): [number, number] => [
    cardCx + (lon - city.centre.lon) * pxPerDegLon,
    cardCy - (lat - city.centre.lat) * pxPerDegLat,
  ];

  const traceRingLocal = (ring: [number, number][]) => {
    if (!ring || ring.length < 2) return;
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = projMap(ring[i][0], ring[i][1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  };

  const traceGeoShapesLocal = (shapes: GeoShape[] | undefined) => {
    if (!shapes) return;
    for (const sh of shapes) {
      if (sh.type === 'Polygon') {
        for (const ring of sh.coordinates) {
          traceRingLocal(ring);
          ctx.closePath();
        }
      } else if (sh.type === 'MultiPolygon') {
        for (const poly of sh.coordinates) {
          for (const ring of poly) {
            traceRingLocal(ring);
            ctx.closePath();
          }
        }
      }
    }
  };

  // Outer 30km census ring (3.74M people)
  ctx.beginPath();
  ctx.arc(cardCx, cardCy, r30km, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
  ctx.fill();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.setLineDash([]);

  // Render LSOA dots
  for (const l of city.lsoas) {
    const [lx, ly] = projMap(l[0], l[1]);
    const inMod30 = l[4] !== null && l[4] <= 30;
    ctx.fillStyle = inMod30 ? '#0d9488' : 'rgba(148, 163, 184, 0.28)';
    ctx.beginPath();
    ctx.arc(lx, ly, inMod30 ? 2.2 : 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer 30km Ring Badge
  drawRingPill(
    ctx,
    cardCx,
    cardCy - r30km + 8,
    '30 km metro ring · 3.74M residents',
    '#cbd5e1',
    '#334155',
    '#ffffff'
  );

  // Modern 30-min public transit reach (346,800)
  ctx.beginPath();
  traceGeoShapesLocal(city.isochrones.modern['30']);
  ctx.fillStyle = 'rgba(13, 148, 136, 0.20)';
  ctx.fill();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Breathing pulse on core
  const pulseR = (6.5 + 0.5 * Math.sin(globalTime * 2.5)) * pxPerKm;
  ctx.beginPath();
  ctx.arc(cardCx, cardCy, pulseR, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(13, 148, 136, 0.4)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Bottom Pill inside right card
  const innerPillY = cardCy + r30km * 0.42;
  ctx.strokeStyle = 'rgba(13, 148, 136, 0.75)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cardCx, cardCy + 14);
  ctx.lineTo(cardCx, innerPillY - 12);
  ctx.stroke();

  drawRingPill(
    ctx,
    cardCx,
    innerPillY,
    '08:15 TRANSIT REACH · 346,800 (9.3%)',
    '#0d9488',
    '#0f766e',
    '#ccfbf1'
  );

  // Summary at bottom of right card
  const botCardY = stageY + stageH - 52;
  ctx.fillStyle = '#0f766e';
  ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Peak bus congestion cuts labour catchment by 75%',
    cardCx,
    botCardY
  );
  ctx.fillStyle = '#7c2d12';
  ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'giving Birmingham an effective population of only 900,000.',
    cardCx,
    botCardY + 16
  );

  drawFtSourceFootnote(ctx, mapX + 20, stageY + stageH - 12, 'Source: 2026 GTFS Multi-Modal Network Matrix');
  ctx.restore();
}

function renderCarCongestionCollapse(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  globalTime: number
) {
  const [cx, cy] = vt.project(city.centre.lon, city.centre.lat);
  // Smoothly animate collapse from free-flow (0..0.9s hold, then 0.9..2.5s collapse!)
  const collapseT = olmoEase(clamp((slideElapsed - 0.55) / 1.85, 0, 1));
  const peakFactor = city.amPeakFactor || 1.744;

  // Effective radius approximation + real LSOA carFreeflow times!
  const thresholdFreeflowEquiv = 30 - collapseT * (30 - 30 / peakFactor + 1.5);

  // Outer ghost ring showing 3 a.m. free-flow reach (2.68M)
  const freeflowR = vt.kmToPx(23.5);
  const currentR = vt.kmToPx(23.5 - collapseT * 11.8);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, freeflowR, 0, Math.PI * 2);
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Shockwave area lost to congestion
  if (collapseT > 0.02) {
    ctx.beginPath();
    ctx.arc(cx, cy, freeflowR, 0, Math.PI * 2);
    ctx.arc(cx, cy, currentR, 0, Math.PI * 2, true);
    ctx.fillStyle = `rgba(244, 63, 94, ${0.1 * collapseT})`;
    ctx.fill();
  }

  // Active car reach ring
  const ringGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentR);
  ringGrad.addColorStop(0, 'rgba(244, 63, 94, 0.18)');
  ringGrad.addColorStop(0.8, 'rgba(244, 63, 94, 0.12)');
  ringGrad.addColorStop(1, 'rgba(244, 63, 94, 0.03)');
  ctx.beginPath();
  ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.setLineDash([]);
  ctx.strokeStyle = collapseT > 0.3 ? '#e11d48' : '#cbd5e1';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Render all LSOAs showing which ones drop out under congestion
  for (let i = 0; i < city.lsoas.length; i++) {
    const l = city.lsoas[i];
    const [x, y] = vt.project(l[0], l[1]);
    const distKm = Math.hypot((l[0] - city.centre.lon) * 67.8, (l[1] - city.centre.lat) * 111.3);
    const estFreeMin = distKm * 1.22;
    const inFree = estFreeMin <= 30;
    const inNow = estFreeMin <= thresholdFreeflowEquiv;

    if (inNow) {
      ctx.fillStyle = collapseT > 0.4 ? '#7c3aed' : '#475569';
      ctx.beginPath();
      ctx.arc(x, y, 2.0, 0, Math.PI * 2);
      ctx.fill();
    } else if (inFree) {
      const flicker = 0.45 + 0.25 * Math.sin(globalTime * 4 + i);
      ctx.fillStyle = `rgba(225, 29, 72, ${0.45 * collapseT * flicker})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // On-canvas ring callout pills
  drawRingPill(
    ctx,
    cx,
    clamp(cy - freeflowR, vt.stageY + 28, vt.stageY + vt.stageH - 28),
    '3 a.m. free-flow car · 2.68M',
    '#cbd5e1',
    '#334155'
  );

  if (collapseT > 0.28) {
    ctx.save();
    ctx.globalAlpha *= smoothstep(0.28, 0.75, collapseT);
    drawRingPill(
      ctx,
      cx,
      clamp(cy + currentR, vt.stageY + 60, vt.stageY + vt.stageH - 28),
      '08:15 peak car · 912k (−66%)',
      '#fecdd3',
      '#be123c',
      '#fff1f2'
    );
    ctx.restore();
  }

  ctx.restore();
}

function renderCityHistorical(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  globalTime: number
) {
  // Realistic morning peak commute: slowed down 5x so 1 simulated hour takes 50s (TIME_SCALE = 72)
  const simElapsedSec = slideElapsed * 72;
  const simMinutes = simElapsedSec / 60;
  const simHour = 8 + Math.floor(simMinutes / 60);
  const simMin = Math.floor(simMinutes % 60);
  const simSec = Math.floor(simElapsedSec % 60);
  const clockStr = `${String(simHour).padStart(2, "0")}:${String(simMin).padStart(2, "0")}:${String(simSec).padStart(2, "0")} AM`;
  const [cx, cy] = vt.project(city.centre.lon, city.centre.lat);
  const hPop = city.populationCurve.historical["30"] || 0;

  // 1. Subtle historical tracks underneath
  ctx.save();
  ctx.beginPath();
  for (const seg of city.tramLines) traceRing(ctx, seg, vt);
  ctx.strokeStyle = "rgba(124, 58, 237, 0.45)";
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();

  // 2. Progressive isochrone shells forming as 08:00 AM commuters converge
  for (const [mStr, fillAlpha] of [
    ["10", 0.12],
    ["20", 0.14],
    ["30", 0.20],
  ] as const) {
    const mVal = Number(mStr);
    if (simMinutes >= mVal - 4) {
      const w = smoothstep(mVal - 4, mVal, simMinutes);
      ctx.save();
      ctx.globalAlpha *= w;
      traceGeoShapes(ctx, city.isochrones.historical[mStr], vt);
      ctx.fillStyle = `rgba(124, 58, 237, ${fillAlpha})`;
      ctx.fill();

      // Form outline contour
      if (mVal === 30) {
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = simMinutes >= 30 ? 2.6 : 3.0;
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(124, 58, 237, 0.65)";
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. LSOA ignition wavefront (Many-to-One: departing at 08:00 AM, arriving at centre by T)
  for (let i = 0; i < city.lsoas.length; i++) {
    const l = city.lsoas[i];
    const h = l[3];
    const [x, y] = vt.project(l[0], l[1]);
    if (x < -10 || x > vt.width + 10 || y < -10 || y > vt.height + 10) continue;

    if (h !== null && h <= simMinutes) {
      const age = simMinutes - h;
      const isJustArrived = age < 2.5 && simMinutes < 35;
      if (isJustArrived) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = h <= 30 ? "#7c3aed" : "rgba(124, 58, 237, 0.4)";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "rgba(148, 163, 184, 0.22)";
      ctx.beginPath();
      ctx.arc(x, y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Realistic tram movements parameterized along track geometries (18 km/h schedule speed, 4-min headway, zero lightcones)
  const tramTracks = getTrackGeometries(city.tramLines, [city.centre.lon, city.centre.lat]);
  renderTransitVehicles(ctx, vt, tramTracks, simElapsedSec, {
    speedKmH: 18.0,
    headwaySec: 240,
    color: "#7c3aed",
    glowColor: "rgba(124, 58, 237, 0.4)",
    dotRadiusPx: 3.2,
  });

  // 5. Central Employment Hub Beacon (The "One" in Many-to-One)
  ctx.save();
  const hubPulse = 1 + 0.2 * Math.sin(globalTime * 3);
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26 * hubPulse);
  hg.addColorStop(0, "rgba(124, 58, 237, 0.45)");
  hg.addColorStop(0.5, "rgba(124, 58, 237, 0.15)");
  hg.addColorStop(1, "rgba(124, 58, 237, 0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, 26 * hubPulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7c3aed";
  ctx.beginPath();
  ctx.arc(cx, cy, 5.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Central hub label badge
  const hubLabel = city.slug === 'liverpool' ? 'PIER HEAD · TRAM TERMINUS' : city.centre.name || city.displayName;
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  const hlw = ctx.measureText(hubLabel).width + 18;
  const hbx = cx + 14;
  const hby = cy - 13;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(hbx, hby, hlw, 26, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#7c3aed';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(hubLabel, hbx + 9, cy);
  ctx.restore();

  // 6. Clean Compact Simulation Clock Pill (Top-Left of Stage)
  ctx.save();
  const hudX = vt.stageX + 20;
  const hudY = vt.stageY + 20;
  const hudW = 390;
  const hudH = 62;

  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 16);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const currentReached = Math.round(hPop * clamp(simMinutes / 30, 0, 1));
  ctx.font = "600 14.5px \"JetBrains Mono\", monospace";
  ctx.fillStyle = "#7000ff";
  ctx.textAlign = "left";
  ctx.fillText(clockStr, hudX + 18, hudY + 26);

  ctx.font = "600 14.5px \"Plus Jakarta Sans\", sans-serif";
  ctx.fillStyle = "#0a0a0a";
  ctx.textAlign = "right";
  ctx.fillText(
    `${Math.round(currentReached / 1000)}k reached (+${Math.min(30, Math.round(simMinutes))}m)`,
    hudX + hudW - 18,
    hudY + 26
  );

  const barX = hudX + 18;
  const barY = hudY + 40;
  const barW = hudW - 36;
  const barH = 8;

  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  const fillW = barW * clamp(simMinutes / 30, 0, 1);
  ctx.fillStyle = "#7000ff";
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW, barH, 4);
  ctx.fill();

  ctx.restore();
}

function renderCityCrossFade(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  globalTime: number
) {
  // Realistic morning peak commute: slowed down 5x so 1 simulated hour takes 50s (TIME_SCALE = 72)
  const simElapsedSec = slideElapsed * 72;
  const simMinutes = simElapsedSec / 60;
  const simHour = 8 + Math.floor(simMinutes / 60);
  const simMin = Math.floor(simMinutes % 60);
  const simSec = Math.floor(simElapsedSec % 60);
  const clockStr = `${String(simHour).padStart(2, "0")}:${String(simMin).padStart(2, "0")}:${String(simSec).padStart(2, "0")} AM`;
  const [cx, cy] = vt.project(city.centre.lon, city.centre.lat);
  const hPop = city.populationCurve.historical["30"] || 0;
  const mPop = city.populationCurve.modern["30"] || 0;
  const dropPct = Math.round((1 - mPop / Math.max(1, hPop)) * 100);

  // 1. --- HISTORICAL TRAM ERA LAYER (STEADY PURPLE REFERENCE BENCHMARK) ---
  ctx.save();

  // Outer historical contours (subtle benchmark)
  traceGeoShapes(ctx, city.isochrones.historical["50"], vt);
  ctx.fillStyle = "rgba(124, 58, 237, 0.03)";
  ctx.fill();

  traceGeoShapes(ctx, city.isochrones.historical["40"], vt);
  ctx.fillStyle = "rgba(124, 58, 237, 0.05)";
  ctx.fill();

  // Steady purple dashed benchmark for historical 30-min reach:
  traceGeoShapes(ctx, city.isochrones.historical["30"], vt);
  ctx.fillStyle = "rgba(124, 58, 237, 0.08)";
  ctx.fill();
  ctx.setLineDash([7, 5]);
  ctx.strokeStyle = "rgba(124, 58, 237, 0.85)";
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.setLineDash([]);

  // Surveyed Historical Tram Tracks
  ctx.beginPath();
  for (const seg of city.tramLines) traceRing(ctx, seg, vt);
  ctx.strokeStyle = "rgba(124, 58, 237, 0.35)";
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Ghost historical trams moving smoothly along tram tracks
  if (city.tramLines.length > 0) {
    const histTracks = getTrackGeometries(city.tramLines, [city.centre.lon, city.centre.lat]);
    renderTransitVehicles(ctx, vt, histTracks, simElapsedSec, {
      speedKmH: 18.0,
      headwaySec: 300,
      color: "#7c3aed",
      glowColor: "rgba(124, 58, 237, 0.35)",
      dotRadiusPx: 2.6,
      maxVehiclesPerTrack: 2,
    });
  }

  // 2. --- 2026 MODERN TRANSIT ERA LAYER (TEAL) ---
  const modernCoords = [
    ...city.modernLines.map((ml) => ml.coords),
    ...(city.routes ? city.routes.filter((r) => r.coords && r.coords.length > 2).map((r) => r.coords) : []),
  ];

  for (const ml of city.modernLines) {
    ctx.beginPath();
    traceRing(ctx, ml.coords, vt);
    ctx.strokeStyle = ml.color || "#0d9488";
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  // Modern buses/trains moving along modern corridors
  if (modernCoords.length > 0) {
    const modernTracks = getTrackGeometries(modernCoords, [city.centre.lon, city.centre.lat]);
    renderTransitVehicles(ctx, vt, modernTracks, simElapsedSec, {
      speedKmH: 13.5,
      headwaySec: 360,
      color: "#0d9488",
      glowColor: "rgba(13, 148, 136, 0.35)",
      dotRadiusPx: 3.0,
      maxVehiclesPerTrack: 3,
    });
  }

  // Progressive modern isochrone expansion
  for (const [mStr, fillAlpha] of [
    ["10", 0.12],
    ["20", 0.14],
    ["30", 0.20],
  ] as const) {
    const mVal = Number(mStr);
    if (simMinutes >= mVal - 5) {
      const w = smoothstep(mVal - 5, mVal, simMinutes);
      ctx.save();
      ctx.globalAlpha *= w;
      traceGeoShapes(ctx, city.isochrones.modern[mStr], vt);
      ctx.fillStyle = `rgba(13, 148, 136, ${fillAlpha})`;
      ctx.fill();

      if (mVal === 30) {
        ctx.strokeStyle = "#0d9488";
        ctx.lineWidth = simMinutes >= 30 ? 2.6 : 3.0;
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(13, 148, 136, 0.6)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. --- LSOA DOT IGNITION & STRANDED SUBURBS ---
  for (let i = 0; i < city.lsoas.length; i++) {
    const l = city.lsoas[i];
    const [x, y] = vt.project(l[0], l[1]);
    if (x < -10 || x > vt.width + 10 || y < -10 || y > vt.height + 10) continue;

    const inHist30 = l[3] !== null && l[3] <= 30;
    const m = l[4];
    const reachedByModernNow = m !== null && m <= simMinutes;

    if (reachedByModernNow) {
      const age = simMinutes - m;
      const isJustArrived = age < 2.5 && simMinutes < 35;
      if (isJustArrived) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 4.0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = m <= 30 ? "#0d9488" : "rgba(13, 148, 136, 0.55)";
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (simMinutes >= 28 && inHist30) {
      // Stranded suburban LSOAs: reached by 1930s-1950s trams, but missed by modern buses!
      const w = smoothstep(28, 33, simMinutes);
      const pulse = 0.75 + 0.25 * Math.sin(globalTime * 3 + i);
      ctx.fillStyle = `rgba(225, 29, 72, ${0.9 * w * pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (inHist30) {
      ctx.fillStyle = "rgba(124, 58, 237, 0.35)";
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Central Employment Hub Beacon
  ctx.save();
  const hubPulse = 1 + 0.2 * Math.sin(globalTime * 3);
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26 * hubPulse);
  hg.addColorStop(0, "rgba(13, 148, 136, 0.45)");
  hg.addColorStop(0.4, "rgba(13, 148, 136, 0.15)");
  hg.addColorStop(1, "rgba(13, 148, 136, 0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, 26 * hubPulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0d9488";
  ctx.beginPath();
  ctx.arc(cx, cy, 5.0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Central hub label badge
  const hubLabel = city.slug === 'liverpool' ? 'PIER HEAD · TRAM TERMINUS' : city.centre.name || city.displayName;
  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  const hlw = ctx.measureText(hubLabel).width + 18;
  const hbx = cx + 14;
  const hby = cy - 13;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(hbx, hby, hlw, 26, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#7c3aed';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(hubLabel, hbx + 9, cy);
  ctx.restore();

  // 4. --- CLEAN COMPACT COMPARISON PILL (TOP-LEFT OF STAGE) ---
  ctx.save();
  const hudX = vt.stageX + 20;
  const hudY = vt.stageY + 20;
  const hudW = 428;
  const hudH = 66;

  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.beginPath();
  ctx.roundRect(hudX, hudY, hudW, hudH, 16);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const currentReached = Math.round(mPop * clamp(simMinutes / 30, 0, 1));
  ctx.font = "600 14px \"JetBrains Mono\", monospace";
  ctx.fillStyle = "#7000ff";
  ctx.textAlign = "left";
  ctx.fillText(`${clockStr}  ·  Tram ${Math.round(hPop / 1000)}k`, hudX + 18, hudY + 26);

  ctx.fillStyle = "#009e86";
  ctx.textAlign = "right";
  ctx.fillText(
    `2026 ${Math.round(currentReached / 1000)}k (${simMinutes >= 30 ? `−${dropPct}%` : `+${Math.min(30, Math.round(simMinutes))}m`})`,
    hudX + hudW - 18,
    hudY + 26
  );

  const barX = hudX + 18;
  const barY = hudY + 41;
  const barW = hudW - 36;
  const barH = 8;

  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 4);
  ctx.fill();

  const fillW = barW * clamp(simMinutes / 30, 0, 1);
  ctx.fillStyle = "#00a88f";
  ctx.beginPath();
  ctx.roundRect(barX, barY, fillW, barH, 4);
  ctx.fill();
  ctx.restore();

  // 5. --- CONCISE CORRIDOR CALLOUT BADGE ---
  if (simMinutes >= 26) {
    const calloutAlpha = smoothstep(26, 32, simMinutes);
    ctx.save();
    ctx.globalAlpha = calloutAlpha;

    const calloutByCity: Record<string, { lon: number; lat: number; title: string; note: string; dir: [number, number] }> = {
      leeds: {
        lon: -1.549,
        lat: 53.755,
        title: "Middleton corridor",
        note: "Reserved tram → slow bus",
        dir: [1, 1],
      },
      liverpool: {
        lon: -2.915,
        lat: 53.435,
        title: "Norris Green & Clubmoor",
        note: "+15 min slower between rail lines",
        dir: [1, -1],
      },
      manchester: {
        lon: -2.235,
        lat: 53.481,
        title: "Piccadilly arterials",
        note: "41 tram lines replaced by buses",
        dir: [1, 1],
      },
      sheffield: {
        lon: -1.455,
        lat: 53.402,
        title: "22 valley tram lines",
        note: "Out-reached all 2026 modes",
        dir: [1, -1],
      },
      birmingham: {
        lon: -1.875,
        lat: 52.465,
        title: "Harborne & Yardley",
        note: "+16 min slower on inner buses",
        dir: [1, 1],
      },
    };

    const callout = calloutByCity[city.slug];
    if (callout) {
      const [ax, ay] = vt.project(callout.lon, callout.lat);
      const [dx, dy] = callout.dir;
      const lx = ax + dx * 38;
      const ly = ay + dy * 28;

      ctx.font = "600 14.5px \"Plus Jakarta Sans\", sans-serif";
      const w1 = ctx.measureText(callout.title).width;
      ctx.font = "400 13px \"Plus Jakarta Sans\", sans-serif";
      const w2 = ctx.measureText(callout.note).width;
      const cardW = Math.max(w1, w2) + 32;
      const cardH = 56;
      const bx = clamp(dx > 0 ? lx : lx - cardW, vt.stageX + 18, vt.stageX + vt.stageW - cardW - 18);
      const by = clamp(dy > 0 ? ly : ly - cardH, vt.stageY + 100, vt.stageY + vt.stageH - cardH - 18);

      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(dx > 0 ? bx : bx + cardW, by + cardH * 0.5);
      ctx.stroke();

      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.arc(ax, ay, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#fecdd3";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(bx, by, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#be123c";
      ctx.font = "600 14.5px \"Plus Jakarta Sans\", sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(callout.title, bx + 16, by + 10);

      ctx.fillStyle = "#475569";
      ctx.font = "400 13px \"Plus Jakarta Sans\", sans-serif";
      ctx.fillText(callout.note, bx + 16, by + 32);
    }

    ctx.restore();
  }

  ctx.restore();
}


function renderManchesterWartime(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  _globalTime: number
) {
  const reveal = olmoEase(clamp(slideElapsed / 1.2, 0, 1));

  // 1. 1933 Pre-war Peak as dashed outer golden ghost contour (414,675)
  ctx.save();
  traceGeoShapes(ctx, city.isochrones.historical['30'], vt);
  ctx.setLineDash([6, 5]);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.45)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // 2. April 1943 Wartime Blackout 30-min reach (372,663) in vibrant purple
  if (city.era1943) {
    ctx.save();
    ctx.globalAlpha *= reveal;
    traceGeoShapes(ctx, city.era1943.isochrones['30'], vt);
    ctx.fillStyle = 'rgba(124, 58, 237, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  }

  // 3. 2026 Bus + Metrolink 30-min reach (293,237) nested inside in teal
  ctx.save();
  traceGeoShapes(ctx, city.isochrones.modern['30'], vt);
  ctx.fillStyle = 'rgba(13, 148, 136, 0.16)';
  ctx.fill();
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.0;
  ctx.stroke();
  ctx.restore();

  // LSOAs colored by whether 1943 wartime beat 2026!
  for (const l of city.lsoas) {
    const [x, y] = vt.project(l[0], l[1]);
    const h43 = l[7];
    const m26 = l[4];
    const in43 = h43 !== null && h43 <= 30;
    const in26 = m26 !== null && m26 <= 30;
    ctx.fillStyle =
      in43 && !in26
        ? '#7c3aed'
        : in26
          ? '#0d9488'
          : 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.arc(x, y, in43 && !in26 ? 2.4 : 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tram tracks
  ctx.beginPath();
  for (const seg of city.tramLines) traceRing(ctx, seg, vt);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function renderUnderservedScene(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  city: CityData,
  slideElapsed: number,
  globalTime: number
) {
  const reveal = olmoEase(clamp(slideElapsed / 1.0, 0, 1));

  // Historical 30-min silhouette + ghost tramway skeleton showing the lost corridors
  ctx.save();
  traceGeoShapes(ctx, city.isochrones.historical['30'], vt);
  ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
  ctx.fill();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.45)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();

  // Modern rail lines for spatial contrast
  for (const ml of city.modernLines) {
    ctx.beginPath();
    traceRing(ctx, ml.coords, vt);
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }

  // Ghost purple tram lines
  ctx.beginPath();
  for (const seg of city.tramLines) traceRing(ctx, seg, vt);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // LSOA dots: non-underserved dimmed, underserved glowing coral-rose
  for (let i = 0; i < city.lsoas.length; i++) {
    const l = city.lsoas[i];
    const [x, y] = vt.project(l[0], l[1]);
    if (l[5] === 1) {
      const pulse = 0.85 + 0.15 * Math.sin(globalTime * 3 + i * 0.5);
      ctx.fillStyle = `rgba(225, 29, 72, ${0.9 * reveal * pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, 3.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


function renderTransPennineExpanse(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  overview: OverviewData,
  slideElapsed: number,
  globalTime: number
) {
  // 1. All Northern surveyed municipal tramway skeletons
  ctx.save();
  for (const oc of overview.cities) {
    if (oc.slug === 'birmingham') continue; // Focus on Northern Pennine belt
    ctx.beginPath();
    for (const seg of oc.skeleton) {
      traceRing(ctx, seg, vt);
    }
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw East (Yorkshire) and West (Lancashire) lines
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // East tracks (Leeds -> Todmorden)
  ctx.beginPath();
  traceRing(ctx, TP_CORRIDOR_EAST, vt);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // West tracks (Littleborough -> Liverpool)
  ctx.beginPath();
  traceRing(ctx, TP_CORRIDOR_WEST, vt);
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.25)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 3. The Todmorden Gap (dashed teal bridge line across the mountain pass)
  const [gx1, gy1] = vt.project(TP_GAP_START[0], TP_GAP_START[1]);
  const [gx2, gy2] = vt.project(TP_GAP_END[0], TP_GAP_END[1]);

  ctx.save();
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -globalTime * 14;
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.stroke();
  ctx.restore();

  // Gap callout badge
  const gmx = (gx1 + gx2) * 0.5 + 16;
  const gmy = (gy1 + gy2) * 0.5 - 38;
  ctx.save();
  ctx.font = '700 12.5px "JetBrains Mono", monospace';
  const gtxt = '★ THE TODMORDEN GAP · 7.5 MILES (SUMMIT PASS)';
  const gtw = ctx.measureText(gtxt).width + 24;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0d9488';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(gmx, gmy - 14, gtw, 28, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#0f766e';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(gtxt, gmx + 12, gmy);

  ctx.font = '500 11.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Only interruption in 68 unbroken miles of streetcar track', gmx + 12, gmy + 22);
  ctx.restore();

  // 4. Towns along the Trans-Pennine Line
  const CITIES_LABELED = [
    { name: 'LEEDS (Briggate)', lon: -1.5419, lat: 53.7976, pop: '433k reach', dx: 14, dy: -18 },
    { name: 'BRADFORD', lon: -1.753, lat: 53.793, pop: '280k reach', dx: 14, dy: 16 },
    { name: 'HALIFAX', lon: -1.86, lat: 53.725, pop: '98k reach', dx: -120, dy: -24 },
    { name: 'TODMORDEN', lon: -2.098, lat: 53.714, pop: 'Yorks Terminus', dx: -130, dy: 8 },
    { name: 'LITTLEBOROUGH', lon: -2.095, lat: 53.642, pop: 'Lancs Terminus', dx: 14, dy: -14 },
    { name: 'ROCHDALE', lon: -2.158, lat: 53.615, pop: '95k reach', dx: 14, dy: 16 },
    { name: 'MANCHESTER (Piccadilly)', lon: -2.237, lat: 53.481, pop: '414k reach', dx: 14, dy: 18 },
    { name: 'ST HELENS', lon: -2.735, lat: 53.452, pop: '105k reach', dx: 14, dy: -16 },
    { name: 'LIVERPOOL (Pier Head)', lon: -2.996, lat: 53.405, pop: '245k reach', dx: 14, dy: 16 },
  ];

  const minStageX = vt.stageX + 16;
  const maxStageX = vt.stageX + vt.stageW - 16;

  for (const c of CITIES_LABELED) {
    const [px, py] = vt.project(c.lon, c.lat);

    ctx.fillStyle = '#7000ff';
    ctx.beginPath();
    ctx.arc(px, py, 5.0, 0, Math.PI * 2);
    ctx.fill();

    const pulse = 0.5 + 0.5 * Math.sin(globalTime * 3 + px * 0.1);
    ctx.strokeStyle = `rgba(112, 0, 255, ${0.42 * pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(px, py, 8 + pulse * 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    const wName = ctx.measureText(c.name).width;
    ctx.font = '500 11.5px "JetBrains Mono", monospace';
    const wPop = ctx.measureText(c.pop).width;
    const cardW = Math.max(wName, wPop) + 22;
    const cardH = 40;

    let bx = c.dx > 0 ? px + 14 : px - cardW - 14;
    if (bx < minStageX) bx = px + 14;
    if (bx + cardW > maxStageX) bx = px - cardW - 14;
    bx = clamp(bx, minStageX, maxStageX - cardW);
    const by = clamp(py + c.dy - cardH * 0.5, vt.stageY + 64, vt.stageY + vt.stageH - cardH - 14);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(bx > px ? bx : bx + cardW, by + cardH * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(bx, by, cardW, cardH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(c.name, bx + 11, by + 6);

    ctx.fillStyle = '#7000ff';
    ctx.font = '500 11.5px "JetBrains Mono", monospace';
    ctx.fillText(c.pop, bx + 11, by + 22);
    ctx.restore();
  }

  // 5. Animated Tram Emoji cruising along the entire line
  const TP_FULL_LINE = [...TP_CORRIDOR_EAST, ...TP_CORRIDOR_WEST];
  const loopT = ((globalTime * 0.04) % 1);
  const totalSegs = TP_FULL_LINE.length - 1;
  const segIdx = Math.min(totalSegs - 1, Math.floor(loopT * totalSegs));
  const segFrac = loopT * totalSegs - segIdx;
  const pA = TP_FULL_LINE[segIdx];
  const pB = TP_FULL_LINE[segIdx + 1];
  const curLon = pA[0] + (pB[0] - pA[0]) * segFrac;
  const curLat = pA[1] + (pB[1] - pA[1]) * segFrac;
  const [tx, ty] = vt.project(curLon, curLat);

  ctx.save();
  ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🚋', tx, ty - 6);
  ctx.restore();

  // 6. Clean Stage Top Pill
  ctx.save();
  const badgeX = vt.stageX + vt.stageW * 0.5;
  const badgeY = vt.stageY + 32;
  const tag = '68-mile electric chain  ·  >4,200 trams (c. 1930)';
  ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
  const bw = ctx.measureText(tag).width + 36;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#7000ff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(badgeX - bw * 0.5, badgeY - 18, bw, 36, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7000ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tag, badgeX, badgeY + 0.5);
  ctx.restore();

  ctx.restore();
}

let featheredSatCanvas: HTMLCanvasElement | null = null;
let featheredSatSource: HTMLImageElement | null = null;

function getFeatheredSatelliteCanvas(img: HTMLImageElement): HTMLCanvasElement {
  if (featheredSatCanvas && featheredSatSource === img) {
    return featheredSatCanvas;
  }
  const oc = document.createElement('canvas');
  oc.width = img.naturalWidth;
  oc.height = img.naturalHeight;
  const octx = oc.getContext('2d');
  if (!octx) return oc;

  // 1. Draw base satellite imagery with vivid topographical contrast
  octx.filter = 'contrast(1.18) saturate(1.24) brightness(1.02)';
  octx.drawImage(img, 0, 0);
  octx.filter = 'none';

  // 2. Feather all borders smoothly so zero hard lines or cutoffs are visible:
  // - West: Irish Sea fades softly west of Liverpool / Blackpool
  // - East: North Sea fades softly east of Hull / Spurn Head
  // - North: Dales / North Pennines fade smoothly into cartographic backdrop
  // - South: Peak District south of Sheffield fades smoothly, hiding southern Midlands
  octx.globalCompositeOperation = 'destination-in';

  // Horizontal feather (fade in Irish Sea and North Sea)
  const hGrad = octx.createLinearGradient(0, 0, oc.width, 0);
  hGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  hGrad.addColorStop(110 / oc.width, 'rgba(0, 0, 0, 1)'); // West (Irish Sea)
  hGrad.addColorStop(1210 / oc.width, 'rgba(0, 0, 0, 1)'); // East (North Sea)
  hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  octx.fillStyle = hGrad;
  octx.fillRect(0, 0, oc.width, oc.height);

  // Vertical feather (fade in North Pennines and South of Sheffield)
  const vGrad = octx.createLinearGradient(0, 0, 0, oc.height);
  vGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vGrad.addColorStop(150 / oc.height, 'rgba(0, 0, 0, 1)'); // North (Dales/Pennines)
  vGrad.addColorStop(840 / oc.height, 'rgba(0, 0, 0, 1)'); // South of Sheffield
  vGrad.addColorStop(1080 / oc.height, 'rgba(0, 0, 0, 0)'); // Midlands
  vGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  octx.fillStyle = vGrad;
  octx.fillRect(0, 0, oc.width, oc.height);

  featheredSatCanvas = oc;
  featheredSatSource = img;
  return oc;
}

function renderNorthernMegaCity(
  ctx: CanvasRenderingContext2D,
  vt: ViewportTransform,
  overview: OverviewData,
  slideElapsed: number,
  globalTime: number,
  satelliteImg?: HTMLImageElement | null,
  nightSatelliteImg?: HTMLImageElement | null
) {
  const stageX = vt.stageX;
  const stageY = vt.stageY;
  const stageW = vt.stageW;
  const stageH = vt.stageH;

  // Clip the entire nocturnal satellite view strictly within the stage card
  // This preserves the crisp light background and readability of SlideHeader and NarrativeCard
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageW, stageH, 22);
  ctx.clip();

  // Dark nocturnal atmosphere backdrop inside stage card
  ctx.fillStyle = '#030712';
  ctx.fillRect(stageX, stageY, stageW, stageH);

  // 0. High-Resolution Real Nighttime Earth Imagery of the UK (NASA VIIRS city lights)
  const activeSat = (nightSatelliteImg && nightSatelliteImg.complete && nightSatelliteImg.naturalWidth > 0)
    ? nightSatelliteImg
    : satelliteImg;

  if (activeSat && activeSat.complete && activeSat.naturalWidth > 0) {
    ctx.save();
    if (activeSat === nightSatelliteImg) {
      // High-resolution NASA VIIRS Black Marble composite (EPSG:4326 square-pixel bounds)
      const [xTL, yTL] = vt.project(-11.5, 60.0);
      const [xBR, yBR] = vt.project(3.5, 49.0);
      const imgW = xBR - xTL;
      const imgH = yBR - yTL;

      ctx.globalAlpha = 0.98;
      ctx.drawImage(activeSat, xTL, yTL, imgW, imgH);
    } else {
      const satCanvas = getFeatheredSatelliteCanvas(activeSat);
      const [xTL, yTL] = vt.project(-3.515625, 54.57206165565852);
      const [xBR, yBR] = vt.project(0.0, 52.05249047600099);
      const imgW = xBR - xTL;
      const imgH = yBR - yTL;

      ctx.globalAlpha = 0.88;
      ctx.drawImage(satCanvas, xTL, yTL, imgW, imgH);
    }
    ctx.restore();
  }

  // 1. Municipal Tramway Skeletons across Northern Cities (Excluding Midlands)
  ctx.save();
  for (const oc of overview.cities) {
    if (oc.slug === 'birmingham') continue;
    ctx.beginPath();
    for (const seg of oc.skeleton) {
      traceRing(ctx, seg, vt);
    }
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.75)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.restore();

  // 2. The Core Trans-Pennine Megacity Nodes
  interface MegacityNode {
    slug: string;
    name: string;
    lon: number;
    lat: number;
    pop: string;
    alignX: 'left' | 'right' | 'center';
    offsetY: number;
  }

  const NODES: MegacityNode[] = [
    { slug: 'liverpool', name: 'Liverpool', lon: -2.9961, lat: 53.4048, pop: '1.6M', alignX: 'left', offsetY: -10 },
    { slug: 'manchester', name: 'Manchester', lon: -2.2372, lat: 53.4811, pop: '2.9M', alignX: 'center', offsetY: 20 },
    { slug: 'leeds', name: 'Leeds', lon: -1.5419, lat: 53.7976, pop: '2.4M', alignX: 'right', offsetY: -14 },
    { slug: 'sheffield', name: 'Sheffield', lon: -1.4651, lat: 53.3831, pop: '1.4M', alignX: 'right', offsetY: 16 },
  ];

  // 3. Contain the 4-city agglomeration in an elegant luminous circle (rather than link with purple lines)
  // Center is (-2.18, 53.55), radius 66 km encompasses Liverpool, Manchester, Leeds, and Sheffield
  const [circX, circY] = vt.project(-2.18, 53.55);
  const circR = vt.kmToPx(66);
  const reveal = olmoEase(clamp(slideElapsed / 1.2, 0, 1));
  const rNow = circR * (0.92 + 0.08 * reveal);

  ctx.save();
  ctx.globalAlpha = reveal;

  // Very faint translucent interior tint that keeps the satellite lights 100% visible
  ctx.fillStyle = 'rgba(168, 85, 247, 0.03)';
  ctx.beginPath();
  ctx.arc(circX, circY, rNow, 0, Math.PI * 2);
  ctx.fill();

  // Soft atmospheric outer glow ring
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.28)';
  ctx.lineWidth = 6.0;
  ctx.stroke();

  // Crisp perimeter boundary ring
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.90)';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Subtle animated dashed precision track
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  ctx.lineDashOffset = -globalTime * 14;
  ctx.stroke();
  ctx.setLineDash([]);

  // Minimal circular callout pill on top rim of circle
  const badgeText = '8.3M POLYCENTRIC NORTH · 40-MILE RADIUS';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  const badgeW = ctx.measureText(badgeText).width + 18;
  const badgeH = 22;
  const badgeX = circX - badgeW * 0.5;
  const badgeY = circY - rNow - 16;

  ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.65)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 11);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e9d5ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, circX, badgeY + badgeH * 0.5);
  ctx.restore();

  // 4. City Hub Beacons & Minimalist Floating Labels (Does NOT cover up the satellite image)
  for (const n of NODES) {
    const [nx, ny] = vt.project(n.lon, n.lat);
    const pulse = 1 + 0.16 * Math.sin(globalTime * 3.0 + nx * 0.05);

    // Glowing beacon halo
    const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 16 * pulse);
    g.addColorStop(0, 'rgba(192, 132, 252, 0.90)');
    g.addColorStop(0.35, 'rgba(168, 85, 247, 0.35)');
    g.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nx, ny, 16 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Solid pin center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Minimal text with dark shadow (no bulky white boxes)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    let textX = nx;
    if (n.alignX === 'left') textX = nx - 10;
    else if (n.alignX === 'right') textX = nx + 10;

    const textY = ny + n.offsetY;

    // Subtle hairline leader if offset
    if (Math.abs(n.offsetY) > 6 && n.alignX !== 'center') {
      ctx.save();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(textX, textY);
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = n.alignX;
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, textX, textY - 6);

    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#c084fc';
    ctx.fillText(n.pop, textX, textY + 7);
    ctx.restore();
  }

  // 5. London Benchmark (Minimal beacon + floating text, no opaque card)
  const [lx, ly] = vt.project(-0.1278, 51.5074);
  if (lx > vt.stageX && lx < vt.stageX + vt.stageW && ly > vt.stageY && ly < vt.stageY + vt.stageH - 10) {
    const lPulse = 1 + 0.14 * Math.sin(globalTime * 2.5);
    const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 16 * lPulse);
    lg.addColorStop(0, 'rgba(234, 179, 8, 0.90)');
    lg.addColorStop(0.35, 'rgba(234, 179, 8, 0.35)');
    lg.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 16 * lPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('London', lx + 12, ly - 6);

    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#facc15';
    ctx.fillText('8.9M · Benchmark', lx + 12, ly + 7);
    ctx.restore();
  }

  // End clip of the stage card
  ctx.restore();

  // Draw stage card subtle purple/slate border
  ctx.save();
  ctx.strokeStyle = 'rgba(112, 0, 255, 0.35)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.roundRect(stageX, stageY, stageW, stageH, 22);
  ctx.stroke();
  ctx.restore();
}
