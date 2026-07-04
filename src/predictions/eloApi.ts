import { teams } from '../data/teams';
import type { TeamId } from '../types';
import type { TeamEloRating } from './teamElo';

export const worldEloTsvUrl = 'https://www.eloratings.net/World.tsv';

export const eloCountryCodesByTeamId: Record<TeamId, string> = {
  germany: 'DE',
  paraguay: 'PY',
  france: 'FR',
  sweden: 'SE',
  'south-africa': 'ZA',
  canada: 'CA',
  netherlands: 'NL',
  morocco: 'MA',
  portugal: 'PT',
  croatia: 'HR',
  spain: 'ES',
  austria: 'AT',
  'united-states': 'US',
  'bosnia-and-herzegovina': 'BA',
  belgium: 'BE',
  senegal: 'SN',
  brazil: 'BR',
  japan: 'JP',
  'ivory-coast': 'CI',
  norway: 'NO',
  mexico: 'MX',
  ecuador: 'EC',
  england: 'EN',
  'dr-congo': 'CD',
  argentina: 'AR',
  'cape-verde': 'CV',
  australia: 'AU',
  egypt: 'EG',
  switzerland: 'CH',
  algeria: 'DZ',
  colombia: 'CO',
  ghana: 'GH',
};

export type TeamEloSnapshot = {
  fetchedAtIso: string;
  sourceUrl: string;
  ratings: Record<TeamId, TeamEloRating>;
};

export const parseWorldEloTsv = (text: string) => {
  const ratingsByCode = new Map<string, number>();

  text
    .trim()
    .split('\n')
    .forEach((line) => {
      const columns = line.split('\t');
      const code = columns[2];
      const rating = Number(columns[3]);
      if (code && Number.isFinite(rating)) {
        ratingsByCode.set(code, rating);
      }
    });

  return ratingsByCode;
};

export const buildTeamEloSnapshot = (text: string, fetchedAtIso = new Date().toISOString()): TeamEloSnapshot => {
  const ratingsByCode = parseWorldEloTsv(text);
  const ratings: Record<TeamId, TeamEloRating> = {};

  for (const team of teams) {
    const sourceCode = eloCountryCodesByTeamId[team.id];
    const rating = ratingsByCode.get(sourceCode);
    if (!sourceCode || rating === undefined) {
      throw new Error(`Missing World Elo rating for ${team.id} (${team.name})`);
    }

    ratings[team.id] = { rating, sourceCode };
  }

  return {
    fetchedAtIso,
    sourceUrl: worldEloTsvUrl,
    ratings,
  };
};

export const loadTeamEloSnapshot = async (fetchedAtIso = new Date().toISOString()): Promise<TeamEloSnapshot> => {
  const response = await fetch(worldEloTsvUrl, { headers: { accept: 'text/tab-separated-values,text/plain' } });
  if (!response.ok) {
    throw new Error(`World Elo request failed with ${response.status}`);
  }

  return buildTeamEloSnapshot(await response.text(), fetchedAtIso);
};

const quote = (value: string) => `'${value.replace(/'/g, "\\'")}'`;

export const formatTeamEloFile = (snapshot: TeamEloSnapshot) => {
  const entries = teams
    .map((team) => {
      const rating = snapshot.ratings[team.id];
      if (!rating) {
        throw new Error(`Missing formatted World Elo rating for ${team.id}`);
      }

      return `  ${quote(team.id)}: { rating: ${rating.rating}, sourceCode: ${quote(rating.sourceCode)} },`;
    })
    .join('\n');

  return `import type { TeamId } from '../types';

export type TeamEloRating = {
  rating: number;
  sourceCode: string;
};

export const teamEloSourceUrl = ${quote(snapshot.sourceUrl)};

export const teamEloFetchedAt = ${quote(snapshot.fetchedAtIso)};

export const currentTeamElo: Record<TeamId, TeamEloRating> = {
${entries}
};
`;
};
