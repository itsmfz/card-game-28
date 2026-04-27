export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
export const RANK_VALUE = { J: 7, '9': 6, A: 5, '10': 4, K: 3, Q: 2, '8': 1, '7': 0 };
export const CARD_POINTS = { J: 3, '9': 2, A: 1, '10': 1, K: 0, Q: 0, '8': 0, '7': 0 };

// Counter-clockwise seating order
export const PLAYERS_CCW = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
export const TEAMS = { SOUTH: 'A', NORTH: 'A', EAST: 'B', WEST: 'B' };

const PARTNER = { SOUTH: 'NORTH', NORTH: 'SOUTH', EAST: 'WEST', WEST: 'EAST' };

export function getTeam(player) { return TEAMS[player]; }
export function getPartner(player) { return PARTNER[player]; }

export function createDeck() {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({ suit, rank, id: `${rank}${suit}` }))
  );
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns [nextPlayer, nextPlayer, ...] starting from player after `dealer` in CCW order
export function getDealOrder(dealer) {
  const idx = PLAYERS_CCW.indexOf(dealer);
  return [
    ...PLAYERS_CCW.slice(idx + 1),
    ...PLAYERS_CCW.slice(0, idx + 1),
  ];
}

// Deal `count` cards to each player in dealOrder, returning new hands and remaining deck
export function dealCards(deck, dealOrder, count) {
  const hands = { SOUTH: [], NORTH: [], EAST: [], WEST: [] };
  const remaining = [...deck];
  for (let i = 0; i < count; i++) {
    for (const player of dealOrder) {
      if (remaining.length) hands[player].push(remaining.shift());
    }
  }
  return { hands, remaining };
}

export function hasZeroPointCards(hand) {
  return hand.every(card => CARD_POINTS[card.rank] === 0);
}
