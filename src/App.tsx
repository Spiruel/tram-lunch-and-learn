import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SLIDES } from './slides';
import { CityData, OverviewData, SceneType } from './types';
import {
  clamp,
  computeSlideLayout,
  createViewportTransform,
  olmoEase,
} from './engine/math';
import { renderCartographicBackdrop, renderMapStage } from './engine/renderMapStage';
import { renderPipelineStage } from './engine/renderPipelineStage';
import { renderChartsStage } from './engine/renderChartsStage';
import { renderFrontMarks } from './engine/renderFrontMarks';
import { NarrativeCard } from './components/NarrativeCard';
import { SlideHeader } from './components/SlideHeader';
import { TitleSlide } from './components/TitleSlide';
import { ComparisonSlide } from './components/ComparisonSlide';
import { ClosingSlide } from './components/ClosingSlide';
import { WatchRemoteController } from './components/WatchRemoteController';

const CITY_SLUGS = ['leeds', 'liverpool', 'manchester', 'sheffield', 'birmingham'] as const;

function isMapScene(scene: SceneType): boolean {
  return (
    scene === 'uk-cover' ||
    scene === 'birmingham-small-city' ||
    scene === 'car-collapse' ||
    scene === 'uk-archive-orbit' ||
    scene === 'raptor-wave' ||
    scene === 'city-wipe' ||
    scene === 'city-historical' ||
    scene === 'city-crossfade' ||
    scene === 'trans-pennine-expanse' ||
    scene === 'leeds-stress' ||
    scene === 'city-wartime' ||
    scene === 'city-underserved' ||
    scene === 'northern-megacity' ||
    scene === 'finale-explorer'
  );
}

function isPipelineScene(scene: SceneType): boolean {
  return (
    scene === 'crich-desk' ||
    scene === 'surya-bands' ||
    scene === 'surya-ocr' ||
    scene === 'track-interp' ||
    scene === 'gtfs-stack'
  );
}

function isChartScene(scene: SceneType): boolean {
  return (
    scene === 'londonmaxxing' ||
    scene === 'agglomeration-theory' ||
    scene === 'remote-agglomeration' ||
    scene === 'centre-for-cities' ||
    scene === 'netherlands-backtest' ||
    scene === 'natural-experiment' ||
    scene === 'productivity-chart' ||
    scene === 'frost-car-objection' ||
    scene === 'exchange-published' ||
    scene === 'talk-outline' ||
    scene === 'harehills-triptych' ||
    scene === 'leeds-stress' ||
    scene === 'tramway-conspiracy' ||
    scene === 'five-city-scoreboard' ||
    scene === 'two-speed-curves' ||
    scene === 'polycentric-north'
  );
}

export const App: React.FC = () => {
  const parseHash = (): { slideIdx: number; step: number } => {
    const raw = window.location.hash.replace('#', '').trim();
    if (!raw) return { slideIdx: 0, step: 0 };
    const parts = raw.split(/[:.]/);
    const num = parseInt(parts[0], 10);
    const step = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (!isNaN(num) && num >= 1 && num <= SLIDES.length) {
      return { slideIdx: num - 1, step: Math.max(0, isNaN(step) ? 0 : step) };
    }
    const idx = SLIDES.findIndex((s) => s.id === parts[0]);
    return { slideIdx: idx >= 0 ? idx : 0, step: Math.max(0, isNaN(step) ? 0 : step) };
  };

  const initialParsed = parseHash();
  const [slideIndex, setSlideIndex] = useState<number>(initialParsed.slideIdx);
  const [subStep, setSubStep] = useState<number>(initialParsed.step);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [cities, setCities] = useState<Record<string, CityData>>({});

  const shellRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSizeKeyRef = useRef<string>('');

  // Mutable animation & pointer refs for zero-re-render 60/120fps canvas loop
  const targetIndexRef = useRef<number>(initialParsed.slideIdx);
  const subStepRef = useRef<number>(initialParsed.step);
  const slideEnteredAtRef = useRef<number>(performance.now() / 1000);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const scanImgRef = useRef<HTMLImageElement | null>(null);
  const satelliteImgRef = useRef<HTMLImageElement | null>(null);
  const nightSatelliteImgRef = useRef<HTMLImageElement | null>(null);
  const frostAvatarImgRef = useRef<HTMLImageElement | null>(null);
  const wheelCooldownRef = useRef<number>(0);

  const currentSlide = SLIDES[slideIndex];
  const layoutMode = currentSlide.slideLayout || (slideIndex === 0 ? 'cover' : 'split');

  const goToSlide = useCallback((nextIdx: number, targetSubStep: number = 0) => {
    const clamped = clamp(nextIdx, 0, SLIDES.length - 1);
    const maxSub = (SLIDES[clamped].subSteps || 1) - 1;
    const clampedSub = clamp(targetSubStep, 0, maxSub);
    subStepRef.current = clampedSub;
    setSubStep(clampedSub);
    const newHash = clampedSub > 0 ? `${clamped + 1}.${clampedSub}` : String(clamped + 1);
    if (window.location.hash.replace('#', '') !== newHash) {
      window.location.hash = newHash;
    }
    if (clamped === targetIndexRef.current) return;
    targetIndexRef.current = clamped;
    slideEnteredAtRef.current = performance.now() / 1000;
    setSlideIndex(clamped);
  }, []);

  useEffect(() => {
    (window as any).goToSlide = goToSlide;
    (window as any).__deckSetSlide = (idx: number, step: number = 0) => {
      goToSlide(idx, step);
    };
    const onHashChange = () => {
      const parsed = parseHash();
      if (parsed.slideIdx !== targetIndexRef.current || parsed.step !== subStepRef.current) {
        goToSlide(parsed.slideIdx, parsed.step);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [goToSlide]);

  const stepForward = useCallback(() => {
    const curSlide = SLIDES[targetIndexRef.current];
    const totalSteps = curSlide.subSteps || 1;
    if (subStepRef.current < totalSteps - 1) {
      const nextSub = subStepRef.current + 1;
      goToSlide(targetIndexRef.current, nextSub);
      return;
    }
    goToSlide(targetIndexRef.current + 1, 0);
  }, [goToSlide]);

  const stepBackward = useCallback(() => {
    if (subStepRef.current > 0) {
      const prevSub = subStepRef.current - 1;
      goToSlide(targetIndexRef.current, prevSub);
      return;
    }
    const prevIdx = targetIndexRef.current - 1;
    if (prevIdx >= 0) {
      const prevSlide = SLIDES[prevIdx];
      const prevMax = (prevSlide.subSteps || 1) - 1;
      goToSlide(prevIdx, prevMax);
    }
  }, [goToSlide]);

  // Preload overview, all 5 city bundles, Leeds Crich booklet scan, and Northern satellite imagery
  useEffect(() => {
    fetch('/data/overview.json')
      .then((r) => r.json())
      .then((d: OverviewData) => setOverview(d))
      .catch((err) => console.error('Failed loading overview.json', err));

    CITY_SLUGS.forEach((slug) => {
      fetch(`/data/${slug}.json`)
        .then((r) => r.json())
        .then((d: CityData) => {
          setCities((prev) => ({ ...prev, [slug]: d }));
        })
        .catch((err) => console.error(`Failed loading ${slug}.json`, err));
    });

    const img = new Image();
    img.src = '/scans/lds_p12-13.jpg';
    scanImgRef.current = img;

    const satImg = new Image();
    satImg.src = '/maps/northern_satellite.jpg';
    satelliteImgRef.current = satImg;

    const nightSatImg = new Image();
    nightSatImg.src = '/maps/uk_night_satellite.jpg';
    nightSatelliteImgRef.current = nightSatImg;

    const frostImg = new Image();
    frostImg.src = '/frost_avatar.png';
    frostAvatarImgRef.current = frostImg;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) stepBackward();
        else stepForward();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        stepForward();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        stepBackward();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepForward, stepBackward]);

  // Click on background/stage advances step or slide
  useEffect(() => {
    const onWindowClick = (e: MouseEvent) => {
      // Don't intercept clicks on buttons, links, or inputs
      if ((e.target as HTMLElement)?.closest('button, a, input, select, textarea')) return;
      stepForward();
    };
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, [stepForward]);

  // Quantized trackpad/wheel stepping
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 26) return;
      const now = performance.now();
      if (now - wheelCooldownRef.current < 680) return;
      wheelCooldownRef.current = now;
      if (e.deltaY > 0) stepForward();
      else stepBackward();
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, [stepForward, stepBackward]);

  // Main continuous 60/120fps Slide Stage Loop
  useEffect(() => {
    let raf = 0;

    const renderFrame = (nowMs: number) => {
      const nowSec = nowMs / 1000;

      const bgCanvas = bgCanvasRef.current;
      const fgCanvas = fgCanvasRef.current;
      const shell = shellRef.current;
      if (!bgCanvas || !fgCanvas || !shell) {
        raf = requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const layout = computeSlideLayout(w, h);

      const sizeKey = `${w}x${h}@${dpr}`;
      if (lastSizeKeyRef.current !== sizeKey) {
        lastSizeKeyRef.current = sizeKey;
        bgCanvas.width = Math.round(w * dpr);
        bgCanvas.height = Math.round(h * dpr);
        fgCanvas.width = Math.round(w * dpr);
        fgCanvas.height = Math.round(h * dpr);

        shell.style.setProperty('--slide-pad-x', `${layout.padX}px`);
        shell.style.setProperty('--slide-header-top', `${layout.headerTop}px`);
        shell.style.setProperty('--slide-stage-y', `${layout.stageY}px`);
        shell.style.setProperty('--slide-stage-h', `${layout.stageH}px`);
        shell.style.setProperty('--slide-left-w', `${layout.leftColW}px`);
        shell.style.setProperty('--slide-divider-x', `${layout.dividerX}px`);
        shell.style.setProperty('--slide-stage-x', `${layout.stageX}px`);
        shell.style.setProperty('--slide-stage-w', `${layout.stageW}px`);
        shell.style.setProperty('--slide-footer-bottom', `${layout.footerBottom}px`);
      }

      const bgCtx = bgCanvas.getContext('2d');
      const fgCtx = fgCanvas.getContext('2d');
      if (!bgCtx || !fgCtx) {
        raf = requestAnimationFrame(renderFrame);
        return;
      }

      const activeSlide = SLIDES[targetIndexRef.current];
      const activeMode =
        activeSlide.slideLayout || (targetIndexRef.current === 0 ? 'cover' : 'split');
      const slideElapsed = Math.max(0, nowSec - slideEnteredAtRef.current);

      bgCtx.save();
      bgCtx.setTransform(1, 0, 0, 1, 0, 0);
      bgCtx.scale(dpr, dpr);
      fgCtx.save();
      fgCtx.setTransform(1, 0, 0, 1, 0, 0);
      fgCtx.scale(dpr, dpr);

      // Continuous faint cartographic basemap across all presentation slides
      bgCtx.clearRect(0, 0, w, h);
      fgCtx.clearRect(0, 0, w, h);

      let cam = activeSlide.camera || { lon: -1.95, lat: 53.60, spanKm: 160 };
      if (activeSlide.scene === 'northern-megacity') {
        // Smooth zoom framing the UK and revealing the Northern Megacity constellation
        const zoomT = olmoEase(clamp(slideElapsed / 2.8, 0, 1));
        const startSpan = 460;
        const endSpan = 590;
        const startLon = -2.10;
        const endLon = -1.95;
        const startLat = 53.40;
        const endLat = 53.05;
        cam = {
          lon: startLon + (endLon - startLon) * zoomT,
          lat: startLat + (endLat - startLat) * zoomT,
          spanKm: startSpan + (endSpan - startSpan) * zoomT,
        };
      }

      const isFocus = activeMode === 'focus';
      const stageRect = {
        x: isFocus ? layout.padX : layout.stageX,
        y: layout.stageY,
        w: isFocus ? w - layout.padX * 2 : layout.stageW,
        h: layout.stageH,
      };
      const vt = createViewportTransform(w, h, cam, (activeMode === 'split' || isFocus) ? stageRect : undefined);
      const cityObj = activeSlide.citySlug ? cities[activeSlide.citySlug] || null : null;

      // Draw faint, minimal basemap with topography and coastlines behind all slides
      renderCartographicBackdrop(bgCtx, vt, nowSec, overview, satelliteImgRef.current);

      if (overview && (activeMode === 'split' || isFocus)) {
        if (isMapScene(activeSlide.scene)) {
          // Dedicated Map Animation: rendered directly on the basemap without restrictive opaque boxes
          renderMapStage({
            ctx: bgCtx,
            vt,
            overview,
            city: cityObj,
            citiesBySlug: cities,
            scene: activeSlide.scene,
            slideElapsed,
            globalTime: nowSec,
            wipePos: 0,
            hoveredRoute: null,
            alpha: 1,
            satelliteImg: satelliteImgRef.current,
            nightSatelliteImg: nightSatelliteImgRef.current,
          });

          renderFrontMarks({
            ctx: fgCtx,
            vt,
            scene: activeSlide.scene,
            overview,
            city: cityObj,
            slideElapsed,
            hoveredRoute: null,
            mousePos: mousePosRef.current,
          });
        } else if (isPipelineScene(activeSlide.scene)) {
          renderPipelineStage({
            ctx: bgCtx,
            vt,
            scene: activeSlide.scene,
            slideElapsed,
            globalTime: nowSec,
            scanImg: scanImgRef.current,
            leedsCity: cities['leeds'] || null,
            alpha: 1,
            subStep: subStepRef.current,
          });
        } else if (isChartScene(activeSlide.scene)) {
          renderChartsStage({
            ctx: bgCtx,
            vt,
            scene: activeSlide.scene,
            overview,
            citiesBySlug: cities,
            slideElapsed,
            globalTime: nowSec,
            alpha: 1,
            subStep: subStepRef.current,
            frostAvatarImg: frostAvatarImgRef.current,
          });
        }
      }

      bgCtx.restore();
      fgCtx.restore();

      raf = requestAnimationFrame(renderFrame);
    };

    raf = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(raf);
  }, [overview, cities]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button === 0) {
        stepForward();
      }
    },
    [stepForward]
  );

  return (
    <div
      ref={shellRef}
      className="stage-shell"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* Persistent HiDPI Slide Stage Canvases */}
      <canvas ref={bgCanvasRef} className="stage-canvas bg-canvas" />
      <canvas ref={fgCanvasRef} className="stage-canvas fg-canvas" />

      {/* Pixel Watch Remote Clicker (MediaSession API Double-Pinch) */}
      <WatchRemoteController
        currentSlide={currentSlide}
        slideIndex={slideIndex}
        totalSlides={SLIDES.length}
        stepForward={stepForward}
        stepBackward={stepBackward}
      />

      {/* Slide Layout Router */}
      {layoutMode === 'cover' ? (
        <TitleSlide slide={currentSlide} onStart={stepForward} />
      ) : (
        <>
          <SlideHeader
            slide={currentSlide}
            slideIndex={slideIndex}
            totalSlides={SLIDES.length}
          />
          {layoutMode === 'comparison' ? (
            <ComparisonSlide slide={currentSlide} />
          ) : layoutMode === 'closing' ? (
            <ClosingSlide slide={currentSlide} />
          ) : layoutMode === 'focus' ? null : (
            <NarrativeCard
              slide={currentSlide}
              totalSlides={SLIDES.length}
              subStep={subStep}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
