import React, { useState } from 'react';
import { ExternalLink, X, ZoomIn, ZoomOut } from 'lucide-react';
import { RouteInfo } from '../types';

const BUNDLED_SCANS = new Set([
  'lds_p12-13.jpg',
  'lds_p10-11.jpg',
  'lds_p14.jpg',
  'liv_10.jpg',
  'liv_1.jpg',
  'stk_t1.jpg',
  'shf_weekday_p8.jpg',
  'bhm_p13A.jpg',
  'bhm_p27A.jpg',
]);

export function resolveScanSrc(imageUrl?: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('/') || imageUrl.startsWith('http')) return imageUrl;
  const base = imageUrl.split('/').pop() || '';
  if (BUNDLED_SCANS.has(base)) {
    return `/scans/${base}`;
  }
  return `https://spiruel.github.io/transit-time-machine/data/${imageUrl}`;
}

interface ScanLightboxProps {
  route: RouteInfo | null;
  cityDisplayName?: string;
  onClose: () => void;
}

export const ScanLightbox: React.FC<ScanLightboxProps> = ({
  route,
  cityDisplayName,
  onClose,
}) => {
  const [zoomed, setZoomed] = useState(false);
  if (!route) return null;

  const src = resolveScanSrc(route.imageUrl);
  const remoteHref = route.imageUrl?.startsWith('http')
    ? route.imageUrl
    : route.imageUrl?.startsWith('/')
      ? `https://spiruel.github.io/transit-time-machine/data/scans/${route.imageUrl.split('/').pop()}`
      : `https://spiruel.github.io/transit-time-machine/data/${route.imageUrl}`;

  return (
    <div
      className="lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Archival timetable scan viewer"
    >
      <div className="lightbox-modal" onClick={(e) => e.stopPropagation()}>
        <header className="lightbox-header">
          <div>
            <div className="lightbox-eyebrow">
              {cityDisplayName ? `${cityDisplayName.toUpperCase()} · ` : ''}
              ARCHIVAL SOURCE PROVENANCE · {route.mode.toUpperCase()}
            </div>
            <h2 className="lightbox-title">{route.name}</h2>
          </div>
          <div className="lightbox-controls">
            {src && (
              <button
                type="button"
                className="icon-pill"
                onClick={() => setZoomed((z) => !z)}
                title="Toggle zoom"
              >
                {zoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
                <span>{zoomed ? 'Fit' : 'Zoom 2×'}</span>
              </button>
            )}
            {route.imageUrl && (
              <a
                href={remoteHref}
                target="_blank"
                rel="noreferrer"
                className="icon-pill"
                title="Open original scan in new tab"
              >
                <ExternalLink size={15} />
                <span>Original</span>
              </a>
            )}
            <button type="button" className="icon-pill close" onClick={onClose} title="Close (Esc)">
              <X size={16} />
              <span>Esc</span>
            </button>
          </div>
        </header>

        <div className="lightbox-body">
          {src ? (
            <div className={`scan-scroll-frame ${zoomed ? 'is-zoomed' : ''}`}>
              <img
                src={src}
                alt={route.linkLabel || route.name}
                onClick={() => setZoomed((z) => !z)}
              />
            </div>
          ) : (
            <div className="scan-missing">No scan image linked for this corridor.</div>
          )}

          {route.sourceText && (
            <div className="provenance-note">
              <span className="prov-tag">Transcription &amp; Modelling Note:</span>{' '}
              {route.sourceText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
