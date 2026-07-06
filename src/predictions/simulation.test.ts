import { describe, expect, it } from 'vitest';
import type { MatchId, ResultsByMatch, TeamId } from '../types';
import { getNextSimulationMatch, makeSimulationResult } from './simulation';

const result = (matchId: MatchId, winnerTeamId: TeamId) => ({
  matchId,
  status: 'final' as const,
  homeScore: 1,
  awayScore: 0,
  winnerTeamId,
  source: 'test' as const,
});

const completedThroughScheduleGame21 = (): ResultsByMatch => ({
  'r32-03': result('r32-03', 'canada'),
  'r32-09': result('r32-09', 'brazil'),
  'r32-01': result('r32-01', 'paraguay'),
  'r32-04': result('r32-04', 'morocco'),
  'r32-10': result('r32-10', 'norway'),
  'r32-02': result('r32-02', 'france'),
  'r32-11': result('r32-11', 'mexico'),
  'r32-12': result('r32-12', 'england'),
  'r32-08': result('r32-08', 'belgium'),
  'r32-07': result('r32-07', 'united-states'),
  'r32-06': result('r32-06', 'spain'),
  'r32-05': result('r32-05', 'portugal'),
  'r32-15': result('r32-15', 'switzerland'),
  'r32-14': result('r32-14', 'egypt'),
  'r32-13': result('r32-13', 'argentina'),
  'r32-16': result('r32-16', 'colombia'),
  'r16-02': result('r16-02', 'morocco'),
  'r16-01': result('r16-01', 'france'),
  'r16-05': result('r16-05', 'norway'),
  'r16-06': result('r16-06', 'england'),
  'r16-03': result('r16-03', 'spain'),
});

describe('prediction simulation', () => {
  it('finds the next scheduled unresolved match and resolves its teams', () => {
    const match = getNextSimulationMatch(completedThroughScheduleGame21());

    expect(match?.matchId).toBe('r16-04');
    expect(match?.teamIds).toEqual(['united-states', 'belgium']);
  });

  it('creates a one-match simulated result for the selected winner', () => {
    const match = getNextSimulationMatch(completedThroughScheduleGame21());

    expect(match && makeSimulationResult(match, 'belgium')).toMatchObject({
      matchId: 'r16-04',
      winnerTeamId: 'belgium',
      homeScore: 0,
      awayScore: 1,
      source: 'test',
    });
  });
});
