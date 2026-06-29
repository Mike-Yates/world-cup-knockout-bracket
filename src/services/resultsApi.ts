import type { MatchResult, ResultsByMatch } from '../types';

type SportsDbEvent = {
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
};

type SportsDbResponse = {
  event?: SportsDbEvent[] | null;
  events?: SportsDbEvent[] | null;
};

const normalizeName = (name: string | undefined) => name?.replace(/[^a-zA-Z0-9]+/g, ' ').trim().toLowerCase();

const toScore = (score: string | number | null | undefined) => {
  if (score === null || score === undefined || score === '') {
    return undefined;
  }

  const parsed = Number(score);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeCanadaSportsDbResult = (payload: SportsDbResponse): MatchResult | undefined => {
  const events = payload.event ?? payload.events ?? [];
  const event = events.find((candidate) => {
    const teams = [normalizeName(candidate.strHomeTeam), normalizeName(candidate.strAwayTeam)];
    return teams.includes('canada') && teams.includes('south africa');
  });

  if (!event) {
    return undefined;
  }

  const homeScore = toScore(event.intHomeScore);
  const awayScore = toScore(event.intAwayScore);
  if (homeScore === undefined || awayScore === undefined || homeScore === awayScore) {
    return undefined;
  }

  const homeTeam = normalizeName(event.strHomeTeam);
  const awayTeam = normalizeName(event.strAwayTeam);
  const winnerTeamId = homeScore > awayScore ? homeTeam : awayTeam;

  if (winnerTeamId !== 'canada' && winnerTeamId !== 'south africa') {
    return undefined;
  }

  return {
    matchId: 'r32-03',
    status: 'final',
    homeScore,
    awayScore,
    winnerTeamId: winnerTeamId === 'canada' ? 'canada' : 'south-africa',
    source: 'api',
  };
};

const fetchJson = async (url: string) => {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Result API request failed with ${response.status}`);
  }
  return response.json() as Promise<unknown>;
};

export const loadApiResults = async (): Promise<ResultsByMatch> => {
  if (typeof fetch === 'undefined') {
    return {};
  }

  const endpoints = [
    'https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=South%20Africa_vs_Canada',
    'https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=Canada_vs_South%20Africa',
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint);
      const canadaResult = normalizeCanadaSportsDbResult(payload as SportsDbResponse);
      if (canadaResult) {
        return { [canadaResult.matchId]: canadaResult };
      }
    } catch {
      // Free public sports APIs are best-effort. Local fallback data remains the source of truth if they fail.
    }
  }

  return {};
};

export const mergeResults = (fallback: ResultsByMatch, apiResults: ResultsByMatch): ResultsByMatch => ({
  ...fallback,
  ...apiResults,
});
