import { initialTeamIds, pickRoundConfigs, sectionHeaders } from '../data/bracket';
import { getTeamIdByName, teamsById } from '../data/teams';
import type { Participant, PickRoundKey, TeamId } from '../types';

type ParseInput = {
  fileName: string;
  text: string;
};

const emptyPicks = (): Record<PickRoundKey, TeamId[]> => ({
  round32: [],
  round16: [],
  round8: [],
  round4: [],
  round2: [],
  winner: [],
});

export const displayNameFromFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return baseName
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
};

export const participantIdFromFileName = (fileName: string) =>
  displayNameFromFileName(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeHeader = (line: string) => line.replace(/^#+/, '').trim().toLowerCase();

const formatTeam = (teamId: string) => teamsById[teamId]?.name ?? teamId;

const validateCounts = (participant: Participant) => {
  for (const config of pickRoundConfigs) {
    const actualCount = participant.picks[config.key].length;
    if (actualCount !== config.expectedCount) {
      throw new Error(
        `${participant.displayName}: ${config.label} expected ${config.expectedCount} entries but found ${actualCount}`,
      );
    }
  }
};

const validateInitialRound = (participant: Participant) => {
  participant.picks.round32.forEach((teamId, index) => {
    if (teamId !== initialTeamIds[index]) {
      throw new Error(
        `${participant.displayName}: Round of 32 entry ${index + 1} expected ${formatTeam(initialTeamIds[index])} but found ${formatTeam(teamId)}`,
      );
    }
  });
};

const validateAdvancementRound = (participant: Participant, sourceRound: PickRoundKey, targetRound: PickRoundKey) => {
  participant.picks[targetRound].forEach((teamId, index) => {
    const sourcePair = [participant.picks[sourceRound][index * 2], participant.picks[sourceRound][index * 2 + 1]];
    if (!sourcePair.includes(teamId)) {
      throw new Error(
        `${participant.displayName}: ${pickRoundConfigs.find((round) => round.key === targetRound)?.label} entry ${index + 1} picked ${formatTeam(teamId)}, but expected one of ${sourcePair.map(formatTeam).join(' or ')}`,
      );
    }
  });
};

export const validateParticipant = (participant: Participant) => {
  validateCounts(participant);
  validateInitialRound(participant);
  validateAdvancementRound(participant, 'round32', 'round16');
  validateAdvancementRound(participant, 'round16', 'round8');
  validateAdvancementRound(participant, 'round8', 'round4');
  validateAdvancementRound(participant, 'round4', 'round2');
  validateAdvancementRound(participant, 'round2', 'winner');
};

export const parseParticipantFile = ({ fileName, text }: ParseInput): Participant => {
  const picks = emptyPicks();
  let currentRound: PickRoundKey | undefined;

  text.split(/\r?\n/).forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    if (line.startsWith('#')) {
      const header = normalizeHeader(line);
      currentRound = sectionHeaders[header];
      if (!currentRound) {
        throw new Error(`${fileName}:${lineIndex + 1}: unknown section header "${line}"`);
      }
      return;
    }

    if (!currentRound) {
      throw new Error(`${fileName}:${lineIndex + 1}: team listed before any round header`);
    }

    const teamId = getTeamIdByName(line);
    if (!teamId) {
      throw new Error(`${fileName}:${lineIndex + 1}: unknown team "${line}"`);
    }

    picks[currentRound].push(teamId);
  });

  const participant = {
    id: participantIdFromFileName(fileName),
    displayName: displayNameFromFileName(fileName),
    picks,
  };

  validateParticipant(participant);
  return participant;
};
