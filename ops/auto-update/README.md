# Auto Update Plan

Goal: keep the static bundle's cached results fresh without rebuilding on every page load and without hitting the results APIs before a match could reasonably be final.

## Inputs

- `knockout-schedule.json` lists the 31 scored bracket matches in chronological kickoff order.
- Each game has `scheduledStartUtc` and `pollStartsAtUtc`.
- `pollStartsAtUtc` is kickoff plus 110 minutes.
- `autoUpdateStopsAtUtc` is `2026-07-21T00:00:00Z`, the end of the day after the World Cup final in UTC.
- The third-place match is not scored by this app and is excluded.

## Implemented Flow

Run `npm run auto:update` from a server-side `systemd` timer every 2 minutes. The timer can run all day because the script exits before making any API call unless a result is due.

Timezone handling:

- The schedule uses UTC ISO timestamps with `Z` suffixes.
- The script compares `Date.now()` to `Date.parse(game.pollStartsAtUtc)` epoch milliseconds.
- Epoch millisecond comparisons are independent of the EC2 instance's local timezone.
- The `systemd` timer does not need match-specific timezone rules; it only wakes the script every 2 minutes.

Script logic:

1. Read `ops/auto-update/knockout-schedule.json`.
2. If current UTC time is at or after `autoUpdateStopsAtUtc`, disable the systemd timer and exit.
3. Count cached results from `src/data/results.ts`.
4. Compute `expectedCachedResults` as the number of schedule entries whose `pollStartsAtUtc` is less than or equal to now.
5. If `cachedResults >= expectedCachedResults`, exit without calling ESPN/TheSportsDB.
6. If `cachedResults < expectedCachedResults`, run `npm run update:results`.
7. Re-count cached results.
8. If the count increased, run `npm run build`, sync `dist/` to the nginx web root, run `sudo nginx -t`, then `sudo systemctl daemon-reload` and `sudo systemctl reload nginx`.
9. If the count did not increase, exit successfully. The timer will try again 2 minutes later.

This keeps polling focused on likely final-result windows while also handling manual updates: if `update.sh` or a manual deploy already cached the result, the next timer run sees `cachedResults >= expectedCachedResults` and stops calling the API.

By default, `npm run auto:update` does not run `git pull` or `npm install`. That avoids problems caused by the server's local `src/data/results.ts` changing after automatic cache refreshes. If you intentionally want to refresh repo code before the gated API check, run `npm run auto:update -- --pull`.

## Why Not Browser-Triggered

The deployed site is static. A browser can discover new API results, but it cannot safely run server commands. Adding a public endpoint for this would create a rebuild trigger that could be spammed unless we also add authentication, rate limiting, and a backend service. A server timer is simpler and safer.

## Commands

Check what the script would do without running update/build/deploy commands:

```bash
npm run auto:update -- --dry-run
```

Test a specific UTC time without depending on the server clock:

```bash
npm run auto:update -- --dry-run --now=2026-07-04T18:50:00Z
```

Run the real gated update:

```bash
npm run auto:update
```

The script reads `YATESCUP_WEB_ROOT` from the environment or local `.env` before deploying.

The script disables `yatescup-auto-update.timer` after `autoUpdateStopsAtUtc`. Set `YATESCUP_AUTO_UPDATE_TIMER_NAME` if you install the timer under a different name.

## systemd Timer

Use a 2-minute timer and let the script decide whether any API call is needed. Source-controlled unit templates live in `ops/auto-update/systemd/`.

`update.sh` installs/updates these templates under `/etc/systemd/system/`, substitutes the current repo path and service user, reloads systemd when unit files change, and enables/starts `yatescup-auto-update.timer` if it is missing or inactive.

Service template:

```ini
[Unit]
Description=Yates Cup auto update
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=__YATESCUP_SERVICE_USER__
Environment=HOME=__YATESCUP_SERVICE_HOME__
WorkingDirectory=__YATESCUP_APP_DIR__
EnvironmentFile=__YATESCUP_APP_DIR__/.env
ExecStart=/usr/bin/npm run auto:update
```

Timer template:

```ini
[Unit]
Description=Run Yates Cup auto update every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
Persistent=true

[Install]
WantedBy=timers.target
```

## Manual update.sh Cleanup

The current `update.sh` should add `set -euo pipefail`, use `git pull --ff-only`, validate nginx config, and run `sudo systemctl daemon-reload` before reloading nginx to clear the unit-file warning.

Suggested manual script:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd ~/world-cup-knockout-bracket
git pull --ff-only
npm install
npm run update:results
npm run build
sudo rsync -az --delete dist/ /var/www/yatescup/
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl reload nginx
```
