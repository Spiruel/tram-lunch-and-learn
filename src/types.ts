export interface CityCentre {
  lat: number;
  lon: number;
  name: string;
}

export interface PopulationCurveSet {
  historical: Record<string, number>;
  modern: Record<string, number>;
  walk?: Record<string, number>;
  car?: Record<string, number>;
  carFreeflow?: Record<string, number>;
}

export interface RobustnessInfo {
  hist30_lo: number;
  hist30_hi: number;
  mod30_lo: number;
  mod30_hi: number;
  crossover_min: number;
  share_faster_historical: number;
  share_faster_modern: number;
  basis?: string;
  curve?: Record<string, { h: [number, number]; m: [number, number] }>;
}

export interface GeoShape {
  type: 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString';
  coordinates: any;
}

export interface UnderservedCluster {
  name: string;
  pop: number;
  count: number;
  worseBy: number;
  noCarPct: number;
  center: [number, number];
  hull: [number, number][];
}

export interface RouteInfo {
  stem: string;
  name: string;
  mode: 'tram' | 'bus' | 'trolleybus' | 'rail' | string;
  imageUrl?: string;
  linkLabel: string;
  sourceText: string;
  coords: [number, number][];
}

export interface ModernLine {
  name: string;
  color: string;
  coords: [number, number][];
}

// [lon, lat, pop, h, m, underservedFlag(0|1), noCarPct, h1943_or_null]
export type CompactLsoa = [
  number,
  number,
  number,
  number | null,
  number | null,
  number,
  number,
  number | null,
];

export interface CityData {
  slug: string;
  displayName: string;
  code: string;
  historicalYear: number;
  historicalLabel: string;
  modernLabel: string;
  fastModeLabel: string;
  centre: CityCentre;
  totalPopulation: number;
  amPeakFactor?: number | null;
  methodology: string;
  methodologyNote: string;
  populationCurve: PopulationCurveSet;
  robustness?: RobustnessInfo | null;
  era1943?: {
    label: string;
    year: number;
    populationCurve: Record<string, number>;
    robustness?: RobustnessInfo;
    isochrones: Record<string, GeoShape[]>;
  } | null;
  underservedCount: number;
  underservedPop: number;
  fasterHistCount: number;
  totalLsoas: number;
  underservedClusters: UnderservedCluster[];
  isochrones: {
    historical: Record<string, GeoShape[]>;
    modern: Record<string, GeoShape[]>;
  };
  tramLines: [number, number][][];
  modernLines: ModernLine[];
  coastline: GeoShape[];
  lsoas: CompactLsoa[];
  routes: RouteInfo[];
  leedsExtended?: any;
}

export interface OverviewCity {
  slug: string;
  displayName: string;
  code: string;
  historicalYear: number;
  historicalLabel: string;
  modernLabel: string;
  centre: CityCentre;
  populationCurve: PopulationCurveSet;
  robustness?: Omit<RobustnessInfo, 'curve'> | null;
  underservedCount: number;
  underservedPop: number;
  fasterHistCount: number;
  totalLsoas: number;
  skeleton: [number, number][][];
}

export interface OverviewData {
  uk: {
    ukRings: [number, number][][];
    ieRings: [number, number][][];
    dots: [number, number, number][];
  };
  cities: OverviewCity[];
  leedsSummary: any;
}

export type SceneType =
  | 'uk-cover'
  | 'londonmaxxing'
  | 'agglomeration-theory'
  | 'remote-agglomeration'
  | 'centre-for-cities'
  | 'netherlands-backtest'
  | 'natural-experiment'
  | 'productivity-chart'
  | 'birmingham-small-city'
  | 'car-collapse'
  | 'frost-car-objection'
  | 'exchange-published'
  | 'talk-outline'
  | 'uk-archive-orbit'
  | 'crich-desk'
  | 'surya-bands'
  | 'surya-ocr'
  | 'track-interp'
  | 'gtfs-stack'
  | 'raptor-wave'
  | 'city-wipe'
  | 'city-historical'
  | 'city-crossfade'
  | 'harehills-triptych'
  | 'trans-pennine-expanse'
  | 'leeds-stress'
  | 'city-wartime'
  | 'city-underserved'
  | 'tramway-conspiracy'
  | 'five-city-scoreboard'
  | 'two-speed-curves'
  | 'northern-megacity'
  | 'polycentric-north'
  | 'london-vs-polycentric'
  | 'takeaway-uk'
  | 'finale-explorer'
  | 'further-reading';

export interface CameraSpec {
  lon: number;
  lat: number;
  spanKm: number; // horizontal map span in km across viewport height
  offsetX?: number; // fraction of viewport width to shift focal center right (e.g. +0.15 when card is on left)
}

export interface SlideMetric {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  noGrouping?: boolean;
  tone?: 'amber' | 'cyan' | 'rose' | 'neutral';
  sub?: string;
}

export interface HeroStatSpec {
  value: string;
  label: string;
  sub?: string;
  tone?: 'purple' | 'teal' | 'rose';
}

export interface CoverCardSpec {
  stat: string;
  title: string;
  body: string;
  pills: string[];
  highlight?: boolean;
}

export interface ComparisonItemSpec {
  icon: 'x' | 'check';
  text: string;
}

export interface ComparisonSlideSpec {
  leftTag: string;
  leftItems: ComparisonItemSpec[];
  rightTag: string;
  rightItems: ComparisonItemSpec[];
  rightHighlight?: boolean;
  stats?: Array<{ value: string; label: string }>;
}

export interface ReadingItemSpec {
  tag: string;
  title: string;
  detail: string;
  urlLabel: string;
  href: string;
}

export interface ClosingSlideSpec {
  readingEyebrow: string;
  items: ReadingItemSpec[];
  feedbackEyebrow: string;
  feedbackTitle: string;
  feedbackBody: string;
  feedbackShortUrl: string;
  feedbackHref: string;
  feedbackPills?: string[];
}

export interface SlideSpec {
  index: number;
  id: string;
  act?: string;
  kicker: string;
  title: string;
  subtitleTag?: string;
  subtitle?: string;
  slideLayout?: 'cover' | 'split' | 'comparison' | 'closing' | 'focus';
  heroStat?: HeroStatSpec;
  sectionTitle?: string;
  sectionAccent?: 'teal' | 'purple' | 'ink';
  pills?: string[];
  coverCards?: CoverCardSpec[];
  comparison?: ComparisonSlideSpec;
  closing?: ClosingSlideSpec;
  body: string;
  bulletPoints?: string[];
  metrics?: SlideMetric[];
  citation?: string;
  subSteps?: number;
  scene: SceneType;
  camera: CameraSpec;
  citySlug?: string;
  wipeStart?: number; // 0 = all historical, 1 = all modern
  wipeEnd?: number;
  cardPosition?: 'left' | 'top-left' | 'bottom-left' | 'center-hero';
  interactiveRoutes?: boolean;
  featuredScanUrl?: string;
  featuredScanLabel?: string;
}
