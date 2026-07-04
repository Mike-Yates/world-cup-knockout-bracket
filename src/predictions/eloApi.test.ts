import { describe, expect, it } from 'vitest';
import { buildTeamEloSnapshot, parseWorldEloTsv } from './eloApi';

describe('World Elo API parsing', () => {
  it('parses current ratings by source country code', () => {
    const ratings = parseWorldEloTsv('1\t1\tFR\t2134\n2\t2\tBR\t2031\n');

    expect(ratings.get('FR')).toBe(2134);
    expect(ratings.get('BR')).toBe(2031);
  });

  it('fails fast when the snapshot is missing a tournament team', () => {
    expect(() => buildTeamEloSnapshot('1\t1\tFR\t2134\n')).toThrow(/Missing World Elo rating/);
  });
});
