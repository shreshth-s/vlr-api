// VCT 2026 Tier Classification
// Team IDs sourced from vlr.gg

export type TierStatus = 'partner' | 'ascended';
export type Tier = 't1' | 't2';
export type VCTRegion = 'americas' | 'emea' | 'pacific' | 'china';

export interface T1Team {
  name: string;
  vlrId: string;
  status: TierStatus;
  region: VCTRegion;
  aliases?: string[];
}

// All VCT 2026 Tier 1 teams (48 total: 40 partners + 8 ascended)
export const T1_TEAMS: T1Team[] = [
  // ============ AMERICAS (12 teams) ============
  { name: '100 Thieves', vlrId: '120', status: 'partner', region: 'americas', aliases: ['100T'] },
  { name: 'Cloud9', vlrId: '188', status: 'partner', region: 'americas', aliases: ['C9'] },
  { name: 'Evil Geniuses', vlrId: '5248', status: 'partner', region: 'americas', aliases: ['EG'] },
  { name: 'FURIA', vlrId: '2406', status: 'partner', region: 'americas', aliases: ['FURIA Esports'] },
  { name: 'KRÜ Esports', vlrId: '2355', status: 'partner', region: 'americas', aliases: ['KRÜ', 'KRU', 'KRU Esports'] },
  { name: 'Leviatán', vlrId: '2359', status: 'partner', region: 'americas', aliases: ['LEV', 'Leviatan'] },
  { name: 'LOUD', vlrId: '6961', status: 'partner', region: 'americas' },
  { name: 'MIBR', vlrId: '7386', status: 'partner', region: 'americas' },
  { name: 'NRG', vlrId: '1034', status: 'partner', region: 'americas', aliases: ['NRG Esports'] },
  { name: 'Sentinels', vlrId: '2', status: 'partner', region: 'americas', aliases: ['SEN'] },
  { name: 'G2 Esports', vlrId: '11058', status: 'ascended', region: 'americas', aliases: ['G2'] },
  { name: 'ENVY', vlrId: '427', status: 'ascended', region: 'americas', aliases: ['OpTic Gaming', 'OpTic'] },

  // ============ EMEA (12 teams) ============
  { name: 'BBL Esports', vlrId: '397', status: 'partner', region: 'emea', aliases: ['BBL'] },
  { name: 'Fnatic', vlrId: '2593', status: 'partner', region: 'emea', aliases: ['FNC'] },
  { name: 'FUT Esports', vlrId: '1184', status: 'partner', region: 'emea', aliases: ['FUT'] },
  { name: 'Karmine Corp', vlrId: '8877', status: 'partner', region: 'emea', aliases: ['KC'] },
  { name: 'Natus Vincere', vlrId: '4915', status: 'partner', region: 'emea', aliases: ['NAVI', 'NaVi'] },
  { name: 'Team Heretics', vlrId: '1001', status: 'partner', region: 'emea', aliases: ['Heretics', 'TH'] },
  { name: 'Team Liquid', vlrId: '474', status: 'partner', region: 'emea', aliases: ['Liquid', 'TL'] },
  { name: 'Team Vitality', vlrId: '2059', status: 'partner', region: 'emea', aliases: ['Vitality', 'VIT'] },
  { name: 'GIANTX', vlrId: '14419', status: 'partner', region: 'emea', aliases: ['GiantX', 'Giants'] },
  { name: 'Gentle Mates', vlrId: '12694', status: 'partner', region: 'emea', aliases: ['M8'] },
  { name: 'Apeks', vlrId: '11479', status: 'ascended', region: 'emea' },
  { name: 'Acend', vlrId: '3531', status: 'ascended', region: 'emea', aliases: ['ACE'] },

  // ============ PACIFIC (12 teams) ============
  { name: 'DetonatioN FocusMe', vlrId: '278', status: 'partner', region: 'pacific', aliases: ['DFM', 'DetonatioN'] },
  { name: 'DRX', vlrId: '8185', status: 'partner', region: 'pacific' },
  { name: 'Gen.G Esports', vlrId: '17', status: 'partner', region: 'pacific', aliases: ['Gen.G', 'GenG'] },
  { name: 'Global Esports', vlrId: '918', status: 'partner', region: 'pacific', aliases: ['GE'] },
  { name: 'Paper Rex', vlrId: '624', status: 'partner', region: 'pacific', aliases: ['PRX'] },
  { name: 'Rex Regum Qeon', vlrId: '878', status: 'partner', region: 'pacific', aliases: ['RRQ'] },
  { name: 'T1', vlrId: '14', status: 'partner', region: 'pacific' },
  { name: 'Team Secret', vlrId: '6199', status: 'partner', region: 'pacific', aliases: ['Secret', 'TS'] },
  { name: 'ZETA DIVISION', vlrId: '5448', status: 'partner', region: 'pacific', aliases: ['ZETA', 'ZD'] },
  { name: 'FULL SENSE', vlrId: '4050', status: 'partner', region: 'pacific', aliases: ['FS'] },
  { name: 'Nongshim RedForce', vlrId: '11060', status: 'ascended', region: 'pacific', aliases: ['NS', 'NS RedForce'] },
  { name: 'VARREL', vlrId: '11229', status: 'ascended', region: 'pacific' },

  // ============ CHINA (12 teams) ============
  { name: 'All Gamers', vlrId: '1119', status: 'partner', region: 'china', aliases: ['AG'] },
  { name: 'Bilibili Gaming', vlrId: '12010', status: 'partner', region: 'china', aliases: ['BLG'] },
  { name: 'EDward Gaming', vlrId: '1120', status: 'partner', region: 'china', aliases: ['EDG'] },
  { name: 'FunPlus Phoenix', vlrId: '11328', status: 'partner', region: 'china', aliases: ['FPX'] },
  { name: 'JD Gaming', vlrId: '13576', status: 'partner', region: 'china', aliases: ['JDG'] },
  { name: 'Nova Esports', vlrId: '12064', status: 'partner', region: 'china', aliases: ['Nova'] },
  { name: 'Titan Esports Club', vlrId: '14137', status: 'partner', region: 'china', aliases: ['TEC', 'Titan'] },
  { name: 'Trace Esports', vlrId: '12685', status: 'partner', region: 'china', aliases: ['TE', 'Trace'] },
  { name: 'TYLOO', vlrId: '731', status: 'partner', region: 'china' },
  { name: 'Wolves Esports', vlrId: '13790', status: 'partner', region: 'china', aliases: ['Wolves'] },
  { name: 'Dragon Ranger Gaming', vlrId: '11981', status: 'ascended', region: 'china', aliases: ['DRG'] },
  { name: 'XLG Esports', vlrId: '13581', status: 'ascended', region: 'china', aliases: ['XLG'] },
];

// Build lookup sets for fast matching
const t1TeamIds = new Set<string>();
const t1TeamById = new Map<string, T1Team>();
const t1TeamNames = new Set<string>();  // Lowercase names for fallback matching
const t1TeamByName = new Map<string, T1Team>();

for (const team of T1_TEAMS) {
  // ID-based lookup (preferred)
  t1TeamIds.add(team.vlrId);
  t1TeamById.set(team.vlrId, team);

  // Name-based lookup (fallback for when ID not available)
  const nameLower = team.name.toLowerCase();
  t1TeamNames.add(nameLower);
  t1TeamByName.set(nameLower, team);

  // Also add aliases
  if (team.aliases) {
    for (const alias of team.aliases) {
      const aliasLower = alias.toLowerCase();
      t1TeamNames.add(aliasLower);
      t1TeamByName.set(aliasLower, team);
    }
  }
}

// Check if team is T1 by ID (preferred) or name (fallback)
export function isT1Team(teamIdOrName: string | undefined): boolean {
  if (!teamIdOrName) return false;
  // Try ID first (IDs are numeric)
  if (t1TeamIds.has(teamIdOrName)) return true;
  // Fallback to name matching
  return t1TeamNames.has(teamIdOrName.toLowerCase().trim());
}

// Get team info by ID (preferred) or name (fallback)
export function getT1TeamInfo(teamIdOrName: string | undefined): T1Team | undefined {
  if (!teamIdOrName) return undefined;
  // Try ID first
  const byId = t1TeamById.get(teamIdOrName);
  if (byId) return byId;
  // Fallback to name
  return t1TeamByName.get(teamIdOrName.toLowerCase().trim());
}

export function getT1Teams(options?: {
  status?: TierStatus;
  region?: VCTRegion;
}): T1Team[] {
  let teams = T1_TEAMS;
  if (options?.status) {
    teams = teams.filter(t => t.status === options.status);
  }
  if (options?.region) {
    teams = teams.filter(t => t.region === options.region);
  }
  return teams;
}
