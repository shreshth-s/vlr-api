import {
  scraper,
  parseNumber,
  parseId,
  parseImageUrl,
  cleanText,
  CheerioAPI,
} from '../lib/scraper.js';
import {
  Event,
  EventDetails,
  Team,
  MatchSummary,
  Standing,
} from '../types/index.js';

export type EventStatus = 'ongoing' | 'upcoming' | 'completed';

export async function getEvents(status: EventStatus = 'ongoing'): Promise<Event[]> {
  const $ = await scraper.fetch('/events');
  const events: Event[] = [];

  // Parse all event items
  $('a.event-item').each((_, el) => {
    const $item = $(el);

    // Determine event status from status text or class
    const statusText = cleanText($item.find('.event-item-desc-item-status').text()).toLowerCase();
    let eventStatus: EventStatus;

    if (statusText.includes('live') || statusText.includes('ongoing')) {
      eventStatus = 'ongoing';
    } else if (statusText.includes('upcoming') || statusText.includes('starts')) {
      eventStatus = 'upcoming';
    } else if (statusText.includes('completed') || statusText.includes('finished')) {
      eventStatus = 'completed';
    } else {
      // Default based on presence of dates
      eventStatus = 'upcoming';
    }

    // Filter by requested status
    if (status !== eventStatus) return;

    const event = parseEventItem($, $item, eventStatus);
    if (event) events.push(event);
  });

  return events;
}

function parseEventItem($: CheerioAPI, $item: cheerio.Cheerio<cheerio.Element>, status: EventStatus): Event | null {
  // $item is the <a> tag itself
  const href = $item.attr('href');
  const id = parseId(href, /\/event\/(\d+)/);
  if (!id) return null;

  const name = cleanText($item.find('.event-item-title').text());
  const logo = parseImageUrl($item.find('.event-item-thumb img').attr('src'));

  // Get prize and dates from mod-specific elements
  const prizePool = cleanText($item.find('.event-item-desc-item.mod-prize').text()).replace('Prize Pool', '').trim();
  const dates = cleanText($item.find('.event-item-desc-item.mod-dates').text()).replace('Dates', '').trim();
  const location = cleanText($item.find('.event-item-desc-item.mod-location').text()).replace('Location', '').trim();

  // Region from tags
  const region = cleanText($item.find('.event-item-tag').first().text());

  return {
    id,
    name,
    status,
    logo,
    dates: dates || undefined,
    prizePool: prizePool || undefined,
    location: location || undefined,
    region: region || undefined,
  };
}

export async function getEventDetails(eventId: string): Promise<EventDetails> {
  const $ = await scraper.fetch(`/event/${eventId}`);

  // Basic info
  const $header = $('.event-header');
  const name = cleanText($header.find('.event-header-title').text());
  const logo = parseImageUrl($header.find('.event-header-thumb img').attr('src'));

  // Dates, prize, location
  const dates = cleanText($header.find('.event-desc-item-value').eq(0).text());
  const prizePool = cleanText($header.find('.event-desc-item-value').eq(1).text());
  const location = cleanText($header.find('.event-desc-item-value').eq(2).text());

  // Status
  let status: EventStatus = 'upcoming';
  const statusText = $header.find('.event-header-status').text().toLowerCase();
  if (statusText.includes('live') || statusText.includes('ongoing')) {
    status = 'ongoing';
  } else if (statusText.includes('completed') || statusText.includes('finished')) {
    status = 'completed';
  }

  // Teams
  const teams = parseEventTeams($);

  // Matches
  const matches = parseEventMatches($);

  // Standings
  const standings = parseEventStandings($);

  return {
    id: eventId,
    name,
    status,
    logo,
    dates: dates || undefined,
    prizePool: prizePool || undefined,
    location: location || undefined,
    teams: teams.length > 0 ? teams : undefined,
    matches: matches.length > 0 ? matches : undefined,
    standings: standings.length > 0 ? standings : undefined,
  };
}

function parseEventTeams($: CheerioAPI): Team[] {
  const teams: Team[] = [];

  $('.event-team').each((_, el) => {
    const $team = $(el);
    const $link = $team.find('a');
    const href = $link.attr('href');
    const id = parseId(href, /\/team\/(\d+)/);
    if (!id) return;

    const name = cleanText($team.find('.event-team-name').text());
    const logo = parseImageUrl($team.find('img').attr('src'));

    teams.push({ id, name, logo });
  });

  // Alternative selector
  if (teams.length === 0) {
    $('.wf-card.team-item, .team-item').each((_, el) => {
      const $team = $(el);
      const $link = $team.find('a');
      const href = $link.attr('href');
      const id = parseId(href, /\/team\/(\d+)/);
      if (!id) return;

      const name = cleanText($link.text());
      const logo = parseImageUrl($team.find('img').attr('src'));

      teams.push({ id, name, logo });
    });
  }

  return teams;
}

function parseEventMatches($: CheerioAPI): MatchSummary[] {
  const matches: MatchSummary[] = [];

  $('.event-match, .m-item').each((_, el) => {
    const $match = $(el);
    const href = $match.attr('href') || $match.find('a').attr('href');
    const id = parseId(href, /\/(\d+)\//);
    if (!id) return;

    const $teams = $match.find('.m-item-team, .event-match-team');
    const team1Name = cleanText($teams.eq(0).find('.m-item-team-name, .event-match-team-name').text());
    const team2Name = cleanText($teams.eq(1).find('.m-item-team-name, .event-match-team-name').text());
    const team1Score = parseNumber($teams.eq(0).find('.m-item-team-score, .event-match-team-score').text());
    const team2Score = parseNumber($teams.eq(1).find('.m-item-team-score, .event-match-team-score').text());

    const isLive = $match.find('.m-item-result, .mod-live').text().toLowerCase().includes('live');
    const hasScore = team1Score !== 0 || team2Score !== 0;

    const status = isLive ? 'live' : hasScore ? 'completed' : 'upcoming';

    const event = cleanText($match.find('.m-item-event').text());
    const matchTime = cleanText($match.find('.m-item-date').text());

    matches.push({
      id,
      team1: { name: team1Name, score: team1Score || undefined },
      team2: { name: team2Name, score: team2Score || undefined },
      status,
      event,
      matchTime,
    });
  });

  return matches;
}

function parseEventStandings($: CheerioAPI): Standing[] {
  const standings: Standing[] = [];

  $('.event-group-table tbody tr, .wf-table tbody tr').each((_, row) => {
    const $row = $(row);

    // Position
    const posText = $row.find('td').first().text().trim();
    const position = parseNumber(posText) || standings.length + 1;

    // Team
    const $team = $row.find('.team-item, .text-of');
    const teamLink = $team.find('a').attr('href') || $team.closest('a').attr('href');
    const teamId = parseId(teamLink, /\/team\/(\d+)/);
    const teamName = cleanText($team.text());
    const teamLogo = parseImageUrl($row.find('.team-item img, td img').attr('src'));

    if (!teamId || !teamName) return;

    // Record
    const recordText = $row.find('.event-group-table-record, td:nth-child(3)').text().trim();
    const recordMatch = recordText.match(/(\d+)\s*[-–]\s*(\d+)/);
    const wins = recordMatch ? parseInt(recordMatch[1]) : 0;
    const losses = recordMatch ? parseInt(recordMatch[2]) : 0;

    // Round diff
    const roundDiffText = $row.find('td:nth-child(4)').text().trim();
    const roundDiff = parseNumber(roundDiffText);

    standings.push({
      position,
      team: { id: teamId, name: teamName, logo: teamLogo },
      wins,
      losses,
      roundDiff: roundDiff || undefined,
    });
  });

  return standings;
}

export async function searchEvents(query: string): Promise<Event[]> {
  const $ = await scraper.fetch(`/search?q=${encodeURIComponent(query)}&type=events`);
  const events: Event[] = [];

  $('.search-item').each((_, el) => {
    const $item = $(el);
    const link = $item.find('a').attr('href');
    const id = parseId(link, /\/event\/(\d+)/);
    const name = cleanText($item.find('.search-item-title').text());
    const dates = cleanText($item.find('.search-item-desc').text());
    const logo = parseImageUrl($item.find('img').attr('src'));

    if (id && name) {
      events.push({
        id,
        name,
        status: 'completed', // Default, actual status would need separate fetch
        dates: dates || undefined,
        logo,
      });
    }
  });

  return events;
}
