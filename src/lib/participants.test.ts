import { describe, expect, it } from 'vitest';
import { displayNameFromFileName, parseParticipantFile } from './participants';

const samplePicks = `# Round of 32
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
Ghana

# Round of 16
Germany
France

Canada
Netherlands

Portugal
Spain

United States
Belgium

Brazil
Norway

Mexico
England

Argentina
Egypt

Switzerland
Colombia

# Round of 8
France
Netherlands

Spain
Belgium

Brazil
England

Argentina
Colombia

# Round of 4
France
Spain

England
Argentina

# Round of 2
France
Argentina

# Winner
France
`;

describe('participant parser', () => {
  it('formats display names from filenames', () => {
    expect(displayNameFromFileName('MikeYates.txt')).toBe('Mike Yates');
    expect(displayNameFromFileName('john_yates.txt')).toBe('john yates');
  });

  it('parses valid picks', () => {
    const participant = parseParticipantFile({ fileName: 'SamplePicks.txt', text: samplePicks });

    expect(participant.displayName).toBe('Sample Picks');
    expect(participant.picks.round32).toHaveLength(32);
    expect(participant.picks.round16).toHaveLength(16);
    expect(participant.picks.round8).toHaveLength(8);
    expect(participant.picks.round4).toHaveLength(4);
    expect(participant.picks.round2).toHaveLength(2);
    expect(participant.picks.winner).toEqual(['france']);
  });

  it('rejects impossible advancement picks', () => {
    const invalidText = samplePicks.replace('# Round of 16\nGermany', '# Round of 16\nCanada');

    expect(() => parseParticipantFile({ fileName: 'Invalid.txt', text: invalidText })).toThrow(/expected one of Germany or Paraguay/);
  });
});
