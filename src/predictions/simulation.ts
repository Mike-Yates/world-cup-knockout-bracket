import knockoutSchedule from '../../ops/auto-update/knockout-schedule.json';
import { resolveMatchTeamIds } from '../services/resultsApi';
import type { MatchId, MatchResult, ResultsByMatch, TeamId } from '../types';

type ScheduledGame = {
  gameNumber: number;
  matchId: MatchId;
  scheduledStartUtc: string;
  label: string;
};

export type SimulationMatch = ScheduledGame & {
  teamIds: [TeamId, TeamId];
};

const scheduledGames = knockoutSchedule.games as ScheduledGame[];

export const getNextSimulationMatch = (results: ResultsByMatch): SimulationMatch | undefined => {
  for (const game of scheduledGames) {
    if (results[game.matchId]) {
      continue;
    }

    const teamIds = resolveMatchTeamIds(game.matchId, results);
    if (teamIds) {
      return { ...game, teamIds };
    }
  }

  return undefined;
};

export const makeSimulationResult = (match: SimulationMatch, winnerTeamId: TeamId): MatchResult => ({
  matchId: match.matchId,
  status: 'final',
  homeScore: winnerTeamId === match.teamIds[0] ? 1 : 0,
  awayScore: winnerTeamId === match.teamIds[1] ? 1 : 0,
  winnerTeamId,
  source: 'test',
});
