import type { TeamId } from '../types';

export type TeamEloRating = {
  rating: number;
  sourceCode: string;
};

export const teamEloSourceUrl = 'https://www.eloratings.net/World.tsv';

export const teamEloFetchedAt = '2026-07-09T22:09:12.176Z';

export const currentTeamElo: Record<TeamId, TeamEloRating> = {
  'germany': { rating: 1907, sourceCode: 'DE' },
  'paraguay': { rating: 1814, sourceCode: 'PY' },
  'france': { rating: 2143, sourceCode: 'FR' },
  'sweden': { rating: 1731, sourceCode: 'SE' },
  'south-africa': { rating: 1560, sourceCode: 'ZA' },
  'canada': { rating: 1729, sourceCode: 'CA' },
  'netherlands': { rating: 1971, sourceCode: 'NL' },
  'morocco': { rating: 1921, sourceCode: 'MA' },
  'portugal': { rating: 1995, sourceCode: 'PT' },
  'croatia': { rating: 1881, sourceCode: 'HR' },
  'spain': { rating: 2177, sourceCode: 'ES' },
  'austria': { rating: 1821, sourceCode: 'AT' },
  'united-states': { rating: 1747, sourceCode: 'US' },
  'bosnia-and-herzegovina': { rating: 1605, sourceCode: 'BA' },
  'belgium': { rating: 1961, sourceCode: 'BE' },
  'senegal': { rating: 1816, sourceCode: 'SN' },
  'brazil': { rating: 1993, sourceCode: 'BR' },
  'japan': { rating: 1888, sourceCode: 'JP' },
  'ivory-coast': { rating: 1727, sourceCode: 'CI' },
  'norway': { rating: 1972, sourceCode: 'NO' },
  'mexico': { rating: 1913, sourceCode: 'MX' },
  'ecuador': { rating: 1871, sourceCode: 'EC' },
  'england': { rating: 2076, sourceCode: 'EN' },
  'dr-congo': { rating: 1704, sourceCode: 'CD' },
  'argentina': { rating: 2156, sourceCode: 'AR' },
  'cape-verde': { rating: 1619, sourceCode: 'CV' },
  'australia': { rating: 1795, sourceCode: 'AU' },
  'egypt': { rating: 1742, sourceCode: 'EG' },
  'switzerland': { rating: 1949, sourceCode: 'CH' },
  'algeria': { rating: 1756, sourceCode: 'DZ' },
  'colombia': { rating: 2003, sourceCode: 'CO' },
  'ghana': { rating: 1570, sourceCode: 'GH' },
};
