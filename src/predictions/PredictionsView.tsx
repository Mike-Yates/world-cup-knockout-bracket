import type { PredictionResult } from './probabilities';
import { teamEloFetchedAt } from './teamElo';

const formatProbability = (probability: number) => `${(probability * 100).toFixed(3)}%`;

export const PredictionsView = ({ predictionResult }: { predictionResult: PredictionResult }) => (
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
          <span role="columnheader">Name</span>
          <span role="columnheader">50/50</span>
          <span role="columnheader">ELO</span>
        </div>

        {predictionResult.chances.map((chance, index) => (
          <div key={chance.participant.id} className="prediction-row" role="row">
            <span className="rank" role="cell">
              {index + 1}
            </span>
            <span className="name" role="cell">
              {chance.participant.displayName}
            </span>
            <span role="cell">{formatProbability(chance.equalProbability)}</span>
            <span className="prediction-elo" role="cell">
              {formatProbability(chance.eloProbability)}
            </span>
          </div>
        ))}
      </div>
    </section>
  </main>
);
