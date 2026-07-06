import { initialTeamIds, matches, matchIdsByRound, matchesById } from '../data/bracket';
import { rankParticipants } from '../lib/scoring';
import type { Match, MatchId, MatchResult, Participant, ParticipantScore, ResultsByMatch, TeamId } from '../types';

export type WinningScenario = {
  participant: Participant;
  score: ParticipantScore;
  results: ResultsByMatch;
};

export type WinningScenariosByParticipantId = Record<string, WinningScenario[]>;

const resolveScenarioTeamIds = (matchId: MatchId, results: ResultsByMatch): [TeamId, TeamId] | undefined => {
  const match = matchesById[matchId] as Match | undefined;
  if (!match) {
    return undefined;
  }

  if (match.teamIds) {
    return match.teamIds;
  }

  const winners = match.sourceMatchIds?.map((sourceMatchId) => results[sourceMatchId]?.winnerTeamId);
  if (winners?.length === 2 && winners[0] && winners[1]) {
    return [winners[0], winners[1]];
  }

  return undefined;
};

const makeScenarioResult = (matchId: MatchId, teamIds: [TeamId, TeamId], winnerTeamId: TeamId): MatchResult => ({
  matchId,
  status: 'final',
  homeScore: winnerTeamId === teamIds[0] ? 1 : 0,
  awayScore: winnerTeamId === teamIds[1] ? 1 : 0,
  winnerTeamId,
  source: 'test',
});

const winnersFor = (matchIds: readonly MatchId[], results: ResultsByMatch): TeamId[] =>
  matchIds.map((matchId) => results[matchId]?.winnerTeamId).filter((teamId): teamId is TeamId => Boolean(teamId));

const scenarioParticipant = (owner: Participant, results: ResultsByMatch, scenarioNumber: number): Participant => ({
  id: `${owner.id}-scenario-${scenarioNumber}`,
  displayName: `${owner.displayName} Winning Bracket ${scenarioNumber}`,
  picks: {
    round32: initialTeamIds,
    round16: winnersFor(matchIdsByRound.round32, results),
    round8: winnersFor(matchIdsByRound.round16, results),
    round4: winnersFor(matchIdsByRound.quarterfinal, results),
    round2: winnersFor(matchIdsByRound.semifinal, results),
    winner: winnersFor(matchIdsByRound.final, results),
  },
});

const scenarioScore = (participant: Participant): ParticipantScore => ({
  participant,
  currentPoints: 0,
  totalPossible: 0,
  championPickTeamId: participant.picks.winner[0],
  evaluations: [],
});

export const calculateWinningScenarios = (participants: Participant[], knownResults: ResultsByMatch): WinningScenariosByParticipantId => {
  const scenariosByParticipantId: WinningScenariosByParticipantId = Object.fromEntries(participants.map((participant) => [participant.id, []]));

  const visit = (matchIndex: number, simulatedResults: ResultsByMatch) => {
    if (matchIndex >= matches.length) {
      const winner = rankParticipants(participants, simulatedResults)[0]?.participant;
      if (!winner) {
        return;
      }

      const scenarios = scenariosByParticipantId[winner.id];
      const participant = scenarioParticipant(winner, simulatedResults, scenarios.length + 1);
      scenarios.push({ participant, score: scenarioScore(participant), results: simulatedResults });
      return;
    }

    const match = matches[matchIndex];
    if (simulatedResults[match.id]) {
      visit(matchIndex + 1, simulatedResults);
      return;
    }

    const teamIds = resolveScenarioTeamIds(match.id, simulatedResults);
    if (!teamIds) {
      throw new Error(`Could not resolve teams for winning scenario match ${match.id}`);
    }

    teamIds.forEach((winnerTeamId) => {
      visit(matchIndex + 1, {
        ...simulatedResults,
        [match.id]: makeScenarioResult(match.id, teamIds, winnerTeamId),
      });
    });
  };

  visit(0, { ...knownResults });

  return scenariosByParticipantId;
};
