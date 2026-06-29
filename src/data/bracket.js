export const pickRoundConfigs = [
    { key: 'round32', label: 'Round of 32', expectedCount: 32 },
    { key: 'round16', label: 'Round of 16', expectedCount: 16 },
    { key: 'round8', label: 'Quarterfinals', expectedCount: 8 },
    { key: 'round4', label: 'Semifinals', expectedCount: 4 },
    { key: 'round2', label: 'Final', expectedCount: 2 },
    { key: 'winner', label: 'Champion', expectedCount: 1 },
];
export const sectionHeaders = {
    'round of 32': 'round32',
    'round of 16': 'round16',
    'round of 8': 'round8',
    'round of 4': 'round4',
    'round of 2': 'round2',
    winner: 'winner',
};
export const initialTeamIds = [
    'germany',
    'paraguay',
    'france',
    'sweden',
    'south-africa',
    'canada',
    'netherlands',
    'morocco',
    'portugal',
    'croatia',
    'spain',
    'austria',
    'united-states',
    'bosnia-and-herzegovina',
    'belgium',
    'senegal',
    'brazil',
    'japan',
    'ivory-coast',
    'norway',
    'mexico',
    'ecuador',
    'england',
    'dr-congo',
    'argentina',
    'cape-verde',
    'australia',
    'egypt',
    'switzerland',
    'algeria',
    'colombia',
    'ghana',
];
const formatMatchId = (prefix, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`;
const makeRound32Matches = () => Array.from({ length: 16 }, (_, index) => ({
    id: formatMatchId('r32', index),
    round: 'round32',
    label: `Round of 32 Match ${index + 1}`,
    order: index,
    side: index < 8 ? 'left' : 'right',
    teamIds: [initialTeamIds[index * 2], initialTeamIds[index * 2 + 1]],
}));
const makeDerivedMatches = (prefix, round, sourceIds, label) => Array.from({ length: sourceIds.length / 2 }, (_, index) => ({
    id: formatMatchId(prefix, index),
    round,
    label: `${label} Match ${index + 1}`,
    order: index,
    side: sourceIds[index * 2].startsWith('r32-0') || index < sourceIds.length / 4 ? 'left' : 'right',
    sourceMatchIds: [sourceIds[index * 2], sourceIds[index * 2 + 1]],
}));
const round32Matches = makeRound32Matches();
const round16Matches = makeDerivedMatches('r16', 'round16', round32Matches.map((match) => match.id), 'Round of 16');
const quarterfinalMatches = makeDerivedMatches('qf', 'quarterfinal', round16Matches.map((match) => match.id), 'Quarterfinal');
const semifinalMatches = makeDerivedMatches('sf', 'semifinal', quarterfinalMatches.map((match) => match.id), 'Semifinal');
export const finalMatch = {
    id: 'final',
    round: 'final',
    label: 'World Cup Final',
    order: 0,
    side: 'center',
    sourceMatchIds: [semifinalMatches[0].id, semifinalMatches[1].id],
};
export const matches = [...round32Matches, ...round16Matches, ...quarterfinalMatches, ...semifinalMatches, finalMatch];
export const matchesById = Object.fromEntries(matches.map((match) => [match.id, match]));
export const matchIdsByRound = {
    round32: round32Matches.map((match) => match.id),
    round16: round16Matches.map((match) => match.id),
    quarterfinal: quarterfinalMatches.map((match) => match.id),
    semifinal: semifinalMatches.map((match) => match.id),
    final: [finalMatch.id],
};
export const scoringRounds = [
    { matchRound: 'round32', pickRound: 'round16', points: 1, matchIds: matchIdsByRound.round32 },
    { matchRound: 'round16', pickRound: 'round8', points: 2, matchIds: matchIdsByRound.round16 },
    { matchRound: 'quarterfinal', pickRound: 'round4', points: 3, matchIds: matchIdsByRound.quarterfinal },
    { matchRound: 'semifinal', pickRound: 'round2', points: 4, matchIds: matchIdsByRound.semifinal },
    { matchRound: 'final', pickRound: 'winner', points: 5, matchIds: matchIdsByRound.final },
];
