import { describe, expect, it } from 'vitest';
import type { MatchId, Participant, ResultsByMatch, TeamId } from '../types';
import { calculatePredictionChances, eloWinProbability } from './probabilities';
import type { TeamEloRating } from './teamElo';

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

describe('prediction probabilities', () => {
  it('gives no chance to a participant who cannot catch an identical remaining bracket', () => {
    const leader = participant('leader', 'Leader');
    const behind = participant('behind', 'Behind', { round16: ['germany', ...round16Winners.slice(1)] });

    const prediction = calculatePredictionChances([behind, leader], completedThroughSemifinals());

    expect(prediction.scenarioCount).toBe(2);
    expect(prediction.chances.find((chance) => chance.participant.id === 'leader')?.equalProbability).toBe(1);
    expect(prediction.chances.find((chance) => chance.participant.id === 'behind')?.equalProbability).toBe(0);
  });

  it('splits 50/50 final scenarios equally and weights ELO scenarios by rating difference', () => {
    const francePick = participant('france', 'France Pick');
    const brazilPick = participant('brazil', 'Brazil Pick', { winner: ['brazil'] });
    const ratings: Record<TeamId, TeamEloRating> = {
      france: { rating: 2000, sourceCode: 'FR' },
      brazil: { rating: 1600, sourceCode: 'BR' },
    };

    const prediction = calculatePredictionChances([francePick, brazilPick], completedThroughSemifinals(), ratings);
    const franceChance = prediction.chances.find((chance) => chance.participant.id === 'france');
    const brazilChance = prediction.chances.find((chance) => chance.participant.id === 'brazil');

    expect(franceChance?.equalProbability).toBe(0.5);
    expect(brazilChance?.equalProbability).toBe(0.5);
    expect(franceChance?.eloProbability).toBeCloseTo(eloWinProbability(2000, 1600));
    expect(brazilChance?.eloProbability).toBeCloseTo(1 - eloWinProbability(2000, 1600));
  });
});
