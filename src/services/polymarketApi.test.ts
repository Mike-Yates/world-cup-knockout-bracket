import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWorldCupWinnerOdds, normalizeWorldCupWinnerOdds } from './polymarketApi';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Polymarket World Cup winner odds', () => {
  it('normalizes and sorts top winner markets', () => {
    const odds = normalizeWorldCupWinnerOdds([
      {
        markets: [
          {
            question: 'Will Spain win the 2026 FIFA World Cup?',
            groupItemTitle: 'Spain',
            outcomes: '["Yes", "No"]',
            outcomePrices: '["0.1115", "0.8885"]',
            active: true,
            closed: false,
          },
          {
            question: 'Will France win the 2026 FIFA World Cup?',
            groupItemTitle: 'France',
            outcomes: '["Yes", "No"]',
            outcomePrices: '["0.302", "0.698"]',
            active: true,
            closed: false,
          },
          {
            question: 'Will Argentina win the 2026 FIFA World Cup?',
            groupItemTitle: 'Argentina',
            outcomes: '["Yes", "No"]',
            outcomePrices: '["0.1935", "0.8065"]',
            active: true,
            closed: false,
          },
          {
            question: 'Will England win the 2026 FIFA World Cup?',
            groupItemTitle: 'England',
            outcomes: '["Yes", "No"]',
            outcomePrices: '["0.0995", "0.9005"]',
            active: true,
            closed: false,
          },
        ],
      },
    ]);

    expect(odds).toEqual([
      { teamName: 'France', teamId: 'france', probability: 0.302, url: 'https://polymarket.com/event/world-cup-winner' },
      { teamName: 'Argentina', teamId: 'argentina', probability: 0.1935, url: 'https://polymarket.com/event/world-cup-winner' },
      { teamName: 'Spain', teamId: 'spain', probability: 0.1115, url: 'https://polymarket.com/event/world-cup-winner' },
    ]);
  });

  it('uses existing team aliases for Polymarket names', () => {
    const odds = normalizeWorldCupWinnerOdds({
      markets: [
        {
          question: 'Will USA win the 2026 FIFA World Cup?',
          groupItemTitle: 'USA',
          outcomes: '["Yes", "No"]',
          outcomePrices: '["0.0305", "0.9695"]',
        },
      ],
    });

    expect(odds[0]).toMatchObject({ teamName: 'USA', teamId: 'united-states', probability: 0.0305 });
  });

  it('falls back to bid/ask midpoint when outcome prices are unavailable', () => {
    const odds = normalizeWorldCupWinnerOdds({
      markets: [
        {
          question: 'Will Brazil win the 2026 FIFA World Cup?',
          outcomes: '["Yes", "No"]',
          outcomePrices: '[]',
          bestBid: 0.07,
          bestAsk: 0.071,
        },
      ],
    });

    expect(odds[0]).toMatchObject({ teamName: 'Brazil', teamId: 'brazil' });
    expect(odds[0]?.probability).toBeCloseTo(0.0705);
  });

  it('returns an empty list when the live request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );

    await expect(loadWorldCupWinnerOdds()).resolves.toEqual([]);
  });
});
