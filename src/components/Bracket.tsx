import { initialTeamIds } from '../data/bracket';
import { evaluationByPick } from '../lib/scoring';
import type { ParticipantScore, PickEvaluation, PickRoundKey, TeamId } from '../types';
import { TeamBadge } from './TeamBadge';

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

export const Bracket = ({ score }: { score: ParticipantScore }) => {
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
