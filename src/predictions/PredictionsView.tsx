import { useEffect, useState, type MouseEvent } from 'react';
import { Bracket } from '../components/Bracket';
import { getFlagImageUrl, getTeam } from '../data/teams';
import type { Participant, ParticipantScore, TeamId } from '../types';
import type { PredictionResult } from './probabilities';
import type { SimulationMatch } from './simulation';
import { teamEloFetchedAt } from './teamElo';
import type { WinningScenariosByParticipantId } from './winningScenarios';

const formatProbability = (probability: number) => `${(probability * 100).toFixed(3)}%`;

const formatKickoff = (scheduledStartUtc: string) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(
    new Date(scheduledStartUtc),
  );

const SimulationTeamButton = ({ teamId, selected, onClick }: { teamId: TeamId; selected: boolean; onClick: () => void }) => {
  const team = getTeam(teamId);

  return (
    <button className={`simulation-team-button${selected ? ' simulation-team-selected' : ''}`} onClick={onClick} type="button">
      <img className="flag" src={getFlagImageUrl(team.countryCode)} alt="" aria-hidden="true" loading="lazy" />
      <span>{team.name}</span>
    </button>
  );
};

const SimulationPanel = ({
  match,
  simulatedWinnerTeamId,
  onSelectWinner,
  onReset,
}: {
  match?: SimulationMatch;
  simulatedWinnerTeamId?: TeamId;
  onSelectWinner: (teamId: TeamId) => void;
  onReset: () => void;
}) => (
  <section className="simulation-panel" aria-labelledby="simulation-title">
    <div>
      <p className="eyebrow">What If</p>
      <h2 id="simulation-title">Simulate The Future</h2>
      {match ? (
        <p className="simulation-copy">
          Next game: <strong>{getTeam(match.teamIds[0]).name}</strong> vs <strong>{getTeam(match.teamIds[1]).name}</strong>
          <span> | {formatKickoff(match.scheduledStartUtc)}</span>
        </p>
      ) : (
        <p className="simulation-copy">All scheduled matches have results.</p>
      )}
    </div>

    {match ? (
      <div className="simulation-actions" aria-label="Choose a simulated winner">
        {match.teamIds.map((teamId) => (
          <SimulationTeamButton key={teamId} teamId={teamId} selected={simulatedWinnerTeamId === teamId} onClick={() => onSelectWinner(teamId)} />
        ))}
        <button className="simulation-reset" onClick={onReset} type="button" disabled={!simulatedWinnerTeamId}>
          Reset
        </button>
      </div>
    ) : null}
  </section>
);

const ScenarioCard = ({
  participant,
  scenarios,
  selectedScenarioIndex,
  simulationMatch,
  simulatedWinnerTeamId,
  onSelectScenario,
  onSelectSimulatedWinner,
  onResetSimulation,
}: {
  participant: Participant;
  scenarios: WinningScenariosByParticipantId[string];
  selectedScenarioIndex?: number;
  simulationMatch?: SimulationMatch;
  simulatedWinnerTeamId?: TeamId;
  onSelectScenario: (index: number) => void;
  onSelectSimulatedWinner: (teamId: TeamId) => void;
  onResetSimulation: () => void;
}) => {
  const selectedScenario = selectedScenarioIndex === undefined ? undefined : scenarios[selectedScenarioIndex];

  return (
    <section className="prediction-player-card" aria-labelledby="prediction-player-title">
      <SimulationPanel
        match={simulationMatch}
        simulatedWinnerTeamId={simulatedWinnerTeamId}
        onSelectWinner={onSelectSimulatedWinner}
        onReset={onResetSimulation}
      />

      <div className="prediction-player-heading">
        <div>
          <p className="eyebrow">Winning Paths</p>
          <h2 id="prediction-player-title">{participant.displayName}</h2>
          <p className="prediction-player-copy">
            {scenarios.length.toLocaleString()} remaining bracket {scenarios.length === 1 ? 'path puts' : 'paths put'} {participant.displayName} in first.
          </p>
        </div>
      </div>

      {scenarios.length > 0 ? (
        <div className="scenario-grid" aria-label={`${participant.displayName} winning bracket paths`}>
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.participant.id}
              className={`scenario-tile${selectedScenarioIndex === index ? ' scenario-tile-selected' : ''}`}
              onClick={() => onSelectScenario(index)}
              type="button"
            >
              {index + 1}
            </button>
          ))}
        </div>
      ) : (
        <p className="prediction-player-empty">No remaining bracket paths put this player in first.</p>
      )}

      {selectedScenario ? (
        <div className="scenario-bracket">
          <p className="scenario-bracket-title">Winning Bracket {(selectedScenarioIndex ?? 0) + 1}</p>
          <Bracket score={selectedScenario.score} />
        </div>
      ) : null}
    </section>
  );
};

export const PredictionsView = ({
  predictionResult,
  leaderboard,
  selectedParticipantId,
  simulationMatch,
  simulatedWinnerTeamId,
  winningScenariosByParticipantId,
  onSelectParticipant,
  onBackToPredictions,
  onSelectSimulatedWinner,
  onResetSimulation,
}: {
  predictionResult: PredictionResult;
  leaderboard: ParticipantScore[];
  selectedParticipantId?: string;
  simulationMatch?: SimulationMatch;
  simulatedWinnerTeamId?: TeamId;
  winningScenariosByParticipantId: WinningScenariosByParticipantId;
  onSelectParticipant: (participantId: string) => void;
  onBackToPredictions: () => void;
  onSelectSimulatedWinner: (teamId: TeamId) => void;
  onResetSimulation: () => void;
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>();
  const standingsByParticipantId = new Map(leaderboard.map((score, index) => [score.participant.id, index + 1]));
  const selectedParticipant = predictionResult.chances.find((chance) => chance.participant.id === selectedParticipantId)?.participant;
  const selectedScenarios = selectedParticipantId ? (winningScenariosByParticipantId[selectedParticipantId] ?? []) : [];

  useEffect(() => {
    setSelectedScenarioIndex(undefined);
  }, [selectedParticipantId, simulatedWinnerTeamId]);

  const backToPredictions = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setSelectedScenarioIndex(undefined);
    onBackToPredictions();
  };

  if (selectedParticipant) {
    return (
      <main>
        <a className="back-button" href="/predictions" onClick={backToPredictions}>
          ← Back to predictions
        </a>
        <ScenarioCard
          participant={selectedParticipant}
          scenarios={selectedScenarios}
          selectedScenarioIndex={selectedScenarioIndex}
          simulationMatch={simulationMatch}
          simulatedWinnerTeamId={simulatedWinnerTeamId}
          onSelectScenario={setSelectedScenarioIndex}
          onSelectSimulatedWinner={onSelectSimulatedWinner}
          onResetSimulation={onResetSimulation}
        />
      </main>
    );
  }

  return (
    <main>
      <section className="hero prediction-hero">
        <div>
          <p className="eyebrow">Yates Cup Forecast</p>
          <h1>Predictions</h1>
          <p className="hero-copy">Ranked by ELO-adjusted championship probability, with a 50/50 scenario column shown for comparison.</p>
        </div>
        <div className="prediction-summary" aria-label="Prediction calculation summary">
          <span>
            <strong>{predictionResult.remainingMatches}</strong>
            Matches Left
          </span>
          <span>
            <strong>{predictionResult.scenarioCount.toLocaleString()}</strong>
            Bracket Paths
          </span>
          <span>
            <strong>{new Date(teamEloFetchedAt).toLocaleDateString()}</strong>
            ELO Snapshot
          </span>
        </div>
      </section>

      <SimulationPanel
        match={simulationMatch}
        simulatedWinnerTeamId={simulatedWinnerTeamId}
        onSelectWinner={onSelectSimulatedWinner}
        onReset={onResetSimulation}
      />

      <section className="panel leaderboard-panel" aria-labelledby="predictions-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Win Probability</p>
            <h2 id="predictions-title">Prediction Board</h2>
          </div>
        </div>

        <div className="prediction-table" role="table" aria-label="Yates Cup prediction board">
          <div className="prediction-row prediction-head" role="row">
            <span role="columnheader" aria-label="Rank">
              <span className="label-full">Rank</span>
              <span className="label-short">#</span>
            </span>
            <span role="columnheader" aria-label="Standing">
              <span className="label-full">Standing</span>
              <span className="label-short">##</span>
            </span>
            <span role="columnheader">Name</span>
            <span role="columnheader">50/50</span>
            <span role="columnheader">ELO</span>
          </div>

          {predictionResult.chances.map((chance, index) => (
            <button
              key={chance.participant.id}
              className="prediction-row prediction-button"
              onClick={() => onSelectParticipant(chance.participant.id)}
              role="row"
              type="button"
            >
              <span className="rank" role="cell">
                {index + 1}
              </span>
              <span className="standing" role="cell">
                {standingsByParticipantId.get(chance.participant.id)}
              </span>
              <span className="name" role="cell">
                {chance.participant.displayName}
              </span>
              <span role="cell">{formatProbability(chance.equalProbability)}</span>
              <span className="prediction-elo" role="cell">
                {formatProbability(chance.eloProbability)}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};
