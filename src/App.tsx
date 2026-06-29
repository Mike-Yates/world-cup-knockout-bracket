import { useEffect, useState } from 'react';
import generatedParticipants from './data/generated/participants.json';
import { initialTeamIds } from './data/bracket';
import { fallbackResults } from './data/results';
import { getFlagImageUrl, getTeam } from './data/teams';
import { evaluationByPick, rankParticipants } from './lib/scoring';
import { loadApiResults, mergeResults } from './services/resultsApi';
import type { Participant, ParticipantScore, PickEvaluation, PickRoundKey, ResultsByMatch, TeamId } from './types';

const participants = generatedParticipants as Participant[];

const pickRounds: Array<{ key: PickRoundKey; label: string }> = [
  { key: 'round32', label: 'Round of 32' },
  { key: 'round16', label: 'Round of 16' },
  { key: 'round8', label: 'Quarterfinals' },
  { key: 'round4', label: 'Semifinals' },
  { key: 'round2', label: 'Finalists' },
  { key: 'winner', label: 'Champion' },
];

const hashToParticipantId = () => window.location.hash.replace(/^#\/bracket\//, '') || undefined;

const setParticipantHash = (participantId: string) => {
  window.location.hash = `/bracket/${participantId}`;
};

const clearHash = () => {
  window.location.hash = '';
};

const StatusMark = ({ evaluation }: { evaluation?: PickEvaluation }) => {
  if (!evaluation || evaluation.status === 'pending') {
    return null;
  }

  if (evaluation.status === 'correct') {
    return (
      <span className="status status-correct" aria-label="Correct">
        ✓
      </span>
    );
  }

  return (
    <span className="status status-wrong" aria-label={evaluation.status === 'eliminated' ? 'Eliminated' : 'Incorrect'}>
      X
    </span>
  );
};

const TeamBadge = ({ teamId, muted = false }: { teamId: TeamId; muted?: boolean }) => {
  const team = getTeam(teamId);
  return (
    <span className={`team-badge${muted ? ' team-badge-muted' : ''}`}>
      <img className="flag" src={getFlagImageUrl(team.countryCode)} alt="" aria-hidden="true" loading="lazy" />
      <span>{team.name}</span>
    </span>
  );
};

const Leaderboard = ({ scores }: { scores: ParticipantScore[] }) => (
  <section className="panel leaderboard-panel" aria-labelledby="leaderboard-title">
    <div className="section-heading">
      <p className="eyebrow">Live Standings</p>
      <h2 id="leaderboard-title">Leaderboard</h2>
    </div>

    <div className="leaderboard-table" role="table" aria-label="Yates Cup leaderboard">
      <div className="leaderboard-row leaderboard-head" role="row">
        <span role="columnheader">Rank</span>
        <span role="columnheader">Name</span>
        <span role="columnheader">Points</span>
        <span role="columnheader">Champion</span>
        <span role="columnheader">Total Possible</span>
      </div>

      {scores.map((score, index) => (
        <button key={score.participant.id} className="leaderboard-row leaderboard-button" onClick={() => setParticipantHash(score.participant.id)} role="row">
          <span className="rank" role="cell">
            {index + 1}
          </span>
          <span className="name" role="cell">
            {score.participant.displayName}
          </span>
          <span role="cell">{score.currentPoints}</span>
          <span role="cell">
            <TeamBadge teamId={score.championPickTeamId} />
          </span>
          <span className="possible" role="cell">
            {score.totalPossible}
          </span>
        </button>
      ))}
    </div>
  </section>
);

const FirstRoundMatch = ({ matchIndex }: { matchIndex: number }) => {
  const teamIds = [initialTeamIds[matchIndex * 2], initialTeamIds[matchIndex * 2 + 1]];

  return (
    <div className="match-card">
      {teamIds.map((teamId) => (
        <div key={teamId} className="match-team">
          <TeamBadge teamId={teamId} />
        </div>
      ))}
    </div>
  );
};

const PickCard = ({ teamId, evaluation }: { teamId: TeamId; evaluation?: PickEvaluation }) => (
  <div className={`pick-card pick-${evaluation?.status ?? 'base'}`}>
    <TeamBadge teamId={teamId} muted={evaluation?.status === 'incorrect' || evaluation?.status === 'eliminated'} />
    <StatusMark evaluation={evaluation} />
  </div>
);

const Bracket = ({ score }: { score: ParticipantScore }) => {
  const evaluations = evaluationByPick(score.evaluations);

  return (
    <section className="bracket-shell" aria-label={`${score.participant.displayName} bracket`}>
      <div className="bracket-scroll">
        {pickRounds.map((round) => (
          <div key={round.key} className={`round-column round-${round.key}`}>
            <h3>{round.label}</h3>
            <div className="round-stack">
              {round.key === 'round32'
                ? Array.from({ length: 16 }, (_, index) => (
                    <div key={index} className="bracket-slot slot-round32">
                      <FirstRoundMatch matchIndex={index} />
                    </div>
                  ))
                : score.participant.picks[round.key].map((teamId, index) => (
                    <div key={`${round.key}-${index}`} className={`bracket-slot slot-${round.key}`}>
                      <PickCard teamId={teamId} evaluation={evaluations.get(`${round.key}:${index}`)} />
                    </div>
                  ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ParticipantView = ({ score }: { score: ParticipantScore }) => (
  <main>
    <button className="back-button" onClick={clearHash}>
      ← Back to leaderboard
    </button>

    <section className="hero participant-hero">
      <div>
        <p className="eyebrow">Bracket Card</p>
        <h1>{score.participant.displayName}</h1>
      </div>
      <div className="score-summary" aria-label="Participant score summary">
        <span>
          <strong>{score.currentPoints}</strong>
          Points
        </span>
        <span>
          <strong>{score.totalPossible}</strong>
          Total Possible
        </span>
        <span>
          <strong>
            <TeamBadge teamId={score.championPickTeamId} />
          </strong>
          Champion Pick
        </span>
      </div>
    </section>

    <Bracket score={score} />
  </main>
);

const HomeView = ({ scores }: { scores: ParticipantScore[] }) => (
  <main>
    <section className="hero">
      <div className="hero-title">
        <p className="eyebrow">2026 Knockout Challenge</p>
        <h1>Yates Cup</h1>
      </div>
      <ul className="scoring-list" aria-label="Scoring rules">
        <li>Round of 32: 1 point</li>
        <li>Round of 16: 2 points</li>
        <li>Quarterfinals: 3 points</li>
        <li>Semifinals: 4 points</li>
        <li>Finals: 5 points</li>
      </ul>
    </section>

    <Leaderboard scores={scores} />
  </main>
);

export default function App() {
  const [selectedParticipantId, setSelectedParticipantId] = useState(hashToParticipantId);
  const [results, setResults] = useState<ResultsByMatch>(fallbackResults);

  useEffect(() => {
    let isMounted = true;

    loadApiResults(fallbackResults).then((apiResults) => {
      if (!isMounted || Object.keys(apiResults).length === 0) {
        return;
      }

      setResults(mergeResults(fallbackResults, apiResults));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => setSelectedParticipantId(hashToParticipantId());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const leaderboard = rankParticipants(participants, results);
  const selectedScore = selectedParticipantId ? leaderboard.find((score) => score.participant.id === selectedParticipantId) : undefined;

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={clearHash}>
          Yates Cup
        </button>
        <span>World Cup Bracket Challenge</span>
      </header>

      {selectedScore ? (
        <ParticipantView score={selectedScore} />
      ) : (
        <HomeView scores={leaderboard} />
      )}
    </div>
  );
}
