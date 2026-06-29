export type TeamId = string;

export type PickRoundKey = 'round32' | 'round16' | 'round8' | 'round4' | 'round2' | 'winner';

export type MatchRoundKey = 'round32' | 'round16' | 'quarterfinal' | 'semifinal' | 'final';

export type MatchId =
  | `r32-${string}`
  | `r16-${string}`
  | `qf-${string}`
  | `sf-${string}`
  | 'final';

export type Team = {
  id: TeamId;
  name: string;
  aliases?: string[];
  fifaCode: string;
  countryCode: string;
};

export type RoundConfig = {
  key: PickRoundKey;
  label: string;
  expectedCount: number;
};

export type Match = {
  id: MatchId;
  round: MatchRoundKey;
  label: string;
  order: number;
  side: 'left' | 'right' | 'center';
  sourceMatchIds?: MatchId[];
  teamIds?: [TeamId, TeamId];
};

export type Participant = {
  id: string;
  displayName: string;
  picks: Record<PickRoundKey, TeamId[]>;
};

export type MatchResult = {
  matchId: MatchId;
  status: 'final';
  homeScore: number;
  awayScore: number;
  winnerTeamId: TeamId;
  source: 'api' | 'manual' | 'test';
};

export type ResultsByMatch = Partial<Record<MatchId, MatchResult>>;

export type PickEvaluation = {
  matchId: MatchId;
  matchRound: MatchRoundKey;
  pickRound: PickRoundKey;
  pickIndex: number;
  pickedTeamId: TeamId;
  points: number;
  status: 'correct' | 'incorrect' | 'eliminated' | 'pending';
};

export type ParticipantScore = {
  participant: Participant;
  currentPoints: number;
  totalPossible: number;
  championPickTeamId: TeamId;
  evaluations: PickEvaluation[];
};
