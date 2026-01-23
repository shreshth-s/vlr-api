// Agent and Role types
export type AgentRole = 'duelist' | 'controller' | 'initiator' | 'sentinel';

export interface Agent {
  name: string;
  role: AgentRole;
}

// Player types
export interface PlayerStats {
  rounds: number;
  rating: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  killDeathDiff: number;
  kast: number;
  adr: number;
  headshot: number;
  firstKills: number;
  firstDeaths: number;
  // Per-round stats
  kpr?: number;
  apr?: number;
  fkpr?: number;
  fdpr?: number;
  // Clutch stats
  clutchWins?: number;        // Number of clutches won
  clutchAttempts?: number;    // Total clutch situations
  clutchPercent?: number;     // Win rate: (clutchWins / clutchAttempts) * 100
  // Total stats (from leaderboard)
  totalKills?: number;        // Total kills across all rounds
  totalDeaths?: number;       // Total deaths across all rounds
  totalAssists?: number;      // Total assists across all rounds
  totalFirstKills?: number;   // Total first kills
  totalFirstDeaths?: number;  // Total first deaths
  killsMax?: number;          // Max kills in a single map
}

export interface PlayerMatchStats extends PlayerStats {
  playerName: string;
  agent: string;
  agentRole: AgentRole;
  // Per-match clutch stats (more detailed)
  clutchWins: number;
  clutchAttempts: number;
  clutchPercent: number;
}

export interface Player {
  id: string;
  name: string;
  realName?: string;
  country?: string;
  countryCode?: string;
  team?: string;
  teamId?: string;
  image?: string;
  twitter?: string;
}

export interface PlayerProfile extends Player {
  earnings?: number;
  teamHistory?: TeamHistoryEntry[];
  pastEvents?: EventPlacement[];
}

export interface TeamHistoryEntry {
  teamId: string;
  teamName: string;
  logo?: string;
  joinDate?: string;
  leaveDate?: string;
}

export interface EventPlacement {
  eventId: string;
  eventName: string;
  placement: string;
  prize?: number;
  date?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  tag?: string;
  logo?: string;
  country?: string;
  countryCode?: string;
  rank?: number;
  rating?: number;
  earnings?: number;
  record?: {
    wins: number;
    losses: number;
  };
}

export interface TeamRoster {
  players: RosterPlayer[];
  staff: RosterStaff[];
}

export interface RosterPlayer {
  id: string;
  name: string;
  realName?: string;
  country?: string;
  countryCode?: string;
  role?: string; // In-game role like IGL
}

export interface RosterStaff {
  id: string;
  name: string;
  realName?: string;
  country?: string;
  countryCode?: string;
  role: string; // Coach, Analyst, etc.
}

export interface TeamProfile extends Team {
  roster?: TeamRoster;
  website?: string;
  twitter?: string;
  recentMatches?: MatchSummary[];
  upcomingMatches?: MatchSummary[];
}

// Match types
export type MatchStatus = 'upcoming' | 'live' | 'completed';

export interface MatchSummary {
  id: string;
  team1: MatchTeam;
  team2: MatchTeam;
  status: MatchStatus;
  event: string;
  eventId?: string;
  eventLogo?: string;
  stage?: string;
  matchTime?: string;
  eta?: string;
}

export interface MatchTeam {
  id?: string;
  name: string;
  tag?: string;
  logo?: string;
  score?: number;
  country?: string;
  countryCode?: string;
}

export interface MatchDetails extends MatchSummary {
  format?: string; // Bo3, Bo5, etc.
  maps: MapResult[];
  streams?: Stream[];
  vods?: string[];
}

export interface MapResult {
  map: string;
  team1Score: number;
  team2Score: number;
  team1Side?: string; // attack/defense
  team2Side?: string;
  team1Players: PlayerMatchStats[];
  team2Players: PlayerMatchStats[];
  picked?: string; // Which team picked
}

export interface Stream {
  name: string;
  url: string;
  language?: string;
}

// Event types
export interface Event {
  id: string;
  name: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  region?: string;
  prizePool?: string;
  dates?: string;
  logo?: string;
  location?: string;
}

export interface EventDetails extends Event {
  teams?: Team[];
  matches?: MatchSummary[];
  standings?: Standing[];
}

export interface Standing {
  position: number;
  team: Team;
  wins: number;
  losses: number;
  roundDiff?: number;
}

// Stats/Leaderboard types
export interface StatsFilter {
  eventId?: string;
  eventSeries?: string;
  region?: string;
  country?: string;
  minRounds?: number;
  minRating?: number;
  agent?: string;
  map?: string;
  timespan?: '30' | '60' | '90' | 'all';
}

export interface LeaderboardEntry {
  player: Player;
  agents: string[];
  stats: PlayerStats;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached?: boolean;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: number;
}

// Role inference
export const AGENT_ROLES: Record<string, AgentRole> = {
  // Duelists
  jett: 'duelist',
  raze: 'duelist',
  reyna: 'duelist',
  phoenix: 'duelist',
  neon: 'duelist',
  iso: 'duelist',
  yoru: 'duelist',
  waylay: 'duelist',

  // Controllers
  omen: 'controller',
  astra: 'controller',
  brimstone: 'controller',
  viper: 'controller',
  harbor: 'controller',
  clove: 'controller',

  // Initiators
  sova: 'initiator',
  breach: 'initiator',
  skye: 'initiator',
  'kay/o': 'initiator',
  kayo: 'initiator',
  fade: 'initiator',
  gekko: 'initiator',
  tejo: 'initiator',

  // Sentinels
  killjoy: 'sentinel',
  cypher: 'sentinel',
  sage: 'sentinel',
  chamber: 'sentinel',
  deadlock: 'sentinel',
  vyse: 'sentinel',
};

export function getAgentRole(agent: string): AgentRole {
  const normalized = agent.toLowerCase().trim();
  return AGENT_ROLES[normalized] || 'duelist';
}
