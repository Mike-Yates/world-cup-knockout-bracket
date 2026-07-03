# Yates Cup

Public read-only 2026 World Cup knockout bracket leaderboard for `https://yatescup.com`.

## Local Development

Install dependencies:

```bash
npm install
```

Run the local site:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run one focused test file:

```bash
npm test -- src/lib/scoring.test.ts
```

Refresh cached final results:

```bash
npm run update:results
```

Run the manual server update/deploy script:

```bash
./update.sh
```

Build the static site:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Participant Data

Participant picks live in `userData/*.txt`. The filename becomes the display name, so `MikeYates.txt` displays as `Mike Yates`.

Expected file sections:

- `# Round of 32`: all 32 starting teams in canonical bracket order.
- `# Round of 16`: 16 picks advancing from the round of 32.
- `# Round of 8`: 8 picks advancing from the round of 16.
- `# Round of 4`: 4 picks advancing from the quarterfinals.
- `# Round of 2`: 2 picks advancing from the semifinals.
- `# Winner`: champion pick.

Before dev/build, `npm run generate:data` parses and validates these files into `src/data/generated/participants.json`. Empty participant files are skipped.

Team names are normalized through `src/data/teams.ts`. Add aliases there when a participant file or API payload uses a different country name.

## Scoring

- Round of 32 winners: 1 point.
- Round of 16 winners: 2 points.
- Quarterfinal winners: 3 points.
- Semifinal winners: 4 points.
- Champion: 5 points.

Leaderboard sorting:

1. Current points, highest first.
2. Total possible, highest first.
3. Name, alphabetical.

Scoring and tie-breakers live in `src/lib/scoring.ts`.

## Results And Odds

Cached final match results live in `src/data/results.ts`. Refresh them with:

```bash
npm run update:results
```

At browser runtime, `src/services/resultsApi.ts` also attempts best-effort live result fetches from ESPN first and TheSportsDB as a fallback. API results are only used for completed matches.

Live World Cup winner odds are fetched in the browser from Polymarket through `src/services/polymarketApi.ts`. If Polymarket fails or returns no usable data, the odds area stays empty; there are no default countries or percentages.

## Source Layout

- `src/main.tsx`: app entrypoint.
- `src/App.tsx`: main UI, leaderboard, bracket views, result/odds loading.
- `src/styles.css`: site styling and responsive layout.
- `src/data/bracket.ts`: canonical bracket shape and match IDs.
- `src/data/teams.ts`: team metadata, aliases, FIFA codes, and country codes.
- `src/data/championPlayers.ts`: champion pick photo mappings.
- `scripts/generate-participants.ts`: generates `src/data/generated/participants.json`.
- `scripts/update-results.ts`: refreshes cached final results.
- `update.sh`: manual EC2/nginx update script that refreshes cached results, builds, syncs `dist/`, validates nginx, and reloads nginx.
- `ops/auto-update/`: UTC schedule and gated server-side timed result refresh script.
- `public/images/`: static image assets served by Vite.

TypeScript files are the source of truth. The repo should not contain compiled `.js` sidecars for `src/`, `scripts/`, or config files; `tsconfig.*.json` uses `noEmit`.

## Test Deployment

Visible changes should be deployed for verification unless explicitly skipped. The deployment flow is local build, then sync `dist/` to EC2/nginx.

Fill in the local `.env` file with deploy values.

Run:

```bash
. ./.env && npm test && npm run update:results && npm run build && rsync -az --delete -e "ssh -i $YATESCUP_SSH_KEY -o BatchMode=yes" "dist/" "$YATESCUP_USER@$YATESCUP_HOST:/tmp/yatescup-dist/" && ssh -i "$YATESCUP_SSH_KEY" -o BatchMode=yes "$YATESCUP_USER@$YATESCUP_HOST" "sudo rsync -az --delete /tmp/yatescup-dist/ \"$YATESCUP_WEB_ROOT/\" && sudo nginx -t && sudo systemctl reload nginx"
```

After deploying, verify `https://yatescup.com` responds and references the newly built asset names.
