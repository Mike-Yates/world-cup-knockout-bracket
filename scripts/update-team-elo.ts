import { writeFileSync } from 'node:fs';
import { formatTeamEloFile, loadTeamEloSnapshot } from '../src/predictions/eloApi';

const snapshot = await loadTeamEloSnapshot();

writeFileSync(new URL('../src/predictions/teamElo.ts', import.meta.url), formatTeamEloFile(snapshot));

console.log(`Cached World Elo ratings for ${Object.keys(snapshot.ratings).length} teams from ${snapshot.sourceUrl}.`);
