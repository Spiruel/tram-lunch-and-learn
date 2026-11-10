import React from 'react';
import { SlideSpec } from '../types';

interface ComparisonSlideProps {
  slide: SlideSpec;
}

export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({ slide }) => {
  const comp = slide.comparison;
  if (!comp) return null;

  const isRightPurple = comp.rightHighlight !== false && comp.rightHighlight === true;

  return (
    <section className="comparison-slide-body" aria-label={slide.title}>
      <div className={`comparison-cards-wrap ${comp.stats ? 'has-stats' : ''}`}>
        {/* Left Card */}
        <div className={`comp-card ${isRightPurple ? 'comp-card-muted' : 'comp-card-lavender'}`}>
          <div className="comp-card-eyebrow">{comp.leftTag}</div>
          <div className="comp-card-divider" />
          <ul className="comp-item-list">
            {comp.leftItems.map((item, idx) => (
              <li key={idx} className="comp-item-row">
                <span
                  className={`comp-icon-circle ${item.icon === 'check' ? 'is-check' : 'is-x'}`}
                  aria-hidden="true"
                >
                  {item.icon === 'check' ? '✓' : '✕'}
                </span>
                <span className="comp-item-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Center Transition Circle Arrow */}
        <div className="comp-arrow-badge" aria-hidden="true">
          →
        </div>

        {/* Right Card */}
        <div className={`comp-card ${isRightPurple ? 'comp-card-purple' : 'comp-card-muted'}`}>
          <div className="comp-card-eyebrow">{comp.rightTag}</div>
          <div className="comp-card-divider" />
          <ul className="comp-item-list">
            {comp.rightItems.map((item, idx) => (
              <li key={idx} className="comp-item-row">
                <span
                  className={`comp-icon-circle ${item.icon === 'check' ? 'is-check' : 'is-x'}`}
                  aria-hidden="true"
                >
                  {item.icon === 'check' ? '✓' : '✕'}
                </span>
                <span className="comp-item-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {comp.stats && comp.stats.length > 0 && (
        <div className="comp-stats-strip">
          {comp.stats.map((st) => (
            <div key={st.label} className="comp-stat-item">
              <span className="comp-stat-val">{st.value}</span>
              <span className="comp-stat-lbl">{st.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
