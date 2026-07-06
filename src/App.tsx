import { useEffect, useMemo, useState } from 'react';
import { Bracket } from './components/Bracket';
import { TeamBadge } from './components/TeamBadge';
import generatedParticipants from './data/generated/participants.json';
import { championPlayersByTeamId } from './data/championPlayers';
import { fallbackResults } from './data/results';
import { rankParticipants } from './lib/scoring';
import { PredictionsView } from './predictions/PredictionsView';
import { calculatePredictionChances } from './predictions/probabilities';
import { getNextSimulationMatch, makeSimulationResult } from './predictions/simulation';
import { calculateWinningScenarios } from './predictions/winningScenarios';
import { loadWorldCupWinnerOdds, type WinnerOdds } from './services/polymarketApi';
import { loadApiResults, mergeResults } from './services/resultsApi';
import type { Participant, ParticipantScore, ResultsByMatch, TeamId } from './types';

const participants = generatedParticipants as Participant[];

const hashToParticipantId = () => window.location.hash.replace(/^#\/bracket\//, '') || undefined;

const setParticipantHash = (participantId: string) => {
  window.location.hash = `/bracket/${participantId}`;
};

const clearHash = () => {
  window.location.hash = '';
};

const formatProbability = (probability: number) => `${(probability * 100).toFixed(1)}%`;

const Leaderboard = ({ scores, winnerOdds }: { scores: ParticipantScore[]; winnerOdds: WinnerOdds[] }) => (
  <section className="panel leaderboard-panel" aria-labelledby="leaderboard-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Live Standings</p>
        <h2 id="leaderboard-title">Leaderboard</h2>
      </div>
      {winnerOdds.length > 0 ? (
        <div className="winner-odds-block">
          <p className="winner-odds-title">Live Odds</p>
          <ul className="winner-odds" aria-label="Polymarket World Cup winner odds">
            {winnerOdds.map((odds) => (
              <li key={odds.teamId ?? odds.teamName}>
                <span>{odds.teamName}</span>
                <strong>{formatProbability(odds.probability)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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

const HomeView = ({ scores, winnerOdds }: { scores: ParticipantScore[]; winnerOdds: WinnerOdds[] }) => (
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
      <img className="world-cup-trophy" src="/images/worldcup3.webp" alt="" aria-hidden="true" />
    </section>

    <Leaderboard scores={scores} winnerOdds={winnerOdds} />
  </main>
);

export default function App() {
  const isPredictionsPath = window.location.pathname.replace(/\/+$/, '') === '/predictions';
  const [selectedParticipantId, setSelectedParticipantId] = useState(hashToParticipantId);
  const [results, setResults] = useState<ResultsByMatch>(fallbackResults);
  const [simulatedWinnerTeamId, setSimulatedWinnerTeamId] = useState<TeamId>();
  const [winnerOdds, setWinnerOdds] = useState<WinnerOdds[]>([]);

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
    let isMounted = true;

    loadWorldCupWinnerOdds(4).then((odds) => {
      if (isMounted) {
        setWinnerOdds(odds);
      }
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

  const nextSimulationMatch = useMemo(() => (isPredictionsPath ? getNextSimulationMatch(results) : undefined), [isPredictionsPath, results]);
  const simulatedResults = useMemo(() => {
    if (!nextSimulationMatch || !simulatedWinnerTeamId) {
      return results;
    }

    return {
      ...results,
      [nextSimulationMatch.matchId]: makeSimulationResult(nextSimulationMatch, simulatedWinnerTeamId),
    };
  }, [nextSimulationMatch, results, simulatedWinnerTeamId]);
  const leaderboard = rankParticipants(participants, simulatedResults);
  const selectedScore = selectedParticipantId ? leaderboard.find((score) => score.participant.id === selectedParticipantId) : undefined;
  const predictionResult = useMemo(() => (isPredictionsPath ? calculatePredictionChances(participants, simulatedResults) : undefined), [isPredictionsPath, simulatedResults]);
  const winningScenariosByParticipantId = useMemo(
    () => (isPredictionsPath ? calculateWinningScenarios(participants, results) : undefined),
    [isPredictionsPath, results],
  );

  useEffect(() => {
    if (simulatedWinnerTeamId && !nextSimulationMatch?.teamIds.includes(simulatedWinnerTeamId)) {
      setSimulatedWinnerTeamId(undefined);
    }
  }, [nextSimulationMatch, simulatedWinnerTeamId]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={isPredictionsPath ? () => (window.location.href = '/') : clearHash}>
          Yates Cup
        </button>
        <span>World Cup Bracket Challenge</span>
      </header>

      {predictionResult ? (
        <PredictionsView
          predictionResult={predictionResult}
          leaderboard={leaderboard}
          simulationMatch={nextSimulationMatch}
          simulatedWinnerTeamId={simulatedWinnerTeamId}
          winningScenariosByParticipantId={winningScenariosByParticipantId ?? {}}
          onSelectSimulatedWinner={setSimulatedWinnerTeamId}
          onResetSimulation={() => setSimulatedWinnerTeamId(undefined)}
        />
      ) : selectedScore ? (
        <ParticipantView score={selectedScore} />
      ) : (
        <HomeView scores={leaderboard} winnerOdds={winnerOdds} />
      )}
    </div>
  );
}
