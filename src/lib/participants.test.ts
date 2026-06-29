import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { displayNameFromFileName, parseParticipantFile } from './participants';

const readUserData = (fileName: string) => readFileSync(path.join(process.cwd(), 'userData', fileName), 'utf8');

describe('participant parser', () => {
  it('formats display names from filenames', () => {
    expect(displayNameFromFileName('MikeYates.txt')).toBe('Mike Yates');
    expect(displayNameFromFileName('john_yates.txt')).toBe('john yates');
  });

  it('parses the provided Mike Yates picks', () => {
    const participant = parseParticipantFile({ fileName: 'MikeYates.txt', text: readUserData('MikeYates.txt') });

    expect(participant.displayName).toBe('Mike Yates');
    expect(participant.picks.round32).toHaveLength(32);
    expect(participant.picks.round16).toHaveLength(16);
    expect(participant.picks.round8).toHaveLength(8);
    expect(participant.picks.round4).toHaveLength(4);
    expect(participant.picks.round2).toHaveLength(2);
    expect(participant.picks.winner).toEqual(['france']);
  });

  it('rejects impossible advancement picks', () => {
    const invalidText = readUserData('MikeYates.txt').replace('# Round of 16\nGermany', '# Round of 16\nCanada');

    expect(() => parseParticipantFile({ fileName: 'Invalid.txt', text: invalidText })).toThrow(/expected one of Germany or Paraguay/);
  });
});
