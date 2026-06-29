import { describe, expect, it } from 'vitest';
import { normalizeCanadaSportsDbResult, normalizeEspnResult, normalizeSportsDbResult, resolveMatchTeamIds } from './resultsApi';

describe('results API normalization', () => {
  it('normalizes a Canada 1-0 result from a public API shape', () => {
    const result = normalizeCanadaSportsDbResult({
      event: [
        {
          strHomeTeam: 'Canada',
          strAwayTeam: 'South Africa',
          intHomeScore: '1',
          intAwayScore: '0',
          strStatus: 'FT',
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
            strStatus: 'FT',
          },
        ],
      });

    expect(result?.winnerTeamId).toBe('canada');
    expect(result?.homeScore).toBe(0);
    expect(result?.awayScore).toBe(1);
  });

  it('normalizes any round of 32 fixture', () => {
    const result = normalizeSportsDbResult(
      {
        event: [
          {
            strHomeTeam: 'Brazil',
            strAwayTeam: 'Japan',
            intHomeScore: '2',
            intAwayScore: '1',
            intRound: '32',
            strLeague: 'FIFA World Cup',
            strSeason: '2026',
            strStatus: 'FT',
          },
        ],
      },
      'r32-09',
    );

    expect(result).toEqual({
      matchId: 'r32-09',
      status: 'final',
      homeScore: 2,
      awayScore: 1,
      winnerTeamId: 'brazil',
      source: 'api',
    });
  });

  it('normalizes ESPN penalty winners from the advancing team flag', () => {
    const result = normalizeEspnResult(
      {
        events: [
          {
            season: { year: 2026 },
            competitions: [
              {
                status: {
                  type: {
                    completed: true,
                    state: 'post',
                    name: 'STATUS_FINAL_PEN',
                    detail: 'FT-Pens',
                  },
                },
                competitors: [
                  {
                    homeAway: 'home',
                    score: '1',
                    winner: false,
                    advance: false,
                    team: { displayName: 'Germany' },
                  },
                  {
                    homeAway: 'away',
                    score: '1',
                    winner: true,
                    advance: true,
                    team: { displayName: 'Paraguay' },
                  },
                ],
              },
            ],
          },
        ],
      },
      'r32-01',
    );

    expect(result).toEqual({
      matchId: 'r32-01',
      status: 'final',
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: 'paraguay',
      source: 'api',
    });
  });

  it('ignores non-World Cup matches for the same teams', () => {
    const result = normalizeSportsDbResult(
      {
        event: [
          {
            strHomeTeam: 'Japan',
            strAwayTeam: 'Brazil',
            intHomeScore: '3',
            intAwayScore: '2',
            intRound: '1',
            strLeague: 'International Friendlies',
            strSeason: '2025',
            strStatus: 'FT',
          },
        ],
      },
      'r32-09',
    );

    expect(result).toBeUndefined();
  });

  it('does not normalize unfinished matches', () => {
    const result = normalizeSportsDbResult(
      {
        event: [
          {
            strHomeTeam: 'Brazil',
            strAwayTeam: 'Japan',
            intHomeScore: '2',
            intAwayScore: '1',
            intRound: '32',
            strLeague: 'FIFA World Cup',
            strSeason: '2026',
            strStatus: 'Live',
          },
        ],
      },
      'r32-09',
    );

    expect(result).toBeUndefined();
  });

  it('resolves later-round teams from completed source matches', () => {
    expect(
      resolveMatchTeamIds('r16-05', {
        'r32-09': {
          matchId: 'r32-09',
          status: 'final',
          homeScore: 2,
          awayScore: 1,
          winnerTeamId: 'brazil',
          source: 'test',
        },
        'r32-10': {
          matchId: 'r32-10',
          status: 'final',
          homeScore: 0,
          awayScore: 1,
          winnerTeamId: 'norway',
          source: 'test',
        },
      }),
    ).toEqual(['brazil', 'norway']);
  });

  it('normalizes later-round fixtures once both teams are known', () => {
    const result = normalizeSportsDbResult(
      {
        event: [
          {
            strHomeTeam: 'Brazil',
            strAwayTeam: 'Norway',
            intHomeScore: '3',
            intAwayScore: '0',
            intRound: '16',
            strLeague: 'FIFA World Cup',
            strSeason: '2026',
            strStatus: 'FT',
          },
        ],
      },
      'r16-05',
      ['brazil', 'norway'],
    );

    expect(result?.winnerTeamId).toBe('brazil');
    expect(result?.matchId).toBe('r16-05');
  });
});
