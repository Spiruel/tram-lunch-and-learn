import React from 'react';
import { SlideSpec } from '../types';

interface SlideHeaderProps {
  slide: SlideSpec;
  slideIndex: number;
  totalSlides: number;
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({ slide }) => {
  return (
    <header className="slide-deck-header" aria-label="Slide Header">
      <h1 className="slide-title">{slide.title}</h1>
    </header>
  );
};
