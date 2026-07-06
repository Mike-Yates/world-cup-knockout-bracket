import { describe, expect, it } from 'vitest';
import type { ResultsByMatch } from '../types';
import { parseParticipantFile } from './participants';
import { evaluateParticipant, rankParticipants } from './scoring';

const canadaResults: ResultsByMatch = {
  'r32-03': {
    matchId: 'r32-03',
    status: 'final',
    homeScore: 0,
    awayScore: 1,
    winnerTeamId: 'canada',
    source: 'test',
  },
};

const brazilLostToNorwayResults: ResultsByMatch = {
  'r32-09': {
    matchId: 'r32-09',
    status: 'final',
    homeScore: 2,
    awayScore: 1,
    winnerTeamId: 'brazil',
    source: 'test',
  },
  'r32-10': {
    matchId: 'r32-10',
    status: 'final',
    homeScore: 1,
    awayScore: 2,
    winnerTeamId: 'norway',
    source: 'test',
  },
  'r16-05': {
    matchId: 'r16-05',
    status: 'final',
    homeScore: 1,
    awayScore: 2,
    winnerTeamId: 'norway',
    source: 'test',
  },
};

const baseRound32 = `# Round of 32
Germany
Paraguay

France
Sweden

South Africa
Canada

Netherlands
Morocco

Portugal
Croatia

Spain
Austria

United States
Bosnia and Herz.

Belgium
Senegal

Brazil
Japan

Ivory Coast
Norway

Mexico
Ecuador

England
DR Congo

Argentina
Cape Verde

Australia
Egypt

Switzerland
Algeria

Colombia
Ghana`;

const correctCanadaPicks = `${baseRound32}

# Round of 16
Germany
France

Canada
Morocco

Portugal
Spain

United States
Belgium

Brazil
Norway

Mexico
England

Argentina
Australia

Algeria
Colombia

# Round of 8
France
Morocco

Spain
United States

Brazil
England

Argentina
Colombia

# Round of 4
France
Spain

Brazil
Colombia

# Round of 2
France
Brazil

# Winner
France`;

const wrongSouthAfricaPicks = correctCanadaPicks.replace('\nCanada\nMorocco\n', '\nSouth Africa\nMorocco\n').replace(
  '\nFrance\nMorocco\n\nSpain',
  '\nFrance\nSouth Africa\n\nSpain',
);

const brazilChampionPicks = correctCanadaPicks.replace('\n# Winner\nFrance', '\n# Winner\nBrazil');

const participantFromText = (fileName: string, text: string) => parseParticipantFile({ fileName, text });

describe('scoring', () => {
  it('scores the known Canada 1-0 result and cascades total possible points', () => {
    const mike = evaluateParticipant(participantFromText('MikeYates.txt', correctCanadaPicks), canadaResults);
    const john = evaluateParticipant(participantFromText('JohnYates.txt', wrongSouthAfricaPicks), canadaResults);

    expect(mike.currentPoints).toBe(1);
    expect(mike.totalPossible).toBe(57);
    expect(john.currentPoints).toBe(0);
    expect(john.totalPossible).toBe(54);

    expect(john.evaluations.find((evaluation) => evaluation.matchId === 'r32-03')?.status).toBe('incorrect');
    expect(john.evaluations.find((evaluation) => evaluation.matchId === 'r16-02')?.status).toBe('eliminated');
  });

  it('cascades elimination from resolved derived matches', () => {
    const score = evaluateParticipant(participantFromText('CarolineCostello.txt', brazilChampionPicks), brazilLostToNorwayResults);

    expect(score.currentPoints).toBe(2);
    expect(score.totalPossible).toBe(43);
    expect(score.evaluations.find((evaluation) => evaluation.matchId === 'r16-05')?.status).toBe('incorrect');
    expect(score.evaluations.find((evaluation) => evaluation.matchId === 'qf-03')?.status).toBe('eliminated');
    expect(score.evaluations.find((evaluation) => evaluation.matchId === 'sf-02')?.status).toBe('eliminated');
    expect(score.evaluations.find((evaluation) => evaluation.matchId === 'final')?.status).toBe('eliminated');
  });

  it('ranks by points, then total possible, then name', () => {
    const ranked = rankParticipants(
      [participantFromText('JohnYates.txt', wrongSouthAfricaPicks), participantFromText('MikeYates.txt', correctCanadaPicks)],
      canadaResults,
    );

    expect(ranked.map((score) => score.participant.displayName)).toEqual(['Mike Yates', 'John Yates']);
  });
});
