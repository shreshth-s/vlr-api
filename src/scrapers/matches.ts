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
  MatchSummary,
  MatchDetails,
  MatchTeam,
  MatchStatus,
  MapResult,
  PlayerMatchStats,
  getAgentRole,
} from '../types/index.js';
import { ValidationResult } from '../types/debug.js';
import { config } from '../config/index.js';
import { saveSample } from '../lib/debug.js';

function validateMatchesData(matches: MatchSummary[], type: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (matches.length === 0 && type === 'results') {
    errors.push('No matches found - selectors may be broken');
  }

  const missingTeamNames = matches.filter(m => !m.team1.name || !m.team2.name).length;
  if (missingTeamNames > matches.length / 2 && matches.length > 0) {
    warnings.push(`${missingTeamNames}/${matches.length} matches missing team names`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export interface MatchesResult {
  matches: MatchSummary[];
  debug?: {
    sampleId?: string;
    validation: ValidationResult;
  };
}

export async function getMatches(type: 'live' | 'upcoming' | 'results'): Promise<MatchSummary[]> {
  const result = await getMatchesWithValidation(type);
  return result.matches;
}

export async function getMatchesWithValidation(type: 'live' | 'upcoming' | 'results'): Promise<MatchesResult> {
  const path = type === 'results' ? '/matches/results' : '/matches';
  const { $, html } = await scraper.fetchWithHtml(path);
  const matches: MatchSummary[] = [];

  // Match cards are <a> tags with wf-module-item class
  $('a.wf-module-item.match-item').each((_, el) => {
    const $el = $(el);
    const match = parseMatchCard($, $el, path);
    if (match) {
      matches.push(match);
    }
  });

  // Filter by status for upcoming/live
  let filteredMatches = matches;
  if (type === 'live') {
    filteredMatches = matches.filter(m => m.status === 'live');
  } else if (type === 'upcoming') {
    filteredMatches = matches.filter(m => m.status === 'upcoming');
  }

  // Validate and auto-capture
  const validation = validateMatchesData(filteredMatches, type);
  let sampleId: string | undefined;

  if (config.debug.enabled && config.debug.captureOnEmpty && !validation.valid) {
    try {
      const captureType = type === 'results' ? 'matches-results' :
                          type === 'live' ? 'matches-live' : 'matches-upcoming';
      const sample = saveSample(
        captureType,
        `${config.vlr.baseUrl}${path}`,
        html,
        validation.errors.join('; '),
        { type, validation }
      );
      sampleId = sample.id;
      console.warn(`[Debug] Auto-captured HTML sample ${sampleId} due to validation failure:`, validation.errors);
    } catch (e) {
      console.error('[Debug] Failed to auto-capture sample:', e);
    }
  }

  return {
    matches: filteredMatches,
    debug: config.debug.enabled ? { sampleId, validation } : undefined,
  };
}

function parseMatchCard($: CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>, pagePath: string): MatchSummary | null {
  const link = $el.attr('href');
  const id = parseId(link, /\/(\d+)/);
  if (!id) return null;

  // Team info
  const $teams = $el.find('.match-item-vs-team');
  const team1 = parseMatchTeam($, $teams.eq(0));
  const team2 = parseMatchTeam($, $teams.eq(1));

  // Status detection
  let status: MatchStatus = 'upcoming';
  const statusText = $el.find('.ml-status').text().trim().toLowerCase();

  if (statusText.includes('live')) {
    status = 'live';
  } else if (pagePath.includes('results')) {
    // Results page - all matches are completed
    status = 'completed';
  } else if (team1.score !== undefined && team2.score !== undefined) {
    // Has actual scores (not dashes)
    status = 'completed';
  }

  // Event info
  const eventSeries = cleanText($el.find('.match-item-event-series').text());
  const eventName = cleanText($el.find('.match-item-event').text());
  const event = eventSeries || eventName;
  const stage = eventSeries ? eventName : '';

  // Time
  const matchTime = cleanText($el.find('.match-item-time').text());
  const eta = cleanText($el.find('.ml-eta').text());

  // Event logo
  const eventLogo = parseImageUrl($el.find('.match-item-icon img').attr('src'));

  return {
    id,
    team1,
    team2,
    status,
    event,
    stage,
    matchTime,
    eta: eta || undefined,
    eventLogo,
  };
}

function parseMatchTeam($: CheerioAPI, $team: cheerio.Cheerio<cheerio.Element>): MatchTeam {
  // Team name
  const name = cleanText($team.find('.match-item-vs-team-name').text());

  // Team logo
  const logo = parseImageUrl($team.find('img').attr('src'));

  // Country code from flag
  const flagClass = $team.find('.flag').attr('class') || '';
  const countryCode = parseCountryCode(flagClass);

  // Score - treat dashes and empty as undefined
  const scoreText = $team.find('.match-item-vs-team-score').text().trim();
  let score: number | undefined;
  if (scoreText && scoreText !== '–' && scoreText !== '-' && scoreText !== '') {
    score = parseNumber(scoreText);
    // If parseNumber returns 0, check if it was actually "0" or just unparseable
    if (score === 0 && scoreText !== '0') {
      score = undefined;
    }
  }

  return { name, logo, score, countryCode };
}

export async function getMatchDetails(matchId: string): Promise<MatchDetails> {
  const $ = await scraper.fetch(`/${matchId}`);

  // Basic match info
  const $header = $('.match-header');
  const event = cleanText($header.find('.match-header-event-series').text());
  const stage = cleanText($header.find('.match-header-event').text().replace(event, ''));
  const matchTime = cleanText($header.find('.match-header-date').text());

  // Teams
  const team1 = parseMatchHeaderTeam($, $('.match-header-link').eq(0));
  const team2 = parseMatchHeaderTeam($, $('.match-header-link').eq(1));

  // Format (Bo3, Bo5, etc)
  const formatText = cleanText($('.match-header-vs-note').text());
  const format = formatText || undefined;

  // Status
  let status: MatchStatus = 'upcoming';
  const statusText = $('.match-header-vs-score').text().toLowerCase();
  if (statusText.includes('live')) {
    status = 'live';
  } else if (team1.score !== undefined && team2.score !== undefined) {
    status = 'completed';
  }

  // Maps with player stats
  const maps = parseMapResults($);

  // Streams
  const streams: { name: string; url: string }[] = [];
  $('.match-streams a').each((_, el) => {
    const $stream = $(el);
    const name = cleanText($stream.text());
    const url = $stream.attr('href');
    if (name && url) {
      streams.push({ name, url });
    }
  });

  // VODs
  const vods: string[] = [];
  $('.match-vods a').each((_, el) => {
    const url = $(el).attr('href');
    if (url) vods.push(url);
  });

  return {
    id: matchId,
    team1,
    team2,
    status,
    event,
    stage,
    matchTime,
    format,
    maps,
    streams: streams.length > 0 ? streams : undefined,
    vods: vods.length > 0 ? vods : undefined,
  };
}

function parseMatchHeaderTeam($: CheerioAPI, $team: cheerio.Cheerio<cheerio.Element>): MatchTeam {
  const name = cleanText($team.find('.wf-title-med').text());
  const tag = cleanText($team.find('.wf-title-med').text()); // Usually same as name on match page
  const logo = parseImageUrl($team.find('img').attr('src'));
  const teamUrl = $team.attr('href');
  const id = parseId(teamUrl, /\/team\/(\d+)/);

  // Score from the vs section
  const $vsScore = $('.match-header-vs-score .js-spoiler');
  const scoreTexts = $vsScore.text().trim().split(':');

  // Determine which score belongs to which team based on position
  const isFirst = $team.closest('.match-header-link-name').hasClass('mod-1');
  const scoreIndex = isFirst ? 0 : 1;
  const score = scoreTexts[scoreIndex] ? parseNumber(scoreTexts[scoreIndex]) : undefined;

  return { id, name, tag, logo, score };
}

function parseMapResults($: CheerioAPI): MapResult[] {
  const maps: MapResult[] = [];

  // Each map section
  $('.vm-stats-game').each((_, gameEl) => {
    const $game = $(gameEl);

    // Skip if it's the "all maps" aggregate
    if ($game.attr('data-game-id') === 'all') return;

    const mapName = cleanText($game.find('.map span').first().text()) || 'Unknown';

    // Scores
    const $scores = $game.find('.score');
    const team1Score = parseNumber($scores.eq(0).text());
    const team2Score = parseNumber($scores.eq(1).text());

    // Player stats for each team
    const $tables = $game.find('.wf-table-inset');
    const team1Players = parsePlayerStats($, $tables.eq(0));
    const team2Players = parsePlayerStats($, $tables.eq(1));

    // Which team picked the map
    const pickerClass = $game.find('.map .mod-button').attr('class') || '';
    const picked = pickerClass.includes('mod-1') ? 'team1' :
                   pickerClass.includes('mod-2') ? 'team2' : undefined;

    maps.push({
      map: mapName,
      team1Score,
      team2Score,
      team1Players,
      team2Players,
      picked,
    });
  });

  return maps;
}

function parsePlayerStats($: CheerioAPI, $table: cheerio.Cheerio<cheerio.Element>): PlayerMatchStats[] {
  const players: PlayerMatchStats[] = [];

  $table.find('tbody tr').each((_, row) => {
    const $row = $(row);

    // Player info
    const $player = $row.find('td').first();
    const playerName = cleanText($player.find('.text-of').text());

    // Agent - try multiple selectors
    const $agentImg = $row.find('img').first();
    let agentName = $agentImg.attr('title') || $agentImg.attr('alt') || '';

    // If still no agent, try getting from src path
    if (!agentName) {
      const src = $agentImg.attr('src') || '';
      const srcMatch = src.match(/\/([^\/]+)\.png$/i);
      if (srcMatch) {
        agentName = srcMatch[1];
      }
    }

    const agent = agentName;
    const agentRole = getAgentRole(agentName.toLowerCase());

    // Stats - order: R, ACS, K, D, A, +/-, KAST, ADR, HS%, FK, FD
    // Note: Match details don't include clutch stats per-map (only available in aggregated stats)
    const $stats = $row.find('td.mod-stat');

    const stats: PlayerMatchStats = {
      playerName,
      agent,
      agentRole,
      rounds: parseNumber($stats.eq(0).find('.mod-both').text() || $stats.eq(0).text()),
      acs: parseNumber($stats.eq(1).find('.mod-both').text() || $stats.eq(1).text()),
      kills: parseNumber($stats.eq(2).find('.mod-both').text() || $stats.eq(2).text()),
      deaths: parseNumber($stats.eq(3).find('.mod-both').text() || $stats.eq(3).text()),
      assists: parseNumber($stats.eq(4).find('.mod-both').text() || $stats.eq(4).text()),
      killDeathDiff: parseNumber($stats.eq(5).find('.mod-both').text() || $stats.eq(5).text()),
      kast: parseNumber($stats.eq(6).find('.mod-both').text() || $stats.eq(6).text()),
      adr: parseNumber($stats.eq(7).find('.mod-both').text() || $stats.eq(7).text()),
      headshot: parseNumber($stats.eq(8).find('.mod-both').text() || $stats.eq(8).text()),
      firstKills: parseNumber($stats.eq(9).find('.mod-both').text() || $stats.eq(9).text()),
      firstDeaths: parseNumber($stats.eq(10).find('.mod-both').text() || $stats.eq(10).text()),
      rating: 0,
      // Clutch stats not available per-map, only in aggregated leaderboard
      clutchWins: 0,
      clutchAttempts: 0,
      clutchPercent: 0,
    };

    if (playerName) {
      players.push(stats);
    }
  });

  return players;
}
