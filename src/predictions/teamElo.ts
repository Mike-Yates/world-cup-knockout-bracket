import type { TeamId } from '../types';

export type TeamEloRating = {
  rating: number;
  sourceCode: string;
};

export const teamEloSourceUrl = 'https://www.eloratings.net/World.tsv';

export const teamEloFetchedAt = '2026-07-04T16:08:47.598Z';

export const currentTeamElo: Record<TeamId, TeamEloRating> = {
  'germany': { rating: 1908, sourceCode: 'DE' },
  'paraguay': { rating: 1823, sourceCode: 'PY' },
  'france': { rating: 2134, sourceCode: 'FR' },
  'sweden': { rating: 1731, sourceCode: 'SE' },
  'south-africa': { rating: 1559, sourceCode: 'ZA' },
  'canada': { rating: 1764, sourceCode: 'CA' },
  'netherlands': { rating: 1971, sourceCode: 'NL' },
  'morocco': { rating: 1886, sourceCode: 'MA' },
  'portugal': { rating: 2013, sourceCode: 'PT' },
  'croatia': { rating: 1882, sourceCode: 'HR' },
  'spain': { rating: 2159, sourceCode: 'ES' },
  'austria': { rating: 1821, sourceCode: 'AT' },
  'united-states': { rating: 1798, sourceCode: 'US' },
  'bosnia-and-herzegovina': { rating: 1605, sourceCode: 'BA' },
  'belgium': { rating: 1910, sourceCode: 'BE' },
  'senegal': { rating: 1816, sourceCode: 'SN' },
  'brazil': { rating: 2031, sourceCode: 'BR' },
  'japan': { rating: 1888, sourceCode: 'JP' },
  'ivory-coast': { rating: 1727, sourceCode: 'CI' },
  'norway': { rating: 1934, sourceCode: 'NO' },
  'mexico': { rating: 1943, sourceCode: 'MX' },
  'ecuador': { rating: 1871, sourceCode: 'EC' },
  'england': { rating: 2046, sourceCode: 'EN' },
  'dr-congo': { rating: 1704, sourceCode: 'CD' },
  'argentina': { rating: 2151, sourceCode: 'AR' },
  'cape-verde': { rating: 1619, sourceCode: 'CV' },
  'australia': { rating: 1795, sourceCode: 'AU' },
  'egypt': { rating: 1747, sourceCode: 'EG' },
  'switzerland': { rating: 1943, sourceCode: 'CH' },
  'algeria': { rating: 1756, sourceCode: 'DZ' },
  'colombia': { rating: 2009, sourceCode: 'CO' },
  'ghana': { rating: 1570, sourceCode: 'GH' },
};
