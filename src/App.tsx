import { useEffect, useState } from 'react';
import generatedParticipants from './data/generated/participants.json';
import { championPlayersByTeamId } from './data/championPlayers';
import { initialTeamIds } from './data/bracket';
import { fallbackResults } from './data/results';
import { getFlagImageUrl, getTeam } from './data/teams';
import { evaluationByPick, rankParticipants } from './lib/scoring';
import { loadApiResults, mergeResults } from './services/resultsApi';
import type { Participant, ParticipantScore, PickEvaluation, PickRoundKey, ResultsByMatch, TeamId } from './types';

const participants = generatedParticipants as Participant[];

const bracketColumns: Array<{ key: PickRoundKey; label: string; start: number; count: number; side: 'left' | 'center' | 'right' }> = [
  { key: 'round32', label: 'Round of 32', start: 0, count: 8, side: 'left' },
  { key: 'round16', label: 'Round of 16', start: 0, count: 8, side: 'left' },
  { key: 'round8', label: 'Quarterfinals', start: 0, count: 4, side: 'left' },
  { key: 'round4', label: 'Semifinals', start: 0, count: 2, side: 'left' },
  { key: 'round2', label: 'Finalist', start: 0, count: 1, side: 'left' },
  { key: 'winner', label: 'Champion', start: 0, count: 1, side: 'center' },
  { key: 'round2', label: 'Finalist', start: 1, count: 1, side: 'right' },
  { key: 'round4', label: 'Semifinals', start: 2, count: 2, side: 'right' },
  { key: 'round8', label: 'Quarterfinals', start: 4, count: 4, side: 'right' },
  { key: 'round16', label: 'Round of 16', start: 8, count: 8, side: 'right' },
  { key: 'round32', label: 'Round of 32', start: 8, count: 8, side: 'right' },
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

const TeamBadge = ({ teamId, muted = false, compactOnMobile = false }: { teamId: TeamId; muted?: boolean; compactOnMobile?: boolean }) => {
  const team = getTeam(teamId);
  return (
    <span className={`team-badge${muted ? ' team-badge-muted' : ''}${compactOnMobile ? ' team-badge-compact-mobile' : ''}`}>
      <img className="flag" src={getFlagImageUrl(team.countryCode)} alt="" aria-hidden="true" loading="lazy" />
      <span className="team-name">{team.name}</span>
      {compactOnMobile ? (
        <span className="team-code" aria-hidden="true">
          {team.fifaCode}
        </span>
      ) : null}
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
        <span role="columnheader" aria-label="Rank">
          <span className="label-full">Rank</span>
          <span className="label-short">#</span>
        </span>
        <span role="columnheader">Name</span>
        <span role="columnheader" aria-label="Points">
          <span className="label-full">Points</span>
          <span className="label-short">Pts</span>
        </span>
        <span role="columnheader">Champion</span>
        <span role="columnheader" aria-label="Total Possible">
          <span className="label-full">Total Possible</span>
          <span className="label-short">Max</span>
        </span>
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
            <TeamBadge teamId={score.championPickTeamId} compactOnMobile />
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
        {bracketColumns.map((column) => (
          <div key={`${column.side}-${column.key}-${column.start}`} className={`round-column round-${column.key} side-${column.side}`}>
            <h3>{column.label}</h3>
            <div className="round-stack">
              {column.key === 'round32'
                ? Array.from({ length: column.count }, (_, index) => (
                    <div key={index} className="bracket-slot slot-round32">
                      <FirstRoundMatch matchIndex={column.start + index} />
                    </div>
                  ))
                : score.participant.picks[column.key].slice(column.start, column.start + column.count).map((teamId, index) => {
                    const pickIndex = column.start + index;
                    return (
                      <div key={`${column.key}-${pickIndex}`} className={`bracket-slot slot-${column.key}`}>
                        <PickCard teamId={teamId} evaluation={evaluations.get(`${column.key}:${pickIndex}`)} />
                      </div>
                    );
                  })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ParticipantView = ({ score }: { score: ParticipantScore }) => {
  const championPlayer = championPlayersByTeamId[score.championPickTeamId];

  return (
    <main>
      <button className="back-button" onClick={clearHash}>
        ← Back to leaderboard
      </button>

      <section className="hero participant-hero">
        <div>
          <p className="eyebrow">Bracket Card</p>
          <h1>{score.participant.displayName}</h1>
        </div>
        <div className={`score-summary${championPlayer ? ' has-player-photo' : ''}`} aria-label="Participant score summary">
          <div className="score-stats">
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
          {championPlayer ? <img className="champion-player-photo" src={championPlayer.imageUrl} alt={championPlayer.name} title={championPlayer.credit} /> : null}
        </div>
      </section>

      <Bracket score={score} />
    </main>
  );
};

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
