import { CameraSpec } from '../types';

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * OlmoEarth-inspired expressive quintic/cubic-bezier(0.32, 0.72, 0, 1) ease-out
 * for elastic wipes, stack fan-outs, and camera arrivals.
 */
export function olmoEase(t: number): number {
  const x = clamp(t, 0, 1);
  // Close analytical match to cubic-bezier(0.32, 0.72, 0, 1)
  return 1 - Math.pow(1 - x, 3.4);
}

export function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/**
 * Critically-damped 1D spring step (exact analytical/semi-implicit integration)
 * modeled on OlmoEarth's spring clock.
 */
export function stepSpring(
  pos: number,
  vel: number,
  target: number,
  omega: number,
  dt: number
): [number, number] {
  const d = Math.min(dt, 0.064);
  const exp = Math.exp(-omega * d);
  const delta = pos - target;
  const newPos = target + (delta + (vel + omega * delta) * d) * exp;
  const newVel = (vel - (vel + omega * delta) * omega * d) * exp;
  if (Math.abs(newPos - target) < 0.00015 && Math.abs(newVel) < 0.0005) {
    return [target, 0];
  }
  return [newPos, newVel];
}

/**
 * Hyperbolic log-zoom camera flight (like van Wijk & Nuij / OlmoEarth userPose):
 * Interpolates spanKm in log-space AND gently lifts camera altitude proportional
 * to lateral ground distance when flying from one UK city to another!
 */
export function interpolateCamera(a: CameraSpec, b: CameraSpec, rawT: number): CameraSpec {
  const t = easeInOutCubic(rawT);
  const cosLat = Math.cos(((a.lat + b.lat) * 0.5 * Math.PI) / 180);
  const dxKm = (b.lon - a.lon) * 111.32 * cosLat;
  const dyKm = (b.lat - a.lat) * 111.32;
  const distKm = Math.hypot(dxKm, dyKm);

  const logA = Math.log(Math.max(1, a.spanKm));
  const logB = Math.log(Math.max(1, b.spanKm));
  let spanKm = Math.exp(lerp(logA, logB, t));

  // Add subtle parabolic flight arc when hopping between cities (> 20km apart)
  // while both endpoints are city-scale (< 250km span)
  if (distKm > 20 && Math.max(a.spanKm, b.spanKm) < 250) {
    const bump = Math.sin(Math.PI * t) * Math.min(distKm * 0.72, 165);
    spanKm += bump;
  }

  return {
    lon: lerp(a.lon, b.lon, t),
    lat: lerp(a.lat, b.lat, t),
    spanKm,
    offsetX: lerp(a.offsetX ?? 0, b.offsetX ?? 0, t),
  };
}

export interface SlideLayoutMetrics {
  padX: number;
  headerTop: number;
  stageY: number;
  stageH: number;
  leftColW: number;
  dividerX: number;
  stageX: number;
  stageW: number;
  footerBottom: number;
}

export function computeSlideLayout(width: number, height: number): SlideLayoutMetrics {
  const padX = Math.round(clamp(width * 0.046, 48, 92));
  const headerTop = Math.round(clamp(height * 0.040, 26, 46));
  const stageY = Math.round(clamp(height * 0.155, 130, 168));
  const footerReserve = Math.round(clamp(height * 0.042, 32, 48));
  const stageH = Math.max(380, height - stageY - footerReserve);
  const leftColW = Math.round(clamp(width * 0.228, 332, 438));
  const gapHalf = Math.round(clamp(width * 0.015, 18, 28));
  const dividerX = padX + leftColW + gapHalf;
  const stageX = dividerX + gapHalf;
  const stageW = Math.max(420, width - padX - stageX);
  const footerBottom = Math.round(clamp(height * 0.022, 16, 26));

  return {
    padX,
    headerTop,
    stageY,
    stageH,
    leftColW,
    dividerX,
    stageX,
    stageW,
    footerBottom,
  };
}

export interface ViewportTransform {
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  stageW: number;
  stageH: number;
  centerLon: number;
  centerLat: number;
  pxPerDegLon: number;
  pxPerDegLat: number;
  focalX: number;
  focalY: number;
  project: (lon: number, lat: number) => [number, number];
  unproject: (x: number, y: number) => [number, number];
  kmToPx: (km: number) => number;
}

export function createViewportTransform(
  width: number,
  height: number,
  cam: CameraSpec,
  stageRect?: { x: number; y: number; w: number; h: number }
): ViewportTransform {
  const stageX = stageRect ? stageRect.x : 0;
  const stageY = stageRect ? stageRect.y : 0;
  const stageW = stageRect ? stageRect.w : width;
  const stageH = stageRect ? stageRect.h : height;

  const pxPerKm = stageH / Math.max(1, cam.spanKm);
  const cosLat = Math.cos((cam.lat * Math.PI) / 180);
  const pxPerDegLat = pxPerKm * 111.32;
  const pxPerDegLon = pxPerKm * 111.32 * cosLat;
  const focalX = stageRect
    ? stageX + stageW * 0.5
    : width * (0.5 + (cam.offsetX ?? 0));
  const focalY = stageRect ? stageY + stageH * 0.5 : height * 0.5;

  return {
    width,
    height,
    stageX,
    stageY,
    stageW,
    stageH,
    centerLon: cam.lon,
    centerLat: cam.lat,
    pxPerDegLon,
    pxPerDegLat,
    focalX,
    focalY,
    project(lon: number, lat: number): [number, number] {
      const x = focalX + (lon - cam.lon) * pxPerDegLon;
      const y = focalY - (lat - cam.lat) * pxPerDegLat;
      return [x, y];
    },
    unproject(x: number, y: number): [number, number] {
      const lon = cam.lon + (x - focalX) / pxPerDegLon;
      const lat = cam.lat - (y - focalY) / pxPerDegLat;
      return [lon, lat];
    },
    kmToPx(km: number): number {
      return km * pxPerKm;
    },
  };
}

export function pointToSegmentDistSq(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return (px - x1) ** 2 + (py - y1) ** 2;
  const t = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2;
}
