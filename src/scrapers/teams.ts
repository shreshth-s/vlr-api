import {
  scraper,
  parseNumber,
  parseId,
  parseImageUrl,
  parseCountryCode,
  cleanText,
  CheerioAPI,
} from '../lib/scraper.js';
import {
  Team,
  TeamProfile,
  TeamRoster,
  RosterPlayer,
  RosterStaff,
  MatchSummary,
  MatchStatus,
} from '../types/index.js';
import { ValidationResult } from '../types/debug.js';
import { config } from '../config/index.js';
import { saveSample } from '../lib/debug.js';

const REGIONS = [
  'na',         // North America
  'eu',         // Europe
  'ap',         // Asia Pacific
  'la',         // Latin America
  'la-s',       // Latin America South
  'la-n',       // Latin America North
  'oce',        // Oceania
  'kr',         // Korea
  'mn',         // MENA
  'gc',         // Game Changers
  'br',         // Brazil
  'cn',         // China
  'jp',         // Japan
] as const;

export type Region = typeof REGIONS[number];

function validateRankingsData(teams: Team[], region: string): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (teams.length === 0) {
    errors.push(`No teams found for region ${region} - selectors may be broken`);
  } else if (teams.length < 5 && region === 'all') {
    warnings.push(`Suspiciously few teams in global rankings (${teams.length})`);
  }

  const missingNames = teams.filter(t => !t.name).length;
  if (missingNames > 0) {
    warnings.push(`${missingNames} teams missing names`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

export interface RankingsResult {
  teams: Team[];
  debug?: {
    sampleId?: string;
    validation: ValidationResult;
  };
}

export async function getTeamRankings(region: Region | 'all' = 'all'): Promise<Team[]> {
  const result = await getTeamRankingsWithValidation(region);
  return result.teams;
}

export async function getTeamRankingsWithValidation(region: Region | 'all' = 'all'): Promise<RankingsResult> {
  const path = region === 'all' ? '/rankings' : `/rankings/${region}`;
  const { $, html } = await scraper.fetchWithHtml(path);
  const teams: Team[] = [];

  if (region === 'all') {
    // Parse the global rankings table
    $('tbody tr').each((_, row) => {
      const $row = $(row);
      const team = parseRankingRow($, $row);
      if (team) teams.push(team);
    });
  } else {
    // Regional rankings have a different structure
    $('.wf-card.mod-scroll').each((_, card) => {
      const $card = $(card);
      $card.find('.rank-item').each((_, item) => {
        const $item = $(item);
        const team = parseRegionalRankingItem($, $item);
        if (team) teams.push(team);
      });
    });
  }

  // Validate and auto-capture
  const validation = validateRankingsData(teams, region);
  let sampleId: string | undefined;

  if (config.debug.enabled && config.debug.captureOnEmpty && !validation.valid) {
    try {
      const sample = saveSample(
        'team-rankings',
        `${config.vlr.baseUrl}${path}`,
        html,
        validation.errors.join('; '),
        { region, validation }
      );
      sampleId = sample.id;
      console.warn(`[Debug] Auto-captured HTML sample ${sampleId} due to validation failure:`, validation.errors);
    } catch (e) {
      console.error('[Debug] Failed to auto-capture sample:', e);
    }
  }

  return {
    teams,
    debug: config.debug.enabled ? { sampleId, validation } : undefined,
  };
}

function parseRankingRow($: CheerioAPI, $row: cheerio.Cheerio<cheerio.Element>): Team | null {
  const $link = $row.find('a');
  const href = $link.attr('href');
  const id = parseId(href, /\/team\/(\d+)/);
  if (!id) return null;

  const rank = parseNumber($row.find('.rank-item-rank').text());
  const name = cleanText($row.find('.rank-item-team').text());
  const logo = parseImageUrl($row.find('.rank-item-team img').attr('src'));
  const rating = parseNumber($row.find('.rank-item-rating').text());

  const $flag = $row.find('.flag');
  const countryCode = parseCountryCode($flag.attr('class'));

  const recordText = cleanText($row.find('.rank-item-record').text());
  const recordMatch = recordText.match(/(\d+)–(\d+)/);
  const record = recordMatch
    ? { wins: parseInt(recordMatch[1]), losses: parseInt(recordMatch[2]) }
    : undefined;

  const earningsText = $row.find('.rank-item-earnings').text();
  const earnings = parseNumber(earningsText.replace('$', ''));

  return {
    id,
    name,
    logo,
    rank,
    rating,
    countryCode,
    record,
    earnings: earnings || undefined,
  };
}

function parseRegionalRankingItem($: CheerioAPI, $item: cheerio.Cheerio<cheerio.Element>): Team | null {
  const $link = $item.find('a');
  const href = $link.attr('href');
  const id = parseId(href, /\/team\/(\d+)/);
  if (!id) return null;

  const rank = parseNumber($item.find('.rank-item-rank-num').text());
  const name = cleanText($item.find('.ge-text').text());
  const logo = parseImageUrl($item.find('img').attr('src'));
  const $flag = $item.find('.flag');
  const countryCode = parseCountryCode($flag.attr('class'));

  return {
    id,
    name,
    logo,
    rank,
    countryCode,
  };
}

export async function getTeamProfile(teamId: string): Promise<TeamProfile> {
  const $ = await scraper.fetch(`/team/${teamId}`);

  // Basic info
  const $header = $('.team-header');
  const name = cleanText($header.find('.team-header-name h1').text());
  const tag = cleanText($header.find('.team-header-name h2').text());
  const logo = parseImageUrl($header.find('.team-header-logo img').attr('src'));

  // Country
  const $flag = $header.find('.team-header-country .flag');
  const countryCode = parseCountryCode($flag.attr('class'));
  const country = cleanText($header.find('.team-header-country').text());

  // Links
  const website = $header.find('a[href*="http"]:not([href*="twitter"])').attr('href');
  const twitter = $header.find('a[href*="twitter.com"]').attr('href');

  // Stats from summary
  const $summary = $('.team-summary-container-1');
  const rank = parseNumber($summary.find('.rank-num').text());

  const $stats = $summary.find('.wf-title');
  let rating: number | undefined;
  let earnings: number | undefined;
  let wins = 0;
  let losses = 0;

  $stats.each((_, el) => {
    const text = $(el).text().trim();
    const label = $(el).prev().text().toLowerCase();

    if (label.includes('rating')) {
      rating = parseNumber(text);
    } else if (label.includes('winnings') || label.includes('earnings')) {
      earnings = parseNumber(text.replace('$', ''));
    } else if (label.includes('record')) {
      const match = text.match(/(\d+).*?(\d+)/);
      if (match) {
        wins = parseInt(match[1]);
        losses = parseInt(match[2]);
      }
    }
  });

  // Roster
  const roster = parseRoster($);

  // Recent and upcoming matches
  const recentMatches = parseTeamMatches($, '.team-summary-container-2 .m-item', 'completed');
  const upcomingMatches = parseTeamMatches($, '.team-summary-container-3 .m-item', 'upcoming');

  return {
    id: teamId,
    name,
    tag: tag || undefined,
    logo,
    country: country || undefined,
    countryCode,
    rank: rank || undefined,
    rating,
    earnings,
    record: wins || losses ? { wins, losses } : undefined,
    website,
    twitter,
    roster,
    recentMatches,
    upcomingMatches,
  };
}

function parseRoster($: CheerioAPI): TeamRoster {
  const players: RosterPlayer[] = [];
  const staff: RosterStaff[] = [];

  $('.team-roster-item').each((_, item) => {
    const $item = $(item);
    const $link = $item.find('a');
    const href = $link.attr('href');
    const id = parseId(href, /\/player\/(\d+)/);
    if (!id) return;

    const name = cleanText($item.find('.team-roster-item-name-alias').text());
    const realName = cleanText($item.find('.team-roster-item-name-real').text());
    const $flag = $item.find('.flag');
    const countryCode = parseCountryCode($flag.attr('class'));

    // Check if staff or player
    const roleTag = cleanText($item.find('.wf-tag').text()).toLowerCase();
    const isStaff = ['coach', 'assistant', 'analyst', 'manager', 'sub'].some(r => roleTag.includes(r));

    if (isStaff) {
      staff.push({
        id,
        name,
        realName: realName || undefined,
        countryCode,
        role: roleTag || 'staff',
      });
    } else {
      players.push({
        id,
        name,
        realName: realName || undefined,
        countryCode,
        role: roleTag || undefined,
      });
    }
  });

  return { players, staff };
}

function parseTeamMatches(
  $: CheerioAPI,
  selector: string,
  defaultStatus: MatchStatus
): MatchSummary[] {
  const matches: MatchSummary[] = [];

  $(selector).each((_, el) => {
    const $match = $(el);
    const href = $match.attr('href');
    const id = parseId(href, /\/(\d+)\//);
    if (!id) return;

    const $teams = $match.find('.m-item-team');
    const team1Name = cleanText($teams.eq(0).find('.m-item-team-name').text());
    const team2Name = cleanText($teams.eq(1).find('.m-item-team-name').text());
    const team1Score = parseNumber($teams.eq(0).find('.m-item-team-score').text());
    const team2Score = parseNumber($teams.eq(1).find('.m-item-team-score').text());
    const team1Logo = parseImageUrl($teams.eq(0).find('img').attr('src'));
    const team2Logo = parseImageUrl($teams.eq(1).find('img').attr('src'));

    const eventText = cleanText($match.find('.m-item-event').text());
    const eventParts = eventText.split('\n').map(s => s.trim()).filter(Boolean);

    const matchTime = cleanText($match.find('.m-item-date').text());

    let status = defaultStatus;
    if ($match.find('.m-item-result').text().toLowerCase().includes('live')) {
      status = 'live';
    }

    matches.push({
      id,
      team1: { name: team1Name, logo: team1Logo, score: team1Score || undefined },
      team2: { name: team2Name, logo: team2Logo, score: team2Score || undefined },
      status,
      event: eventParts[0] || '',
      stage: eventParts[1] || undefined,
      matchTime,
    });
  });

  return matches;
}

export async function getTeamMatches(
  teamId: string,
  type: 'upcoming' | 'completed' = 'completed',
  page: number = 1
): Promise<{ matches: MatchSummary[]; hasMore: boolean }> {
  const group = type === 'upcoming' ? 'upcoming' : 'completed';
  const $ = await scraper.fetch(`/team/matches/${teamId}/?group=${group}&page=${page}`);

  const matches = parseTeamMatches($, '.m-item', type === 'upcoming' ? 'upcoming' : 'completed');
  const hasMore = $('.pagination .mod-next').length > 0;

  return { matches, hasMore };
}

export async function searchTeams(query: string): Promise<Team[]> {
  const $ = await scraper.fetch(`/search?q=${encodeURIComponent(query)}&type=teams`);
  const teams: Team[] = [];

  $('a.search-item').each((_, el) => {
    const $item = $(el);
    // VLR search uses format: /search/r/team/{id}/idx
    const link = $item.attr('href');
    const id = parseId(link, /\/search\/r\/team\/(\d+)/);
    const name = cleanText($item.find('.search-item-title').text());
    const tag = cleanText($item.find('.search-item-desc').text());
    const logo = parseImageUrl($item.find('img').attr('src'));
    const $flag = $item.find('.flag');
    const countryCode = parseCountryCode($flag.attr('class'));

    if (id && name) {
      teams.push({
        id,
        name,
        tag: tag || undefined,
        logo,
        countryCode,
      });
    }
  });

  return teams;
}

export { REGIONS };
