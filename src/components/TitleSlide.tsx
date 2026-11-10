import React from 'react';
import { SlideSpec } from '../types';

interface TitleSlideProps {
  slide: SlideSpec;
  onStart: () => void;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({ onStart }) => {
  return (
    <div className="title-slide-overlay" role="region" aria-label="Title Slide">
      <div className="google-slide-card">
        {/* Top Eyebrow & Status Row */}
        <div className="slide-meta-row">
          <div className="slide-deck-badge">LUNCH &amp; LEARN PRESENTATION DECK</div>
          <div className="slide-deck-date">OCTOBER 2026 · UNIVERSITY OF LEEDS &amp; FUZZY LABS</div>
        </div>

        {/* Main Presentation Title & Subtitle */}
        <div className="title-hero-block">
          <h1 className="google-slide-title">
            Britain Buried Its Trams <span className="tram-icon">🚋</span>.<br />
            Our Cities Have Been Smaller Ever Since.
          </h1>
          <p className="google-slide-subtitle">
            Reconstructing 1929–1957 municipal tramway timetables with computer vision,
            GTFS, and RAPTOR routing to measure what happened to the effective economic size of five British cities.
          </p>
        </div>

        {/* Speaker Byline */}
        <div className="speaker-byline-row">
          <div className="speaker-avatar">SB</div>
          <div className="speaker-info">
            <span className="speaker-name">Samuel Bancroft</span>
            <span className="speaker-title">Institute for Transport Studies · University of Leeds &amp; Fuzzy Labs</span>
          </div>
        </div>

        {/* 4 Presentation Agenda Cards */}
        <div className="title-agenda-grid">
          <div className="agenda-card">
            <div className="agenda-act">ACT I · MACRO PUZZLE</div>
            <div className="agenda-title">The Small City Paradox</div>
            <div className="agenda-desc">Why Birmingham behaves like a city of 346k at 08:15 AM, and peak road congestion collapses reach.</div>
          </div>
          <div className="agenda-card">
            <div className="agenda-act">ACT II · ML PIPELINE</div>
            <div className="agenda-title">Rescuing Paper from Dust</div>
            <div className="agenda-desc">Surya OCR, line detection, and RAPTOR routing turning Crich archival paper into GTFS feeds.</div>
          </div>
          <div className="agenda-card">
            <div className="agenda-act">ACT III · FIVE CITIES</div>
            <div className="agenda-title">Five Cities Reconstructed</div>
            <div className="agenda-desc">Leeds, Liverpool, Manchester, Sheffield, Birmingham: every single city shrank inside 30 min.</div>
          </div>
          <div className="agenda-card">
            <div className="agenda-act">ACT IV · REGIONAL SYNTHESIS</div>
            <div className="agenda-title">The Northern Megacity</div>
            <div className="agenda-desc">A 10M megacity in plain sight: the Dutch 1970 policy parallel and the optimistic case to rebuild.</div>
          </div>
        </div>

        {/* Start Presentation Button & Key Prompt */}
        <div className="start-prompt-row">
          <button type="button" className="start-presentation-btn" onClick={onStart}>
            <span>Start Presentation</span>
            <span className="start-arrow">→</span>
          </button>
          <div className="start-keyboard-hint">
            Press <kbd>Space</kbd> or <kbd>→</kbd> on your keyboard to navigate slides
          </div>
        </div>
      </div>
    </div>
  );
};
