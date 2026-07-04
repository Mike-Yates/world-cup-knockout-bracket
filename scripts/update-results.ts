import { writeFileSync } from 'node:fs';
import { matches } from '../src/data/bracket';
import { fallbackResults } from '../src/data/results';
import { formatTeamEloFile, loadTeamEloSnapshot } from '../src/predictions/eloApi';
import { loadApiResults, mergeResults } from '../src/services/resultsApi';
import type { MatchResult, ResultsByMatch } from '../src/types';

const quote = (value: string) => `'${value.replace(/'/g, "\\'")}'`;

const formatResult = (result: MatchResult) => `  ${quote(result.matchId)}: {
    matchId: ${quote(result.matchId)},
    status: 'final',
    homeScore: ${result.homeScore},
    awayScore: ${result.awayScore},
    winnerTeamId: ${quote(result.winnerTeamId)},
    source: ${quote(result.source)},
  },`;

const formatResultsFile = (results: ResultsByMatch) => {
  const resultEntries = matches
    .map((match) => results[match.id])
    .filter((result): result is MatchResult => Boolean(result))
    .map(formatResult)
    .join('\n');

  return `import type { ResultsByMatch } from '../types';

export const fallbackResults: ResultsByMatch = {
${resultEntries}
};
`;
};

const apiResults = await loadApiResults(fallbackResults);
const results = mergeResults(fallbackResults, apiResults);

writeFileSync(new URL('../src/data/results.ts', import.meta.url), formatResultsFile(results));

const addedCount = matches.filter((match) => apiResults[match.id] && !fallbackResults[match.id]).length;
const totalCount = matches.filter((match) => results[match.id]).length;

if (addedCount > 0) {
  const snapshot = await loadTeamEloSnapshot();
  writeFileSync(new URL('../src/predictions/teamElo.ts', import.meta.url), formatTeamEloFile(snapshot));
  console.log(`Cached World Elo ratings for ${Object.keys(snapshot.ratings).length} teams from ${snapshot.sourceUrl}.`);
}

console.log(`Cached ${totalCount} final result(s). Added ${addedCount} new result(s) from the API.`);
