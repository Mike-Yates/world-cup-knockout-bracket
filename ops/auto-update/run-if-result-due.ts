import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

type ScheduledGame = {
  gameNumber: number;
  matchId: string;
  pollStartsAtUtc: string;
  label: string;
};

type KnockoutSchedule = {
  timezone: string;
  autoUpdateStopsAtUtc: string;
  games: ScheduledGame[];
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const schedulePath = path.join(projectRoot, 'ops', 'auto-update', 'knockout-schedule.json');
const resultsPath = path.join(projectRoot, 'src', 'data', 'results.ts');
const envPath = path.join(projectRoot, '.env');

const args = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--now=')));
const nowArg = process.argv.slice(2).find((arg) => arg.startsWith('--now='))?.slice('--now='.length);
const isDryRun = args.has('--dry-run');
const shouldPull = args.has('--pull');

const loadLocalEnv = () => {
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
};

const readSchedule = () => JSON.parse(readFileSync(schedulePath, 'utf8')) as KnockoutSchedule;

const readCachedMatchIds = () => {
  const text = readFileSync(resultsPath, 'utf8');
  return new Set([...text.matchAll(/matchId:\s*'([^']+)'/g)].map((match) => match[1]));
};

const parseNow = () => {
  if (!nowArg) {
    return Date.now();
  }

  const parsed = Date.parse(nowArg);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid --now value: ${nowArg}`);
  }

  return parsed;
};

const getDueGames = (schedule: KnockoutSchedule, nowMs: number) =>
  schedule.games.filter((game) => {
    const pollStartsAt = Date.parse(game.pollStartsAtUtc);
    if (Number.isNaN(pollStartsAt)) {
      throw new Error(`Invalid pollStartsAtUtc for ${game.matchId}: ${game.pollStartsAtUtc}`);
    }

    return pollStartsAt <= nowMs;
  });

const getStopAfterMs = (schedule: KnockoutSchedule) => {
  const stopAfter = Date.parse(schedule.autoUpdateStopsAtUtc);
  if (Number.isNaN(stopAfter)) {
    throw new Error(`Invalid autoUpdateStopsAtUtc: ${schedule.autoUpdateStopsAtUtc}`);
  }

  return stopAfter;
};

const logStatus = (label: string, nowMs: number, cachedCount: number, expectedCount: number, nextGame?: ScheduledGame) => {
  console.log(`${label}: cached=${cachedCount}, expected=${expectedCount}, now=${new Date(nowMs).toISOString()}`);
  if (nextGame) {
    console.log(`Next poll window: game ${nextGame.gameNumber} ${nextGame.matchId} at ${nextGame.pollStartsAtUtc} (${nextGame.label})`);
  }
};

const run = (command: string, args: string[]) => {
  console.log(`$ ${[command, ...args].join(' ')}`);
  if (isDryRun) {
    return;
  }

  const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${[command, ...args].join(' ')}`);
  }
};

const readCommandOutput = (command: string, args: string[], allowFailure = false) => {
  const result = spawnSync(command, args, { cwd: projectRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    if (allowFailure) {
      return undefined;
    }

    throw new Error(`Command failed: ${[command, ...args].join(' ')}`);
  }

  return result.stdout.trim();
};

const getUpstreamRef = () => {
  const upstream = readCommandOutput('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], true);
  if (upstream) {
    return upstream;
  }

  const branch = readCommandOutput('git', ['branch', '--show-current']);
  return `origin/${branch}`;
};

const resetToRemote = () => {
  const upstream = getUpstreamRef();
  const remote = upstream.split('/')[0] || 'origin';

  run('git', ['fetch', '--prune', remote]);
  console.log(`Resetting local working tree to ${upstream} before deployment.`);
  run('git', ['reset', '--hard', upstream]);
};

const disableTimerAndExit = (schedule: KnockoutSchedule, nowMs: number) => {
  const timerName = process.env.YATESCUP_AUTO_UPDATE_TIMER_NAME || 'yatescup-auto-update.timer';
  console.log(`Auto-update stop time reached: now=${new Date(nowMs).toISOString()}, stop=${schedule.autoUpdateStopsAtUtc}`);
  console.log(`Disabling ${timerName} so the auto-update poll does not run indefinitely.`);
  run('sudo', ['systemctl', 'disable', '--now', timerName]);
  process.exit(0);
};

const shouldFetchResults = (nowMs: number) => {
  const schedule = readSchedule();
  if (schedule.timezone !== 'UTC') {
    throw new Error(`Auto-update schedule must use UTC, got ${schedule.timezone}`);
  }

  const cachedIds = readCachedMatchIds();
  const dueGames = getDueGames(schedule, nowMs);
  const nextGame = schedule.games.find((game) => Date.parse(game.pollStartsAtUtc) > nowMs);

  logStatus('Auto-update gate', nowMs, cachedIds.size, dueGames.length, nextGame);
  return cachedIds.size < dueGames.length;
};

const deployIfResultAdded = () => {
  const webRoot = process.env.YATESCUP_WEB_ROOT;
  if (!webRoot) {
    throw new Error('YATESCUP_WEB_ROOT must be set in the environment or .env before deploying.');
  }

  run('npm', ['run', 'build']);
  run('sudo', ['rsync', '-az', '--delete', 'dist/', `${webRoot.replace(/\/$/, '')}/`]);
  run('sudo', ['nginx', '-t']);
  run('sudo', ['systemctl', 'daemon-reload']);
  run('sudo', ['systemctl', 'reload', 'nginx']);
};

loadLocalEnv();

const nowMs = parseNow();
const schedule = readSchedule();
if (schedule.timezone !== 'UTC') {
  throw new Error(`Auto-update schedule must use UTC, got ${schedule.timezone}`);
}

if (nowMs >= getStopAfterMs(schedule)) {
  disableTimerAndExit(schedule, nowMs);
}

if (!shouldFetchResults(nowMs)) {
  console.log('No result API request needed. Cached results already meet the expected count for the current UTC time.');
  process.exit(0);
}

if (shouldPull) {
  resetToRemote();
  run('npm', ['install']);

  if (!shouldFetchResults(nowMs)) {
    console.log('No result API request needed after refresh. Cached results already meet expected count.');
    process.exit(0);
  }
}

const beforeCount = readCachedMatchIds().size;
run('npm', ['run', 'update:results']);
const afterCount = isDryRun ? beforeCount : readCachedMatchIds().size;

if (afterCount <= beforeCount) {
  console.log(`No new cached result yet: ${afterCount}/${getDueGames(readSchedule(), nowMs).length}. The timer can check again later.`);
  process.exit(0);
}

console.log(`Cached result count increased from ${beforeCount} to ${afterCount}. Building and deploying.`);
deployIfResultAdded();
