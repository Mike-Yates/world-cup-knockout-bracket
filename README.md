# Yates Cup

Public read-only World Cup knockout bracket leaderboard for `yatescup.com`.

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

Before dev/build, `npm run generate:data` parses and validates these files into `src/data/generated/participants.json`.

## Scoring

- Round of 32 winners: 1 point.
- Round of 16 winners: 2 points.
- Quarterfinal winners: 3 points.
- Semifinal winners: 4 points.
- Champion: 5 points.

Leaderboard sorting:

1. Current points, highest first.
2. Total Possible, highest first.
3. Name, alphabetical.

## Results

The app loads cached final results from `src/data/results.ts`, then attempts to fetch final results from a free public API provider in the browser. API results are only used when the provider marks the match final.

Refresh cached final results before a redeploy:

```bash
npm run update:results
```

## AWS Deployment Target

The production target is a static AWS deployment:

- Build with `npm run build`.
- Upload `dist/` to S3.
- Serve through CloudFront.
- Attach `yatescup.com` through DNS and AWS Certificate Manager.
