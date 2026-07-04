import { matches, matchesById } from '../data/bracket';
import { rankParticipants } from '../lib/scoring';
import type { Match, MatchId, MatchResult, Participant, ResultsByMatch, TeamId } from '../types';
import { currentTeamElo, type TeamEloRating } from './teamElo';

export type PredictionChance = {
  participant: Participant;
  equalProbability: number;
  eloProbability: number;
};

export type PredictionResult = {
  chances: PredictionChance[];
  remainingMatches: number;
  scenarioCount: number;
};

const defaultEloRating = 1500;

export const eloWinProbability = (ratingA: number, ratingB: number) => 1 / (1 + 10 ** ((ratingB - ratingA) / 400));

const resolveSimulationTeamIds = (matchId: MatchId, results: ResultsByMatch): [TeamId, TeamId] | undefined => {
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

const makeSimulatedResult = (matchId: MatchId, teamIds: [TeamId, TeamId], winnerTeamId: TeamId): MatchResult => ({
  matchId,
  status: 'final',
  homeScore: winnerTeamId === teamIds[0] ? 1 : 0,
  awayScore: winnerTeamId === teamIds[1] ? 1 : 0,
  winnerTeamId,
  source: 'test',
});

const getRating = (teamId: TeamId, ratings: Record<TeamId, TeamEloRating>) => ratings[teamId]?.rating ?? defaultEloRating;

export const calculatePredictionChances = (
  participants: Participant[],
  knownResults: ResultsByMatch,
  ratings: Record<TeamId, TeamEloRating> = currentTeamElo,
): PredictionResult => {
  const winnerWeights = new Map<string, { equal: number; elo: number }>();
  participants.forEach((participant) => winnerWeights.set(participant.id, { equal: 0, elo: 0 }));

  const unresolvedMatches = matches.filter((match) => !knownResults[match.id]);
  const scenarioCount = 2 ** unresolvedMatches.length;

  const visit = (matchIndex: number, simulatedResults: ResultsByMatch, equalPathProbability: number, eloPathProbability: number) => {
    if (matchIndex >= matches.length) {
      const winner = rankParticipants(participants, simulatedResults)[0]?.participant;
      if (!winner) {
        return;
      }

      const weights = winnerWeights.get(winner.id);
      if (weights) {
        weights.equal += equalPathProbability;
        weights.elo += eloPathProbability;
      }
      return;
    }

    const match = matches[matchIndex];
    if (simulatedResults[match.id]) {
      visit(matchIndex + 1, simulatedResults, equalPathProbability, eloPathProbability);
      return;
    }

    const teamIds = resolveSimulationTeamIds(match.id, simulatedResults);
    if (!teamIds) {
      throw new Error(`Could not resolve teams for simulated match ${match.id}`);
    }

    const firstTeamEloProbability = eloWinProbability(getRating(teamIds[0], ratings), getRating(teamIds[1], ratings));

    teamIds.forEach((winnerTeamId, winnerIndex) => {
      visit(
        matchIndex + 1,
        {
          ...simulatedResults,
          [match.id]: makeSimulatedResult(match.id, teamIds, winnerTeamId),
        },
        equalPathProbability * 0.5,
        eloPathProbability * (winnerIndex === 0 ? firstTeamEloProbability : 1 - firstTeamEloProbability),
      );
    });
  };

  visit(0, { ...knownResults }, 1, 1);

  const chances = participants
    .map((participant) => {
      const weights = winnerWeights.get(participant.id) ?? { equal: 0, elo: 0 };
      return {
        participant,
        equalProbability: weights.equal,
        eloProbability: weights.elo,
      };
    })
    .sort((a, b) => {
      if (b.eloProbability !== a.eloProbability) {
        return b.eloProbability - a.eloProbability;
      }

      if (b.equalProbability !== a.equalProbability) {
        return b.equalProbability - a.equalProbability;
      }

      return a.participant.displayName.localeCompare(b.participant.displayName);
    });

  return {
    chances,
    remainingMatches: unresolvedMatches.length,
    scenarioCount,
  };
};
