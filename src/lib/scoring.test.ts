import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fallbackResults } from '../data/results';
import { parseParticipantFile } from './participants';
import { evaluateParticipant, rankParticipants } from './scoring';

const readParticipant = (fileName: string) =>
  parseParticipantFile({ fileName, text: readFileSync(path.join(process.cwd(), 'userData', fileName), 'utf8') });

describe('scoring', () => {
  it('scores the known Canada 1-0 result and cascades total possible points', () => {
    const mike = evaluateParticipant(readParticipant('MikeYates.txt'), fallbackResults);
    const john = evaluateParticipant(readParticipant('JohnYates.txt'), fallbackResults);

    expect(mike.currentPoints).toBe(1);
    expect(mike.totalPossible).toBe(57);
    expect(john.currentPoints).toBe(0);
    expect(john.totalPossible).toBe(54);

    expect(john.evaluations.find((evaluation) => evaluation.matchId === 'r32-03')?.status).toBe('incorrect');
    expect(john.evaluations.find((evaluation) => evaluation.matchId === 'r16-02')?.status).toBe('eliminated');
  });

  it('ranks by points, then total possible, then name', () => {
    const ranked = rankParticipants([readParticipant('JohnYates.txt'), readParticipant('MikeYates.txt')], fallbackResults);

    expect(ranked.map((score) => score.participant.displayName)).toEqual(['Mike Yates', 'John Yates']);
  });
});
