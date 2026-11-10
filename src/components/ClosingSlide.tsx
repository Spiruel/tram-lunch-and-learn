import React from 'react';
import { SlideSpec } from '../types';

interface ClosingSlideProps {
  slide: SlideSpec;
}

// Verified Version 3 (29x29) Error-Correction M ISO QR matrix for "https://tinyurl.com/fuzzy-labs"
const QR_MATRIX_ROWS = [
  "11111110111000000100001111111",
  "10000010000000001111001000001",
  "10111010011111011100101011101",
  "10111010100000111010101011101",
  "10111010111111101100001011101",
  "10000010110001110111101000001",
  "11111110101010101010101111111",
  "00000000110010100101100000000",
  "10001011110011111101111111001",
  "10110100110000000100011111111",
  "10111111100101110100101000001",
  "10000000100101011111101111011",
  "11100011111011000110110100010",
  "10010100000111101110111111111",
  "01111110010100001110111111101",
  "11110001101100100110110010011",
  "10100011001001111100110000010",
  "10001101101010000110001111011",
  "00110011000101110110100000101",
  "00011101011111011101111110011",
  "11101010111011000100111111001",
  "00000000111111101011100010001",
  "11111110110110001101101011101",
  "10000010001000100111100010010",
  "10111010101001110101111111011",
  "10111010010111000010000000010",
  "10111010001000010000010001111",
  "10000010001000001100100101011",
  "11111110100010001100101110010",
];

export const ClosingSlide: React.FC<ClosingSlideProps> = ({ slide }) => {
  const closing = slide.closing;
  if (!closing) return null;

  return (
    <main
      className="closing-slide-body"
      aria-label="Further reading and session feedback"
    >
      {/* Left Card: Further Reading & Primary Data */}
      <section className="closing-reading-card">
        <div className="closing-card-eyebrow">{closing.readingEyebrow}</div>
        <div className="closing-card-divider" />
        <ul className="closing-reading-list">
          {closing.items.map((item, idx) => (
            <li key={idx} className="closing-reading-item">
              <div className="closing-reading-num">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="closing-reading-content">
                <div className="closing-reading-top">
                  <span className="closing-reading-title">{item.title}</span>
                  <span className="closing-reading-tag">{item.tag}</span>
                </div>
                <div className="closing-reading-detail">{item.detail}</div>
              </div>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="closing-reading-link"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {item.urlLabel} ↗
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Right Card: Anonymous Lunch & Learn Feedback + Scannable QR Code */}
      <aside className="closing-feedback-card">
        <div className="closing-feedback-top">
          <div className="closing-card-eyebrow is-light">
            {closing.feedbackEyebrow}
          </div>
          <div className="closing-card-divider is-light" />
          <h2 className="closing-feedback-title">{closing.feedbackTitle}</h2>
          <p className="closing-feedback-sub">{closing.feedbackBody}</p>
        </div>

        <a
          href={closing.feedbackHref}
          target="_blank"
          rel="noopener noreferrer"
          className="closing-qr-frame"
          aria-label={`Scan QR code or open ${closing.feedbackShortUrl}`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <svg
            className="closing-qr-svg"
            viewBox="-2 -2 33 33"
            shapeRendering="crispEdges"
            role="img"
            aria-label={`QR code for ${closing.feedbackShortUrl}`}
          >
            <rect x="-2" y="-2" width="33" height="33" rx="2" fill="#ffffff" />
            <g fill="#0f0726">
              {QR_MATRIX_ROWS.map((row, y) =>
                row.split('').map((cell, x) =>
                  cell === '1' ? (
                    <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
                  ) : null
                )
              )}
            </g>
          </svg>
        </a>

        <div className="closing-feedback-bottom">
          <a
            href={closing.feedbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="closing-url-cta"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="closing-url-text">{closing.feedbackShortUrl}</span>
            <span className="closing-url-arrow">↗</span>
          </a>
          {closing.feedbackPills && closing.feedbackPills.length > 0 && (
            <div className="closing-feedback-pills">
              {closing.feedbackPills.map((pill, i) => (
                <span key={i} className="closing-feedback-pill">
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>
      </aside>
    </main>
  );
};
