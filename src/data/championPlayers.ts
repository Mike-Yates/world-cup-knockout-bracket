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
  'united-states': {
    name: 'Christian Pulisic',
    imageUrl: '/images/player-photos/united-states-pulisic.avif',
    credit: 'Christian Pulisic photo',
  },
  spain: {
    name: 'Lamine Yamal',
    imageUrl: '/images/player-photos/spain-yamal.webp',
    credit: 'Lamine Yamal photo',
  },
  brazil: {
    name: 'Brazil stars',
    imageUrl: '/images/player-photos/brazil-stars.webp',
    credit: 'Brazil players photo',
  },
  portugal: {
    name: 'Cristiano Ronaldo',
    imageUrl: '/images/player-photos/portugal-ronaldo.webp',
    credit: 'Cristiano Ronaldo photo',
  },
  norway: {
    name: 'Erling Haaland',
    imageUrl: '/images/player-photos/norway-haaland.webp',
    credit: 'Erling Haaland photo',
  },
  morocco: {
    name: 'Morocco stars',
    imageUrl: '/images/player-photos/morocco-stars.avif',
    credit: 'Morocco players photo',
  },
  japan: {
    name: 'Kaoru Mitoma',
    imageUrl: '/images/player-photos/japan-mitoma.jpg',
    credit: 'Kaoru Mitoma photo',
  },
};
