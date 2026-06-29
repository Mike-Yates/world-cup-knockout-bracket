# Yates Cup Final Plan

## Goal

Build `yatescup.com`, a public read-only 2026 men's World Cup knockout bracket challenge for friends.

The site will show a leaderboard and allow anyone to click a participant to view that person's full bracket. Picks will be scored against real knockout results, with clear green check marks for correct picks and red X marks for incorrect or impossible future picks.

## Product Decisions

- Tournament: 2026 men's FIFA World Cup.
- Scope: knockout stage only.
- Starting round: round of 32.
- Participants: around 10 friends.
- Access: public read-only website.
- Authentication: none.
- User submissions: none.
- Admin UI: none.
- Participant picks: manually entered as plain-text files in `userData/`.
- Teams and bracket structure: hardcoded from the official knockout bracket once verified.
- Canonical bracket order: use the provided `exampleBracket.JPEG` order.
- Results: prefer free API lookup, with local/manual result data as fallback.
- Match score display: show final scores on the bracket.
- Match metadata: no kickoff times, venues, or extra match details needed.

## Leaderboard

The home page will show a leaderboard with these columns:

- Rank.
- Name.
- Current points.
- Champion pick.
- Total possible points.

The leaderboard column should be labeled `Total Possible`.

Rows will be clickable. Clicking a row opens that participant's bracket page.

Leaderboard sorting:

1. Current points, highest first.
2. Total possible points, highest first.
3. Participant name, alphabetical.

## Scoring

Round values:

- Round of 32: 1 point per correct pick.
- Round of 16: 2 points per correct pick.
- Quarterfinals: 3 points per correct pick.
- Semifinals: 4 points per correct pick.
- Final: 5 points for correct champion.

Current points:

- Sum of all correct picks from completed matches.

Total possible points:

- Current points plus all future points that can still be earned.
- If a participant picked a team that has already been eliminated, that team's later-round picks no longer count toward possible points.
- If a completed match was picked incorrectly, those points are lost permanently.

Pick markers:

- Correct completed pick: green check mark.
- Incorrect completed pick: red X.
- Future pick using an eliminated team: red X.
- Future pick still alive: neutral/pending state.

## Bracket Pages

Each participant page will show that person's full knockout bracket.

Requirements:

- Country names and flags.
- Clear winner/loser indication per match.
- Final scores shown when available.
- Correct/incorrect markers next to picks.
- Mobile-first layout.
- Desktop layout should still feel like a traditional NCAA-style bracket.

Mobile bracket display can use whichever approach is cleanest after implementation testing:

- Horizontally scrollable bracket.
- Round-by-round stacked view.
- Hybrid layout with a compact leaderboard and detailed bracket page.

## Visual Direction

- Style: NCAA bracket challenge inspired.
- Branding: simple text-based `Yates Cup` brand.
- Theme: World Cup inspired colors.
- Priority: mobile usability first.
- Flags: use the simplest reliable approach, likely local/generated flag assets or a stable flag library.

## Recommended Technical Approach

Use a simple static web app with local data files. The first target is a fully functional localhost version, built in a way that can be deployed to AWS without a rewrite.

Recommended stack:

- Framework: React with Vite unless API integration proves that Next.js/serverless routes are necessary.
- Data storage: source-controlled files for participants, picks, teams, bracket structure, and fallback results.
- Database: none for v1.
- Auth: none.
- Admin UI: none.
- Scoring: calculated in app code from picks plus results.

Why this fits:

- The site is public and read-only.
- There are no user accounts or submissions.
- Participant picks are manually entered.
- Small data size makes a database unnecessary.
- It will be easy for another agent to understand and modify.

## Participant Input Format

Participant picks are stored as text files in `userData/`.

Observed examples:

- `userData/MikeYates.txt`.
- `userData/JohnYates.txt`.

Rules:

- The participant name can be derived from the filename unless an explicit display name field is added later.
- Filename-derived names should be display formatted, such as `MikeYates.txt` becoming `Mike Yates`.
- Section headers start with `#`.
- Supported sections are `# Round of 32`, `# Round of 16`, `# Round of 8`, `# Round of 4`, `# Round of 2`, and `# Winner`.
- Blank lines are ignored.
- Team names are listed in bracket order for each round.
- Each listed team is the participant's predicted winner for that slot.
- Team-name aliases should be normalized where needed, such as `Bosnia and Herz.` and `DR Congo`.

Implementation detail:

- The app should parse these text files into structured participant pick data during development/build.
- The parser should validate the expected number of entries per section: 32, 16, 8, 4, 2, and 1.
- Invalid or unknown team names should fail loudly during development so mistakes are caught before deployment.

## Data Files

Planned data files:

- `src/data/teams.json`: team IDs, names, country codes, and flag info.
- `src/data/bracket.json`: knockout bracket structure, rounds, match IDs, and team slots.
- `src/data/participants.json`: participant names and all bracket picks.
- `src/data/results.json`: final scores and winners, used as fallback or manual source of truth.

The data should use stable IDs instead of display names so scoring does not break if names or formatting change.

Example team ID format:

- `canada`.
- `france`.
- `brazil`.

Example match ID format:

- `r32-01`.
- `r16-01`.
- `qf-01`.
- `sf-01`.
- `final`.

## Results API Plan

The first implementation should support both automatic and manual results.

API approach:

- Research free World Cup/soccer APIs.
- Test against the already-completed Canada knockout match.
- Expected Canada test result for validation: Canada won 1-0.
- Use API results only if the source is free, reliable enough, and easy to normalize.
- Store or mirror normalized final results in the app's result format.
- Only final match results are required; live in-game score updates are not required.

Fallback approach:

- Manually update `src/data/results.json` when games finish.
- Rebuild/redeploy the site after result updates.
- Keep the scoring logic identical whether results come from API or JSON.

Important implementation detail:

- If the selected API requires a private key, do not expose it in browser code. Use a serverless function, build-time script, or manual JSON fallback instead.

## Hosting Plan

Primary AWS route:

- Deploy the built static app to S3.
- Serve it through CloudFront.
- Use AWS Certificate Manager for HTTPS.
- Point `yatescup.com` DNS to CloudFront.

This is preferred over EC2 because the app is public, read-only, and static.

Confirmed decision:

- Use AWS S3 plus CloudFront as the production target.

Localhost route:

- Run the site locally during development with the framework dev server.
- Keep all scoring and bracket logic identical to production.
- Treat local data parsing, validation, scoring, ranking, and UI as production-quality code.

### Alternative A: Managed Static Hosting

Use Vercel, Netlify, or Cloudflare Pages.

Pros:

- Easiest deployment.
- Free or cheap for this use case.
- HTTPS handled automatically.
- No server maintenance.
- Works well for a static read-only app.

Cons:

- If API secrets are needed, we may need serverless functions or a build-time fetch job.

Recommended providers:

- Vercel if using Next.js.
- Netlify or Cloudflare Pages if using Vite/React.

### Alternative B: AWS EC2

Use an EC2 instance with nginx and a static build.

Pros:

- Familiar if you prefer managing AWS servers.
- Flexible if future backend services are added.

Cons:

- More maintenance than needed for v1.
- Requires Linux setup, nginx, SSL certificates, deployments, updates, and uptime management.

Recommendation:

- Use AWS S3 plus CloudFront unless a future backend requirement makes EC2 worthwhile.

## Domain Plan

- Buy `yatescup.com` through GoDaddy if still available.
- Keep DNS at GoDaddy unless a hosting provider makes DNS easier elsewhere.
- Point the domain to the selected hosting provider.
- Enable HTTPS through the hosting provider or CloudFront certificate setup.

## Build Phases

### Phase 1: Data And Scoring

- Create the app skeleton.
- Add hardcoded teams and bracket structure.
- Add sample participants and picks.
- Add fallback results JSON.
- Implement scoring calculation.
- Implement total possible points calculation.
- Add tests for scoring and possible-points logic.

### Phase 2: Leaderboard

- Build the homepage leaderboard.
- Add ranking and tie-break sorting.
- Show name, points, champion pick, and total possible points.
- Make rows clickable.

### Phase 3: Bracket Viewer

- Build individual participant bracket pages.
- Show all rounds and picks.
- Add flags, team names, scores, and status markers.
- Ensure eliminated future picks show red X marks.
- Optimize for mobile.

### Phase 4: Results Integration

- Research free API options.
- Test against the Canada match.
- Decide whether API integration is reliable enough.
- If yes, add normalized API result loading.
- If no, use manual `results.json` updates for v1.

### Phase 5: Deployment

- Deploy to AWS S3 plus CloudFront.
- Configure production build.
- Deploy the site.
- Connect `yatescup.com`.
- Verify mobile and desktop views.

## MVP Definition

The MVP is complete when:

- `yatescup.com` loads publicly.
- Leaderboard shows all participants.
- Leaderboard sorting follows the agreed tie-breakers.
- Each participant page shows their bracket.
- Correct picks show green check marks.
- Incorrect picks and eliminated future picks show red X marks.
- Current points and total possible points calculate correctly.
- Results can be updated through local JSON or a working free API path.

## Open Items

These are the remaining inputs or research items needed before implementation:

- Provide the remaining participant pick files in the same `userData/*.txt` format.
- Research and select a free results API if one can provide the Canada 1-0 result reliably.
- Use flag images or a flag icon package if straightforward; emoji flags are acceptable if that is simpler.
