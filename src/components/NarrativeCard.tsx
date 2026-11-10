import React from 'react';
import { SlideSpec } from '../types';

interface NarrativeCardProps {
  slide: SlideSpec;
  totalSlides: number;
  subStep?: number;
}

function parseBulletItem(raw: string): { symbol: string; tone: 'check' | 'x' | 'dot'; text: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith('✓ ')) {
    return { symbol: '✓', tone: 'check', text: trimmed.slice(2) };
  }
  if (trimmed.startsWith('✗ ') || trimmed.startsWith('✕ ')) {
    return { symbol: '✕', tone: 'x', text: trimmed.slice(2) };
  }
  if (trimmed.startsWith('• ')) {
    return { symbol: '•', tone: 'dot', text: trimmed.slice(2) };
  }
  return { symbol: '•', tone: 'dot', text: trimmed.replace(/\*\*/g, '') };
}

export const NarrativeCard: React.FC<NarrativeCardProps> = ({ slide, subStep }) => {
  const accentClass = slide.sectionAccent ? `accent-${slide.sectionAccent}` : 'accent-purple';

  return (
    <>
      <aside className="slide-left-column" aria-live="polite">
        <div key={slide.id} className="slide-left-inner">
          {slide.heroStat && (
            <div className="hero-stat-block">
              <div className="hero-stat-value">{slide.heroStat.value}</div>
              <div className="hero-stat-label">{slide.heroStat.label}</div>
              {slide.heroStat.sub && (
                <div className="hero-stat-sub">{slide.heroStat.sub}</div>
              )}
            </div>
          )}

          {slide.bulletPoints && slide.bulletPoints.length > 0 && (
            <div className="slide-section-block">
              {slide.sectionTitle && (
                <h2 className={`slide-section-heading ${accentClass}`}>
                  {slide.sectionTitle}
                </h2>
              )}
              <ul className="slide-bullets">
                {slide.bulletPoints.map((pt, idx) => {
                  const parsed = parseBulletItem(pt);
                  return (
                    <li key={`${slide.id}-b-${idx}`} className="slide-bullet-item">
                      <span
                        className={`bullet-icon tone-${parsed.tone}`}
                        aria-hidden="true"
                      >
                        {parsed.symbol}
                      </span>
                      <span className="bullet-text">{parsed.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(slide.pills || (slide.subSteps && slide.subSteps > 1)) && (
            <div className="slide-pills-row">
              {slide.subSteps && slide.subSteps > 1 && (
                <span className="slide-pill-tag" style={{ background: '#7000ff', color: '#ffffff', fontWeight: 600 }}>
                  Step {((subStep ?? 0) + 1)} / {slide.subSteps}
                </span>
              )}
              {slide.pills?.map((pill) => (
                <span key={pill} className="slide-pill-tag">
                  {pill}
                </span>
              ))}
            </div>
          )}
        </div>
      </aside>
      <div className="slide-vertical-divider" aria-hidden="true" />
    </>
  );
};
