import { describe, expect, it } from 'vitest';
import { getFlagImageUrl, getTeam } from './teams';

describe('team flag images', () => {
  it('builds regular country flag image URLs', () => {
    expect(getFlagImageUrl(getTeam('germany').countryCode)).toBe('https://flagcdn.com/de.svg');
    expect(getFlagImageUrl(getTeam('paraguay').countryCode)).toBe('https://flagcdn.com/py.svg');
  });

  it('builds the England flag image URL', () => {
    expect(getFlagImageUrl(getTeam('england').countryCode)).toBe('https://flagcdn.com/gb-eng.svg');
  });
});
