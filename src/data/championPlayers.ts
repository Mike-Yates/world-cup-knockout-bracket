import type { TeamId } from '../types';

export const championPlayersByTeamId: Partial<Record<TeamId, { name: string; imageUrl: string; credit: string }>> = {
  argentina: {
    name: 'Lionel Messi',
    imageUrl: '/images/player-photos/argentina-messi.webp',
    credit: 'Lionel Messi photo',
  },
  france: {
    name: 'Kylian Mbappe',
    imageUrl: '/images/player-photos/france-mbappe.jpg',
    credit: 'Kylian Mbappe photo',
  },
  england: {
    name: 'Harry Kane',
    imageUrl: '/images/player-photos/england-kane.avif',
    credit: 'Harry Kane photo',
  },
};
