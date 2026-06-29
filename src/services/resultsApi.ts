import type { Match, MatchResult, ResultsByMatch, TeamId } from '../types';
import { matches, matchesById } from '../data/bracket';
import { getTeam, getTeamIdByName } from '../data/teams';
import type { MatchId } from '../types';

type SportsDbEvent = {
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  intRound?: string | number | null;
  strLeague?: string;
  strSeason?: string;
  strStatus?: string;
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

const finalStatuses = new Set(['ft', 'aet', 'pen', 'pens', 'after penalties', 'match finished']);

const expectedSportsDbRounds: Record<Match['round'], string[]> = {
  round32: ['32'],
  round16: ['16'],
  quarterfinal: ['8', 'quarter final', 'quarter finals', 'quarterfinal', 'quarterfinals'],
  semifinal: ['4', 'semi final', 'semi finals', 'semifinal', 'semifinals'],
  final: ['2', 'final'],
};

const normalizeRound = (round: string | number | null | undefined) => normalizeName(String(round ?? ''));

const isFinalStatus = (status: string | undefined) => finalStatuses.has(normalizeName(status) ?? '');

const isExpectedRound = (event: SportsDbEvent, match: Match) => {
  if (event.intRound === undefined || event.intRound === null) {
    return true;
  }

  return expectedSportsDbRounds[match.round].includes(normalizeRound(event.intRound) ?? '');
};

const isWorldCupEvent = (event: SportsDbEvent, match: Match) => {
  if (event.strLeague && normalizeName(event.strLeague) !== 'fifa world cup') {
    return false;
  }

  if (event.strSeason && event.strSeason !== '2026') {
    return false;
  }

  if (!isFinalStatus(event.strStatus)) {
    return false;
  }

  return isExpectedRound(event, match);
};

export const resolveMatchTeamIds = (matchId: MatchId, results: ResultsByMatch): [TeamId, TeamId] | undefined => {
  const match = matchesById[matchId];
  if (!match) {
    return undefined;
  }

  if (match.teamIds) {
    return match.teamIds;
  }

  const winners = match.sourceMatchIds?.map((sourceMatchId) => results[sourceMatchId]?.winnerTeamId);
  if (winners?.length === 2 && winners[0] && winners[1]) {
    return [winners[0], winners[1]];
  }

  return undefined;
};

export const normalizeSportsDbResult = (payload: SportsDbResponse, matchId: MatchId, teamIds = resolveMatchTeamIds(matchId, {})): MatchResult | undefined => {
  const match = matchesById[matchId];
  if (!match || !teamIds) {
    return undefined;
  }

  const events = payload.event ?? payload.events ?? [];
  const event = events.find((candidate) => {
    const candidateTeamIds = [getTeamIdByName(candidate.strHomeTeam ?? ''), getTeamIdByName(candidate.strAwayTeam ?? '')];
    return isWorldCupEvent(candidate, match) && teamIds.every((teamId) => candidateTeamIds.includes(teamId));
  });

  if (!event) {
    return undefined;
  }

  const homeScore = toScore(event.intHomeScore);
  const awayScore = toScore(event.intAwayScore);
  if (homeScore === undefined || awayScore === undefined || homeScore === awayScore) {
    return undefined;
  }

  const homeTeam = getTeamIdByName(event.strHomeTeam ?? '');
  const awayTeam = getTeamIdByName(event.strAwayTeam ?? '');
  const winnerTeamId = homeScore > awayScore ? homeTeam : awayTeam;

  if (!winnerTeamId || !teamIds.includes(winnerTeamId)) {
    return undefined;
  }

  return {
    matchId,
    status: 'final',
    homeScore,
    awayScore,
    winnerTeamId,
    source: 'api',
  };
};

export const normalizeCanadaSportsDbResult = (payload: SportsDbResponse): MatchResult | undefined => normalizeSportsDbResult(payload, 'r32-03');

const fetchJson = async (url: string) => {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Result API request failed with ${response.status}`);
  }
  return response.json() as Promise<unknown>;
};

const loadMatchResult = async (matchId: MatchId, teamIds: [TeamId, TeamId]) => {
  const [homeTeam, awayTeam] = teamIds.map((teamId) => getTeam(teamId));
  const endpoints = [
    `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(`${homeTeam.name}_vs_${awayTeam.name}`)}`,
    `https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(`${awayTeam.name}_vs_${homeTeam.name}`)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const payload = await fetchJson(endpoint);
      const result = normalizeSportsDbResult(payload as SportsDbResponse, matchId, teamIds);
      if (result) {
        return result;
      }
    } catch {
      // Free public sports APIs are best-effort. Local fallback data remains the source of truth if they fail.
    }
  }

  return undefined;
};

export const loadApiResults = async (knownResults: ResultsByMatch = {}): Promise<ResultsByMatch> => {
  if (typeof fetch === 'undefined') {
    return {};
  }

  const loadedResults: ResultsByMatch = {};

  for (const match of matches) {
    if (knownResults[match.id] || loadedResults[match.id]) {
      continue;
    }

    const teamIds = resolveMatchTeamIds(match.id, { ...knownResults, ...loadedResults });
    if (!teamIds) {
      continue;
    }

    const result = await loadMatchResult(match.id, teamIds);
    if (result) {
      loadedResults[result.matchId] = result;
    }
  }

  return loadedResults;
};

export const mergeResults = (fallback: ResultsByMatch, apiResults: ResultsByMatch): ResultsByMatch => ({
  ...fallback,
  ...apiResults,
});
