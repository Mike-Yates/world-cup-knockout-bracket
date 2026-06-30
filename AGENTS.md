# Repository Guidelines

## Commands
- Use npm; this repo has `package-lock.json` and no yarn/pnpm lockfile.
- Install: `npm install`.
- Dev server: `npm run dev` (`predev` regenerates participant data, Vite binds `0.0.0.0`).
- Build: `npm run build` (`prebuild` regenerates participant data, then `tsc -b && vite build`).
- Tests: `npm test`; focused test: `npm test -- src/lib/scoring.test.ts`.
- No lint or formatter script is configured.

## Data Flow
- Participant picks live in `userData/*.txt`; filenames become display names and ids via `src/lib/participants.ts`.
- `npm run generate:data` parses `userData/` into `src/data/generated/participants.json`; that generated directory is gitignored but imported by `src/App.tsx`.
- Participant files must use the exact section headers in `src/data/bracket.ts` and the canonical Round of 32 order from `initialTeamIds`; impossible advancement picks fail generation.
- Add team aliases in `src/data/teams.ts` when participant text or API payloads use alternate country names.

## Results And Scoring
- Cached final results are in `src/data/results.ts`; `npm run update:results` fetches final API results and rewrites that file.
- Browser runtime also calls ESPN/ThesportsDB in `src/services/resultsApi.ts`; API results are best-effort and only used for completed matches.
- Scoring and tie-breakers live in `src/lib/scoring.ts`: points, then total possible, then display name.
- Polymarket winner odds are browser-fetched from `src/services/polymarketApi.ts`; failures intentionally return an empty list.

## Source Boundaries
- App entrypoint is `src/main.tsx`; most UI is currently in `src/App.tsx` with styles in `src/styles.css`.
- Bracket shape and match ids are generated from `src/data/bracket.ts`; avoid hardcoding duplicate match topology elsewhere.
- Static deployment target is `dist/` to S3/CloudFront for `yatescup.com`.
- Both `.ts` and `.js` Vite/Vitest config files exist and are equivalent; if config changes, update or intentionally remove the duplicate instead of changing only one.
