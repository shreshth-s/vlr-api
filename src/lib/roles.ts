import { AgentRole, AGENT_ROLES, PlayerMatchStats } from '../types/index.js';

// Role classification based on agent picks and stats

export interface PlayerRoleAnalysis {
  primaryRole: AgentRole;
  roleDistribution: Record<AgentRole, number>;
  roleBreakdown: RoleBreakdown[];
  playstyle: PlaystyleAnalysis;
}

export interface RoleBreakdown {
  role: AgentRole;
  agents: AgentPlayCount[];
  rounds: number;
  percentage: number;
}

export interface AgentPlayCount {
  agent: string;
  rounds: number;
  percentage: number;
}

export interface PlaystyleAnalysis {
  isEntry: boolean;        // High FK/FD ratio
  isAnchor: boolean;       // Low FK, high KAST
  isPlaymaker: boolean;    // High assists, initiator role
  isFlexible: boolean;     // Plays multiple roles
  classification: string;  // Summary classification
}

// Analyze a player's role from their match history
export function analyzePlayerRole(
  matchStats: PlayerMatchStats[]
): PlayerRoleAnalysis {
  const roleRounds: Record<AgentRole, number> = {
    duelist: 0,
    controller: 0,
    initiator: 0,
    sentinel: 0,
  };

  const agentRounds: Record<string, number> = {};
  let totalRounds = 0;

  // Aggregate stats for playstyle analysis
  let totalFK = 0;
  let totalFD = 0;
  let totalKAST = 0;
  let totalAssists = 0;
  let statsCount = 0;

  for (const stat of matchStats) {
    const role = stat.agentRole;
    const rounds = stat.rounds || 1;

    roleRounds[role] += rounds;
    totalRounds += rounds;

    const agent = stat.agent.toLowerCase();
    agentRounds[agent] = (agentRounds[agent] || 0) + rounds;

    // Aggregate for playstyle
    totalFK += stat.firstKills || 0;
    totalFD += stat.firstDeaths || 0;
    totalKAST += stat.kast || 0;
    totalAssists += stat.assists || 0;
    statsCount++;
  }

  // Calculate role distribution
  const roleDistribution: Record<AgentRole, number> = {
    duelist: totalRounds > 0 ? Math.round((roleRounds.duelist / totalRounds) * 100) : 0,
    controller: totalRounds > 0 ? Math.round((roleRounds.controller / totalRounds) * 100) : 0,
    initiator: totalRounds > 0 ? Math.round((roleRounds.initiator / totalRounds) * 100) : 0,
    sentinel: totalRounds > 0 ? Math.round((roleRounds.sentinel / totalRounds) * 100) : 0,
  };

  // Build role breakdown with agents
  const roleBreakdown = buildRoleBreakdown(agentRounds, totalRounds);

  // Determine primary role
  const primaryRole = Object.entries(roleDistribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as AgentRole;

  // Analyze playstyle
  const playstyle = analyzePlaystyle(
    totalFK,
    totalFD,
    totalKAST / (statsCount || 1),
    totalAssists,
    roleDistribution
  );

  return {
    primaryRole,
    roleDistribution,
    roleBreakdown,
    playstyle,
  };
}

function buildRoleBreakdown(
  agentRounds: Record<string, number>,
  totalRounds: number
): RoleBreakdown[] {
  const roleAgents: Record<AgentRole, AgentPlayCount[]> = {
    duelist: [],
    controller: [],
    initiator: [],
    sentinel: [],
  };

  // Group agents by role
  for (const [agent, rounds] of Object.entries(agentRounds)) {
    const role = AGENT_ROLES[agent] || 'duelist';
    roleAgents[role].push({
      agent,
      rounds,
      percentage: totalRounds > 0 ? Math.round((rounds / totalRounds) * 100) : 0,
    });
  }

  // Build breakdown
  const breakdown: RoleBreakdown[] = [];

  for (const role of ['duelist', 'controller', 'initiator', 'sentinel'] as AgentRole[]) {
    const agents = roleAgents[role].sort((a, b) => b.rounds - a.rounds);
    const roleTotal = agents.reduce((sum, a) => sum + a.rounds, 0);

    if (roleTotal > 0) {
      breakdown.push({
        role,
        agents,
        rounds: roleTotal,
        percentage: totalRounds > 0 ? Math.round((roleTotal / totalRounds) * 100) : 0,
      });
    }
  }

  return breakdown.sort((a, b) => b.rounds - a.rounds);
}

function analyzePlaystyle(
  totalFK: number,
  totalFD: number,
  avgKAST: number,
  totalAssists: number,
  roleDistribution: Record<AgentRole, number>
): PlaystyleAnalysis {
  const fkfdRatio = totalFD > 0 ? totalFK / totalFD : totalFK;
  const isEntry = fkfdRatio > 1.2; // Takes first fights often
  const isAnchor = avgKAST > 70 && fkfdRatio < 0.8; // High KAST, avoids first fights
  const isPlaymaker = totalAssists > totalFK * 0.7 && roleDistribution.initiator > 30;

  // Check if flexible (plays multiple roles significantly)
  const significantRoles = Object.values(roleDistribution).filter(p => p >= 20).length;
  const isFlexible = significantRoles >= 2;

  // Generate classification
  let classification = 'Standard';

  if (roleDistribution.duelist >= 60) {
    classification = isEntry ? 'Entry Fragger' : 'Star Duelist';
  } else if (roleDistribution.controller >= 60) {
    classification = 'Smoke Player';
  } else if (roleDistribution.initiator >= 60) {
    classification = isPlaymaker ? 'Playmaker' : 'Info Gatherer';
  } else if (roleDistribution.sentinel >= 60) {
    classification = isAnchor ? 'Anchor' : 'Site Holder';
  } else if (isFlexible) {
    // Check flex types
    if (roleDistribution.duelist >= 30 && roleDistribution.initiator >= 30) {
      classification = 'Flex Entry';
    } else if (roleDistribution.controller >= 30 && roleDistribution.sentinel >= 30) {
      classification = 'Flex Support';
    } else {
      classification = 'Flex Player';
    }
  }

  return {
    isEntry,
    isAnchor,
    isPlaymaker,
    isFlexible,
    classification,
  };
}

// Determine likely IGL based on team stats patterns
// (This is speculative - VLR doesn't expose IGL data)
export function guessIGL(
  teamStats: { player: string; stats: PlayerMatchStats[] }[]
): string | null {
  // IGLs often have:
  // - Lower ADR than expected for their role
  // - High KAST
  // - Play controller/sentinel more often
  // - More consistent (less variance in stats)

  let bestCandidate: string | null = null;
  let bestScore = 0;

  for (const { player, stats } of teamStats) {
    if (stats.length === 0) continue;

    const avgKAST = stats.reduce((sum, s) => sum + (s.kast || 0), 0) / stats.length;
    const avgADR = stats.reduce((sum, s) => sum + (s.adr || 0), 0) / stats.length;

    // Count support roles
    const supportRounds = stats.filter(s =>
      s.agentRole === 'controller' || s.agentRole === 'sentinel'
    ).length;
    const supportRatio = supportRounds / stats.length;

    // IGL score: high KAST + plays support + moderate ADR
    const score = avgKAST * 0.5 + supportRatio * 30 + (avgADR < 150 ? 20 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = player;
    }
  }

  return bestCandidate;
}

// Get a simple role label from agent name
export function getRoleLabel(agent: string): string {
  const role = AGENT_ROLES[agent.toLowerCase()];
  switch (role) {
    case 'duelist': return 'Duelist';
    case 'controller': return 'Controller';
    case 'initiator': return 'Initiator';
    case 'sentinel': return 'Sentinel';
    default: return 'Unknown';
  }
}
