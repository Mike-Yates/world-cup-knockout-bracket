# Repository Guidelines

## Commands
- Use npm; this repo has `package-lock.json` and no yarn/pnpm lockfile.
- Install: `npm install`.
- Dev server: `npm run dev` (`predev` regenerates participant data, Vite binds `0.0.0.0`).
- Build: `npm run build` (`prebuild` regenerates participant data, then `tsc -b && vite build`).
- Tests: `npm test`; focused test: `npm test -- src/lib/scoring.test.ts`.
- Refresh cached final results: `npm run update:results`.
- Manual server update/deploy: `./update.sh`.
- No lint or formatter script is configured.

## Test Deploys
- When the user asks to implement a visible change, deploy it for verification unless they explicitly say not to deploy.
- Preferred flow is local build, then sync `dist/` to EC2/nginx; do not build on the server for normal test deploys.
- Include `npm run update:results` before the test build so cached results are refreshed for the deployed bundle.
- Test/deploy command; source local deploy values from ignored `.env` first:
  `. ./.env && npm test && npm run update:results && npm run build && rsync -az --delete -e "ssh -i $YATESCUP_SSH_KEY -o BatchMode=yes" "dist/" "$YATESCUP_USER@$YATESCUP_HOST:/tmp/yatescup-dist/" && ssh -i "$YATESCUP_SSH_KEY" -o BatchMode=yes "$YATESCUP_USER@$YATESCUP_HOST" "sudo rsync -az --delete /tmp/yatescup-dist/ \"$YATESCUP_WEB_ROOT/\" && sudo nginx -t && sudo systemctl reload nginx"`
- After deploying, verify `https://yatescup.com` responds and references the newly built asset names.

## Data Flow
- Participant picks live in `userData/*.txt`; filenames become display names and ids via `src/lib/participants.ts`.
- `npm run generate:data` parses `userData/` into `src/data/generated/participants.json`; that generated directory is gitignored but imported by `src/App.tsx`.
- Participant files must use the exact section headers in `src/data/bracket.ts` and the canonical Round of 32 order from `initialTeamIds`; impossible advancement picks fail generation.
- Add team aliases in `src/data/teams.ts` when participant text or API payloads use alternate country names.

## Results And Scoring
- Cached final results are in `src/data/results.ts`; `npm run update:results` fetches final API results and rewrites that file.
- Browser runtime also calls ESPN/ThesportsDB in `src/services/resultsApi.ts`; API results are best-effort and only used for completed matches.
- Timed server-side result refresh lives in `ops/auto-update/`; `npm run auto:update` uses the UTC knockout schedule to avoid API calls until 110 minutes after scheduled kickoff and only polls while cached results are below the expected count.
- Scoring and tie-breakers live in `src/lib/scoring.ts`: points, then total possible, then display name.
- Polymarket winner odds are browser-fetched from `src/services/polymarketApi.ts`; failures intentionally return an empty list.

## Source Boundaries
- App entrypoint is `src/main.tsx`; most UI is currently in `src/App.tsx` with styles in `src/styles.css`.
- Bracket shape and match ids are generated from `src/data/bracket.ts`; avoid hardcoding duplicate match topology elsewhere.
- Static deployment target is `dist/` served by EC2/nginx for `yatescup.com`; hostnames, key paths, and server paths are stored in `.env`.
- Public image assets live under `public/images/`; champion-player mappings live in `src/data/championPlayers.ts`.
