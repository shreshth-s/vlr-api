// Debug capture types

export interface HtmlSample {
  id: string;
  type: CaptureType;
  url: string;
  html?: string;  // Only included when fetching single sample
  timestamp: string;
  error?: string;
  context?: Record<string, unknown>;
  fileSize?: number;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

export type CaptureType =
  | 'matches-live'
  | 'matches-upcoming'
  | 'matches-results'
  | 'match-detail'
  | 'player-search'
  | 'player-profile'
  | 'player-stats'
  | 'player-agents'
  | 'player-matches'
  | 'team-search'
  | 'team-rankings'
  | 'team-profile'
  | 'team-matches'
  | 'events-list'
  | 'event-detail'
  | 'event-search';

export const CAPTURE_PATHS: Record<CaptureType, string> = {
  'matches-live': '/matches',
  'matches-upcoming': '/matches',
  'matches-results': '/matches/results',
  'match-detail': '/:matchId',
  'player-search': '/search?type=players&q=',
  'player-profile': '/player/:id',
  'player-stats': '/stats',
  'player-agents': '/player/:id',
  'player-matches': '/player/matches/:id',
  'team-search': '/search?type=teams&q=',
  'team-rankings': '/rankings',
  'team-profile': '/team/:id',
  'team-matches': '/team/matches/:id',
  'events-list': '/events',
  'event-detail': '/event/:id',
  'event-search': '/search?type=events&q=',
};

export interface SampleIndex {
  samples: HtmlSampleMetadata[];
  lastUpdated: string;
}

export interface HtmlSampleMetadata {
  id: string;
  type: CaptureType;
  url: string;
  timestamp: string;
  error?: string;
  fileSize: number;
}
