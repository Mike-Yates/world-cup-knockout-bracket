import { describe, expect, it } from 'vitest';
import type { MatchId, Participant, ResultsByMatch, TeamId } from '../types';
import { calculateWinningScenarios } from './winningScenarios';

const round16Winners: TeamId[] = [
  'paraguay',
  'france',
  'canada',
  'morocco',
  'portugal',
  'spain',
  'united-states',
  'belgium',
  'brazil',
  'norway',
  'mexico',
  'england',
  'argentina',
  'egypt',
  'switzerland',
  'colombia',
];

const round8Winners: TeamId[] = ['france', 'morocco', 'spain', 'belgium', 'brazil', 'england', 'argentina', 'switzerland'];
const round4Winners: TeamId[] = ['france', 'spain', 'brazil', 'argentina'];
const round2Winners: TeamId[] = ['france', 'brazil'];

const basePicks = {
  round32: [
    'germany',
    'paraguay',
    'france',
    'sweden',
    'south-africa',
    'canada',
    'netherlands',
    'morocco',
    'portugal',
    'croatia',
    'spain',
    'austria',
    'united-states',
    'bosnia-and-herzegovina',
    'belgium',
    'senegal',
    'brazil',
    'japan',
    'ivory-coast',
    'norway',
    'mexico',
    'ecuador',
    'england',
    'dr-congo',
    'argentina',
    'cape-verde',
    'australia',
    'egypt',
    'switzerland',
    'algeria',
    'colombia',
    'ghana',
  ],
  round16: round16Winners,
  round8: round8Winners,
  round4: round4Winners,
  round2: round2Winners,
  winner: ['france'],
};

const participant = (id: string, displayName: string, overrides: Partial<Participant['picks']> = {}): Participant => ({
  id,
  displayName,
  picks: {
    ...basePicks,
    ...overrides,
  },
});

const result = (matchId: MatchId, winnerTeamId: TeamId) => ({
  matchId,
  status: 'final' as const,
  homeScore: 1,
  awayScore: 0,
  winnerTeamId,
  source: 'test' as const,
});

const completedThroughSemifinals = (): ResultsByMatch => ({
  ...Object.fromEntries(
    round16Winners.map((winnerTeamId, index) => {
      const matchId = `r32-${String(index + 1).padStart(2, '0')}` as MatchId;
      return [matchId, result(matchId, winnerTeamId)];
    }),
  ),
  ...Object.fromEntries(
    round8Winners.map((winnerTeamId, index) => {
      const matchId = `r16-${String(index + 1).padStart(2, '0')}` as MatchId;
      return [matchId, result(matchId, winnerTeamId)];
    }),
  ),
  ...Object.fromEntries(
    round4Winners.map((winnerTeamId, index) => {
      const matchId = `qf-${String(index + 1).padStart(2, '0')}` as MatchId;
      return [matchId, result(matchId, winnerTeamId)];
    }),
  ),
  ...Object.fromEntries(
    round2Winners.map((winnerTeamId, index) => {
      const matchId = `sf-${String(index + 1).padStart(2, '0')}` as MatchId;
      return [matchId, result(matchId, winnerTeamId)];
    }),
  ),
});

describe('winning scenarios', () => {
  it('records one bracket path per first-place outcome', () => {
    const francePick = participant('france', 'France Pick');
    const brazilPick = participant('brazil', 'Brazil Pick', { winner: ['brazil'] });
    const scenarios = calculateWinningScenarios([francePick, brazilPick], completedThroughSemifinals());

    expect(scenarios.france).toHaveLength(1);
    expect(scenarios.brazil).toHaveLength(1);
    expect(scenarios.france[0].participant.picks.winner).toEqual(['france']);
    expect(scenarios.brazil[0].participant.picks.winner).toEqual(['brazil']);
    expect(scenarios.france[0].score.evaluations).toEqual([]);
  });
});
