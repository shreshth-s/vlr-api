import {
  scraper,
  parseText,
  parseNumber,
  parseId,
  parseImageUrl,
  parseCountryCode,
  cleanText,
  CheerioAPI,
} from '../lib/scraper.js';
import {
  Player,
  PlayerProfile,
  PlayerStats,
  LeaderboardEntry,
  StatsFilter,
  TeamHistoryEntry,
  EventPlacement,
  getAgentRole,
  AgentRole,
} from '../types/index.js';
import { isT1Team, getT1TeamInfo } from '../data/tiers.js';
import { ValidationResult } from '../types/debug.js';
import { config } from '../config/index.js';
import { saveSample } from '../lib/debug.js';

export async function getPlayerProfile(playerId: string): Promise<PlayerProfile> {
  const $ = await scraper.fetch(`/player/${playerId}`);

  // Basic info from header
  const $header = $('.player-header');
  const name = cleanText($header.find('.wf-title').first().text());
  const realName = cleanText($header.find('.player-real-name').text());

  // Image
  const image = parseImageUrl($header.find('.wf-avatar img').attr('src'));

  // Country - from the last div in header or flag
  const $flag = $header.find('.flag');
  const countryCode = parseCountryCode($flag.attr('class'));
  const country = $flag.parent().text().trim().replace(/^\s*/, '');

  // Current team
  const $teamLink = $header.find('a[href*="/team/"]').first();
  const team = cleanText($teamLink.find('.wf-title').text()) || cleanText($teamLink.text());
  const teamId = parseId($teamLink.attr('href'), /\/team\/(\d+)/);
  const teamLogo = parseImageUrl($teamLink.find('img').attr('src'));

  // Social links
  const twitter = $header.find('a[href*="twitter.com"], a[href*="x.com"]').attr('href');
  const twitch = $header.find('a[href*="twitch.tv"]').attr('href');

  // Team history - look for wf-module-item elements that link to teams
  const teamHistory = parseTeamHistory($);

  // Past events
  const pastEvents = parsePastEvents($);

  // Get earnings from events or summary
  let earnings = 0;
  pastEvents.forEach(e => {
    if (e.prize) earnings += e.prize;
  });

  return {
    id: playerId,
    name,
    realName: realName || undefined,
    country: country || undefined,
    countryCode,
    team: team || undefined,
    teamId,
    image,
    twitter,
    earnings: earnings || undefined,
    teamHistory,
    pastEvents,
  };
}

function parseTeamHistory($: CheerioAPI): TeamHistoryEntry[] {
  const history: TeamHistoryEntry[] = [];

  // Team history items in sidebar - these are wf-module-item links to teams
  $('a.wf-module-item[href*="/team/"]').each((_, el) => {
    const $item = $(el);
    const teamId = parseId($item.attr('href'), /\/team\/(\d+)/);
    if (!teamId) return;

    const logo = parseImageUrl($item.find('img').attr('src'));

    // Team name is in the title or first text element (not the date)
    let teamName = '';
    const $title = $item.find('.wf-module-item-title, .text-of');
    if ($title.length) {
      teamName = cleanText($title.first().text());
    }

    // If no title found, look for text that's NOT a date pattern
    if (!teamName) {
      $item.find('div').each((_, div) => {
        const text = $(div).text().trim();
        // Skip if it looks like a date (contains month names or year patterns)
        if (!text.match(/(January|February|March|April|May|June|July|August|September|October|November|December|joined|left|\d{4})/i)) {
          if (text && !teamName) {
            teamName = text.split('\n')[0].trim();
          }
        }
      });
    }

    // Get dates from ge-text-light
    const dateText = cleanText($item.find('.ge-text-light').text());

    // Skip if we still don't have a name (might be current team shown elsewhere)
    if (teamId && !history.some(h => h.teamId === teamId)) {
      history.push({
        teamId,
        teamName: teamName || `Team ${teamId}`,
        logo,
        joinDate: dateText || undefined,
      });
    }
  });

  return history;
}

function parsePastEvents($: CheerioAPI): EventPlacement[] {
  const events: EventPlacement[] = [];

  // Events are in mod-event rows or wf-card items with event links
  $('a.wf-module-item[href*="/event/"], .mod-event').each((_, el) => {
    const $item = $(el);
    const href = $item.attr('href') || $item.find('a').attr('href');
    const eventId = parseId(href, /\/event\/(\d+)/);

    if (!eventId) return;

    // Get event name - usually in text-of or the link text
    let eventName = cleanText($item.find('.text-of').first().text());
    if (!eventName) {
      eventName = cleanText($item.find('.wf-module-item-title').text());
    }
    if (!eventName) {
      // Get just the event name from the text, excluding other elements
      const fullText = $item.clone().children().remove().end().text().trim();
      eventName = fullText.split('\n')[0].trim();
    }

    // Placement - look for place indicator
    const placement = cleanText($item.find('.placement, .mod-placement, [class*="place"]').text()) ||
                     cleanText($item.find('.ge-text-light').first().text());

    // Prize
    const prizeText = $item.text();
    const prizeMatch = prizeText.match(/\$[\d,]+/);
    const prize = prizeMatch ? parseNumber(prizeMatch[0].replace('$', '')) : undefined;

    if (eventId && eventName && !events.some(e => e.eventId === eventId)) {
      events.push({
        eventId,
        eventName,
        placement: placement || undefined,
        prize,
        date: undefined,
      });
    }
  });

  return events;
}

export async function getPlayerMatches(
  playerId: string,
  page: number = 1
): Promise<{ matches: PlayerMatchEntry[]; hasMore: boolean }> {
  const $ = await scraper.fetch(`/player/matches/${playerId}/?page=${page}`);
  const matches: PlayerMatchEntry[] = [];

  $('.m-item').each((_, el) => {
    const $match = $(el);
    const link = $match.attr('href');
    const matchId = parseId(link, /\/(\d+)\//);
    if (!matchId) return;

    const event = cleanText($match.find('.m-item-event').text());
    const date = cleanText($match.find('.m-item-date').text());

    // Teams
    const $teams = $match.find('.m-item-team');
    const team1Name = cleanText($teams.eq(0).find('.m-item-team-name').text());
    const team2Name = cleanText($teams.eq(1).find('.m-item-team-name').text());
    const team1Score = parseNumber($teams.eq(0).find('.m-item-team-score').text());
    const team2Score = parseNumber($teams.eq(1).find('.m-item-team-score').text());

    matches.push({
      matchId,
      event,
      date,
      team1: { name: team1Name, score: team1Score },
      team2: { name: team2Name, score: team2Score },
    });
  });

  // Check if there are more pages
  const hasMore = $('.pagination .mod-next').length > 0;

  return { matches, hasMore };
}

export interface PlayerMatchEntry {
  matchId: string;
  event: string;
  date: string;
  team1: { name: string; score: number };
  team2: { name: string; score: number };
}

export async function getPlayerAgentStats(
  playerId: string,
  timespan: '30' | '60' | '90' | 'all' = 'all'
): Promise<AgentStat[]> {
  const $ = await scraper.fetch(`/player/${playerId}/?timespan=${timespan}d`);
  const agents: AgentStat[] = [];

  $('.agent-item').each((_, el) => {
    const $agent = $(el);
    const name = $agent.find('.agent-name').text().trim() ||
                 $agent.find('img').attr('alt') || '';
    const img = parseImageUrl($agent.find('img').attr('src'));

    const $stats = $agent.find('.agent-stats span');
    const rounds = parseNumber($stats.eq(0).text());
    const rating = parseNumber($stats.eq(1).text());
    const acs = parseNumber($stats.eq(2).text());
    const kd = parseNumber($stats.eq(3).text());

    if (name) {
      agents.push({
        name,
        img,
        role: getAgentRole(name),
        rounds,
        rating,
        acs,
        kd,
      });
    }
  });

  return agents;
}

export interface AgentStat {
  name: string;
  img?: string;
  role: AgentRole;
  rounds: number;
  rating: number;
  acs: number;
  kd: number;
}

function validateLeaderboardData(entries: LeaderboardEntry[]): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (entries.length === 0) {
    errors.push('No entries found - selectors may be broken');
  } else if (entries.length < 5) {
    warnings.push(`Suspiciously few entries (${entries.length})`);
  }

  // Check for missing critical data
  const missingNames = entries.filter(e => !e.player.name).length;
  if (missingNames > 0) {
    warnings.push(`${missingNames} entries missing player names`);
  }

  const zeroRatings = entries.filter(e => e.stats.rating === 0).length;
  if (zeroRatings > entries.length / 2) {
    warnings.push(`${zeroRatings}/${entries.length} entries have zero rating`);
  }

  const noAgents = entries.filter(e => e.agents.length === 0).length;
  if (noAgents > entries.length / 2) {
    warnings.push(`${noAgents}/${entries.length} entries missing agent data`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  debug?: {
    sampleId?: string;
    validation: ValidationResult;
  };
}

export async function getStatsLeaderboard(filters: StatsFilter = {}): Promise<LeaderboardEntry[]> {
  const result = await getStatsLeaderboardWithValidation(filters);
  return result.entries;
}

export async function getStatsLeaderboardWithValidation(filters: StatsFilter = {}): Promise<LeaderboardResult> {
  // Build query params
  const params = new URLSearchParams();
  if (filters.eventId) params.set('event_id', filters.eventId);
  if (filters.eventSeries) params.set('event_series', filters.eventSeries);
  if (filters.region) params.set('region', filters.region);
  if (filters.country) params.set('country', filters.country);
  if (filters.minRounds) params.set('min_rounds', filters.minRounds.toString());
  if (filters.minRating) params.set('min_rating', filters.minRating.toString());
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.map) params.set('map', filters.map);
  if (filters.timespan) params.set('timespan', filters.timespan + 'd');

  const url = `/stats/?${params.toString()}`;
  const { $, html } = await scraper.fetchWithHtml(url);
  const entries: LeaderboardEntry[] = [];

  $('.wf-table tbody tr').each((_, row) => {
    const $row = $(row);

    // Player
    const $player = $row.find('.mod-player');
    const playerLink = $player.find('a').attr('href');
    const playerId = parseId(playerLink, /\/player\/(\d+)/);
    const playerName = cleanText($player.find('.text-of').text());
    const playerImg = parseImageUrl($player.find('img').attr('src'));
    const $flag = $player.find('.flag');
    const countryCode = parseCountryCode($flag.attr('class'));

    // Team - try multiple approaches
    let teamName = '';
    let teamId: string | undefined;

    // Approach 1: Look for .mod-team class
    const $team = $row.find('.mod-team');
    if ($team.length) {
      teamName = cleanText($team.text());
      const teamLink = $team.find('a').attr('href');
      teamId = parseId(teamLink, /\/team\/(\d+)/);
    }

    // Approach 2: Look for team link in the player cell
    if (!teamName) {
      const $teamLink = $player.find('a[href*="/team/"]');
      if ($teamLink.length) {
        teamName = cleanText($teamLink.text());
        teamId = parseId($teamLink.attr('href'), /\/team\/(\d+)/);
      }
    }

    // Approach 3: Look for stats-player-country (current VLR format)
    if (!teamName) {
      const $teamDiv = $player.find('.stats-player-country');
      if ($teamDiv.length) {
        teamName = cleanText($teamDiv.text());
      }
    }

    // Approach 4: Look for ge-text-light (team abbreviation often shown there)
    if (!teamName) {
      const $teamAbbr = $player.find('.ge-text-light');
      if ($teamAbbr.length) {
        teamName = cleanText($teamAbbr.text());
      }
    }

    // Approach 5: Look for text after the player name link within the cell
    if (!teamName) {
      const $playerCell = $row.find('td').first();
      const cellHtml = $playerCell.html() || '';
      // Look for team name pattern after player link
      const teamMatch = cellHtml.match(/<\/a>\s*(?:<[^>]+>)*\s*([A-Za-z0-9\s]+?)(?:\s*<|$)/);
      if (teamMatch && teamMatch[1]) {
        teamName = cleanText(teamMatch[1]);
      }
    }

    // Agents played - try multiple selectors
    const agents: string[] = [];
    $row.find('td.mod-agents img, td img[src*="agent"]').each((_, img) => {
      let agent = $(img).attr('title') || $(img).attr('alt') || '';
      // Try to extract from src if no title/alt
      if (!agent) {
        const src = $(img).attr('src') || '';
        const match = src.match(/\/([^\/]+)\.png$/i);
        if (match) agent = match[1];
      }
      if (agent) agents.push(agent);
    });

    // Stats - VLR stats table columns:
    // 0: Player, 1: Agents, 2: Rnd, 3: R2.0, 4: ACS, 5: K:D, 6: KAST,
    // 7: ADR, 8: KPR, 9: APR, 10: FKPR, 11: FDPR, 12: HS%, 13: CL%, 14: CL,
    // 15: KMax, 16: K, 17: D, 18: A, 19: FK, 20: FD
    const $stats = $row.find('td');

    // Parse clutch stats
    // Column 13 = CL% (percentage), Column 14 = CL (wins/attempts format)
    const clutchPercentText = $stats.eq(13).text().trim();
    const clutchCountText = $stats.eq(14).text().trim();

    let clutchWins = 0;
    let clutchAttempts = 0;
    let clutchPercent = 0;

    // Parse CL% (percentage)
    if (clutchPercentText) {
      clutchPercent = parseNumber(clutchPercentText);
    }

    // Parse CL (wins/attempts) - format like "5/10" or just a number
    if (clutchCountText.includes('/')) {
      const clutchParts = clutchCountText.split('/');
      clutchWins = parseNumber(clutchParts[0]);
      clutchAttempts = parseNumber(clutchParts[1]);
    } else if (clutchCountText) {
      // Sometimes just total clutches won is shown
      clutchWins = parseNumber(clutchCountText);
    }

    // If we have wins and attempts but no percent, calculate it
    if (clutchAttempts > 0 && !clutchPercent) {
      clutchPercent = Math.round((clutchWins / clutchAttempts) * 100);
    }

    // Parse total stats (columns 15-20)
    const killsMax = parseNumber($stats.eq(15).text());
    const totalKills = parseNumber($stats.eq(16).text());
    const totalDeaths = parseNumber($stats.eq(17).text());
    const totalAssists = parseNumber($stats.eq(18).text());
    const totalFirstKills = parseNumber($stats.eq(19).text());
    const totalFirstDeaths = parseNumber($stats.eq(20).text());

    const stats: PlayerStats = {
      rounds: parseNumber($stats.eq(2).text()),
      rating: parseNumber($stats.eq(3).text()),
      acs: parseNumber($stats.eq(4).text()),
      kills: totalKills, // Use total kills
      deaths: totalDeaths, // Use total deaths
      assists: totalAssists, // Use total assists
      killDeathDiff: totalKills - totalDeaths,
      kast: parseNumber($stats.eq(6).text()),
      adr: parseNumber($stats.eq(7).text()),
      headshot: parseNumber($stats.eq(12).text()),
      firstKills: totalFirstKills,
      firstDeaths: totalFirstDeaths,
      kpr: parseNumber($stats.eq(8).text()),
      apr: parseNumber($stats.eq(9).text()),
      fkpr: parseNumber($stats.eq(10).text()),
      fdpr: parseNumber($stats.eq(11).text()),
      // Clutch stats
      clutchWins: clutchWins || undefined,
      clutchAttempts: clutchAttempts || undefined,
      clutchPercent: clutchPercent || undefined,
      // Total stats
      totalKills: totalKills || undefined,
      totalDeaths: totalDeaths || undefined,
      totalAssists: totalAssists || undefined,
      totalFirstKills: totalFirstKills || undefined,
      totalFirstDeaths: totalFirstDeaths || undefined,
      killsMax: killsMax || undefined,
    };

    if (playerId && playerName) {
      entries.push({
        player: {
          id: playerId,
          name: playerName,
          image: playerImg,
          countryCode,
          team: teamName || undefined,
          teamId,
        },
        agents,
        stats,
      });
    }
  });

  // Apply tier filtering (try teamId first, fall back to team name)
  let filteredEntries = entries;

  if (filters.tier === 't1') {
    filteredEntries = filteredEntries.filter(entry => {
      // Try teamId first (more reliable), then team name
      return isT1Team(entry.player.teamId) || isT1Team(entry.player.team);
    });
    if (filters.tierStatus) {
      filteredEntries = filteredEntries.filter(entry => {
        const teamInfo = getT1TeamInfo(entry.player.teamId) || getT1TeamInfo(entry.player.team);
        return teamInfo?.status === filters.tierStatus;
      });
    }
  } else if (filters.tier === 't2') {
    filteredEntries = filteredEntries.filter(entry => {
      // Not T1 by either ID or name
      return !isT1Team(entry.player.teamId) && !isT1Team(entry.player.team);
    });
  }

  // Validate results and auto-capture on suspicious data
  const validation = validateLeaderboardData(filteredEntries);
  let sampleId: string | undefined;

  if (config.debug.enabled && config.debug.captureOnEmpty && !validation.valid) {
    try {
      const sample = saveSample(
        'player-stats',
        `${config.vlr.baseUrl}${url}`,
        html,
        validation.errors.join('; '),
        { filters, validation }
      );
      sampleId = sample.id;
      console.warn(`[Debug] Auto-captured HTML sample ${sampleId} due to validation failure:`, validation.errors);
    } catch (e) {
      console.error('[Debug] Failed to auto-capture sample:', e);
    }
  }

  return {
    entries: filteredEntries,
    debug: config.debug.enabled ? { sampleId, validation } : undefined,
  };
}

export async function searchPlayers(query: string): Promise<Player[]> {
  // VLR doesn't have a great search API, so we search through the stats page
  // with a name filter approach or use the general search
  const $ = await scraper.fetch(`/search?q=${encodeURIComponent(query)}&type=players`);
  const players: Player[] = [];

  $('.search-item').each((_, el) => {
    const $item = $(el);
    const link = $item.find('a').attr('href');
    const id = parseId(link, /\/player\/(\d+)/);
    const name = cleanText($item.find('.search-item-title').text());
    const team = cleanText($item.find('.search-item-desc').text());
    const image = parseImageUrl($item.find('img').attr('src'));
    const $flag = $item.find('.flag');
    const countryCode = parseCountryCode($flag.attr('class'));

    if (id && name) {
      players.push({
        id,
        name,
        team: team || undefined,
        image,
        countryCode,
      });
    }
  });

  return players;
}
