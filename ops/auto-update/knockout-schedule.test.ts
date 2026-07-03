import { describe, expect, it } from 'vitest';
import schedule from './knockout-schedule.json';
import { matches } from '../../src/data/bracket';

describe('auto-update knockout schedule', () => {
  it('tracks only the 31 scored bracket games and excludes the third-place game', () => {
    const matchIds = new Set(matches.map((match) => match.id));
    const scheduledMatchIds = new Set(schedule.games.map((game) => game.matchId));
    const scheduledEspnIds = new Set(schedule.games.map((game) => game.espnEventId));

    expect(schedule.games).toHaveLength(31);
    expect(scheduledMatchIds).toEqual(matchIds);
    expect(scheduledEspnIds.has('760516')).toBe(false);
  });
});
