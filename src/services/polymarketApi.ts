import type { TeamId } from '../types';
import { getTeamIdByName } from '../data/teams';

const WORLD_CUP_WINNER_EVENT_URL = 'https://polymarket.com/event/world-cup-winner';
const WORLD_CUP_WINNER_API_URL = 'https://gamma-api.polymarket.com/events?slug=world-cup-winner';

type PolymarketMarket = {
  id?: string;
  question?: string;
  groupItemTitle?: string;
  outcomes?: unknown;
  outcomePrices?: unknown;
  active?: boolean;
  closed?: boolean;
  bestBid?: string | number | null;
  bestAsk?: string | number | null;
  lastTradePrice?: string | number | null;
};

type PolymarketEvent = {
  markets?: PolymarketMarket[];
};

export type WinnerOdds = {
  teamName: string;
  teamId?: TeamId;
  probability: number;
  url: string;
};

const parseArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toProbability = (value: unknown) => {
  const parsed = toFiniteNumber(value);
  if (parsed === undefined || parsed < 0 || parsed > 1) {
    return undefined;
  }

  return parsed;
};

const extractTeamName = (market: PolymarketMarket) => {
  if (market.groupItemTitle?.trim()) {
    return market.groupItemTitle.trim();
  }

  return market.question?.match(/^Will (.+) win the 2026 FIFA World Cup\?/i)?.[1]?.trim();
};

const getYesPrice = (market: PolymarketMarket) => {
  const outcomes = parseArray(market.outcomes);
  const prices = parseArray(market.outcomePrices);
  const yesIndex = outcomes.findIndex((outcome) => String(outcome).trim().toLowerCase() === 'yes');
  const outcomePrice = toProbability(prices[yesIndex >= 0 ? yesIndex : 0]);
  if (outcomePrice !== undefined) {
    return outcomePrice;
  }

  const bestBid = toProbability(market.bestBid);
  const bestAsk = toProbability(market.bestAsk);
  if (bestBid !== undefined && bestAsk !== undefined) {
    return (bestBid + bestAsk) / 2;
  }

  return toProbability(market.lastTradePrice) ?? bestBid ?? bestAsk;
};

export const normalizeWorldCupWinnerOdds = (payload: unknown, limit = 3): WinnerOdds[] => {
  const event = Array.isArray(payload) ? (payload[0] as PolymarketEvent | undefined) : (payload as PolymarketEvent | undefined);

  return (event?.markets ?? [])
    .filter((market) => market.active !== false && market.closed !== true)
    .map((market): WinnerOdds | undefined => {
      const teamName = extractTeamName(market);
      const probability = getYesPrice(market);
      if (!teamName || probability === undefined) {
        return undefined;
      }

      return {
        teamName,
        teamId: getTeamIdByName(teamName),
        probability,
        url: WORLD_CUP_WINNER_EVENT_URL,
      };
    })
    .filter((odds): odds is WinnerOdds => Boolean(odds))
    .sort((a, b) => b.probability - a.probability || a.teamName.localeCompare(b.teamName))
    .slice(0, limit);
};

export const loadWorldCupWinnerOdds = async (limit = 3): Promise<WinnerOdds[]> => {
  if (typeof fetch === 'undefined') {
    return [];
  }

  try {
    const response = await fetch(WORLD_CUP_WINNER_API_URL, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      return [];
    }

    return normalizeWorldCupWinnerOdds(await response.json(), limit);
  } catch {
    return [];
  }
};
