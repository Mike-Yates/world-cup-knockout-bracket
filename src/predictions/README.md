# Predictions Math

The `/predictions` page estimates each participant's chance to win the Yates Cup without changing or linking from the main leaderboard page.

## Inputs

- Participant picks come from the same generated participant JSON as the main leaderboard.
- Completed results come from `src/data/results.ts`, then merge with best-effort browser API results exactly like the main page.
- ELO ratings are statically stored in `src/predictions/teamElo.ts` from `https://www.eloratings.net/World.tsv`.
- `npm run update:results` refreshes ELO only when it adds at least one newly completed match, so the deployed bundle only updates the snapshot after a real result changes the bracket state.

## Simulation

The implementation enumerates every unresolved bracket path exactly. With the current cache, there are 16 unresolved matches, so the page evaluates `2^16 = 65,536` complete tournament outcomes.

For each unresolved match:

- The 50/50 column gives both teams probability `0.5`.
- The ELO column computes team A's knockout advancement probability with the standard no-draw Elo formula: `1 / (1 + 10 ^ ((eloB - eloA) / 400))`.
- The winner is advanced into downstream matches using the same bracket topology as `src/data/bracket.ts`.

For each complete simulated bracket:

- The simulation creates final match results for every remaining scored match.
- Existing `rankParticipants` scoring is reused so point values, eliminated picks, and tie-breakers stay consistent with the main leaderboard.
- The first-ranked participant receives that scenario's probability weight.

The final displayed probability is the sum of all scenario weights where that participant finishes first. Rows are sorted by ELO-adjusted probability, then 50/50 probability, then display name.

## Tie Handling

The page intentionally uses the app's existing rank order as the winner definition. At the end of a fully simulated bracket, total possible equals current points, so ties are resolved by the existing display-name tie-breaker from `rankParticipants`.
