import { describe, expect, it } from 'vitest';
import { normalizeCanadaSportsDbResult } from './resultsApi';

describe('results API normalization', () => {
  it('normalizes a Canada 1-0 result from a public API shape', () => {
    const result = normalizeCanadaSportsDbResult({
      event: [
        {
          strHomeTeam: 'Canada',
          strAwayTeam: 'South Africa',
          intHomeScore: '1',
          intAwayScore: '0',
        },
      ],
    });

    expect(result).toEqual({
      matchId: 'r32-03',
      status: 'final',
      homeScore: 1,
      awayScore: 0,
      winnerTeamId: 'canada',
      source: 'api',
    });
  });

  it('normalizes the reversed home/away order', () => {
    const result = normalizeCanadaSportsDbResult({
      events: [
        {
          strHomeTeam: 'South Africa',
          strAwayTeam: 'Canada',
          intHomeScore: 0,
          intAwayScore: 1,
        },
      ],
    });

    expect(result?.winnerTeamId).toBe('canada');
    expect(result?.homeScore).toBe(0);
    expect(result?.awayScore).toBe(1);
  });
});
