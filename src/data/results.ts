import type { ResultsByMatch } from '../types';

export const fallbackResults: ResultsByMatch = {
  'r32-01': {
    matchId: 'r32-01',
    status: 'final',
    homeScore: 1,
    awayScore: 1,
    winnerTeamId: 'paraguay',
    source: 'api',
  },
  'r32-03': {
    matchId: 'r32-03',
    status: 'final',
    homeScore: 0,
    awayScore: 1,
    winnerTeamId: 'canada',
    source: 'manual',
  },
  'r32-09': {
    matchId: 'r32-09',
    status: 'final',
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: 'brazil',
    source: 'manual',
  },
};
