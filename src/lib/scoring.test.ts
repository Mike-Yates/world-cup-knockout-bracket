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

  it('ranks by points, then total possible, then name', () => {
    const ranked = rankParticipants(
      [participantFromText('JohnYates.txt', wrongSouthAfricaPicks), participantFromText('MikeYates.txt', correctCanadaPicks)],
      canadaResults,
    );

    expect(ranked.map((score) => score.participant.displayName)).toEqual(['Mike Yates', 'John Yates']);
  });
});
