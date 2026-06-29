import { matchesById, scoringRounds } from '../data/bracket';
import type { Match, MatchId, Participant, ParticipantScore, PickEvaluation, ResultsByMatch, TeamId } from '../types';

export const getEliminatedTeamIds = (results: ResultsByMatch): Set<TeamId> => {
  const eliminatedTeamIds = new Set<TeamId>();

  Object.values(results).forEach((result) => {
    if (!result) {
      return;
    }

    const match = matchesById[result.matchId] as Match | undefined;
    if (!match?.teamIds) {
      return;
    }

    match.teamIds.forEach((teamId) => {
      if (teamId !== result.winnerTeamId) {
        eliminatedTeamIds.add(teamId);
      }
    });
  });

  return eliminatedTeamIds;
};

export const evaluateParticipant = (participant: Participant, results: ResultsByMatch): ParticipantScore => {
  const eliminatedTeamIds = getEliminatedTeamIds(results);
  const evaluations: PickEvaluation[] = scoringRounds.flatMap((round) =>
    round.matchIds.map((matchId, pickIndex) => {
      const pickedTeamId = participant.picks[round.pickRound][pickIndex];
      const result = results[matchId as MatchId];
      const status: PickEvaluation['status'] = result
        ? result.winnerTeamId === pickedTeamId
          ? 'correct'
          : 'incorrect'
        : eliminatedTeamIds.has(pickedTeamId)
          ? 'eliminated'
          : 'pending';

      return {
        matchId: matchId as MatchId,
        matchRound: round.matchRound,
        pickRound: round.pickRound,
        pickIndex,
        pickedTeamId,
        points: round.points,
        status,
      };
    }),
  );

  const currentPoints = evaluations.reduce((total, evaluation) => total + (evaluation.status === 'correct' ? evaluation.points : 0), 0);
  const totalPossible = evaluations.reduce(
    (total, evaluation) => total + (evaluation.status === 'correct' || evaluation.status === 'pending' ? evaluation.points : 0),
    0,
  );

  return {
    participant,
    currentPoints,
    totalPossible,
    championPickTeamId: participant.picks.winner[0],
    evaluations,
  };
};

export const rankParticipants = (participants: Participant[], results: ResultsByMatch): ParticipantScore[] =>
  participants
    .map((participant) => evaluateParticipant(participant, results))
    .sort((a, b) => {
      if (b.currentPoints !== a.currentPoints) {
        return b.currentPoints - a.currentPoints;
      }

      if (b.totalPossible !== a.totalPossible) {
        return b.totalPossible - a.totalPossible;
      }

      return a.participant.displayName.localeCompare(b.participant.displayName);
    });

export const evaluationByPick = (evaluations: PickEvaluation[]) => {
  const byPick = new Map<string, PickEvaluation>();
  evaluations.forEach((evaluation) => {
    byPick.set(`${evaluation.pickRound}:${evaluation.pickIndex}`, evaluation);
  });
  return byPick;
};
