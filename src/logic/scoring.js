import { CARD_POINTS, RANK_VALUE, TEAMS } from './deck.js';

export function cardPoints(card) {
  return CARD_POINTS[card.rank];
}

export function handPoints(hand) {
  return hand.reduce((s, c) => s + cardPoints(c), 0);
}

export function trickPoints(trickCards) {
  return trickCards.reduce((s, { card }) => s + cardPoints(card), 0);
}

// Returns true if `card` beats `against` given ledSuit and trump state
function beatsCard(card, against, ledSuit, trump) {
  const ts = trump.revealed ? trump.suit : null;
  const cT = ts && card.suit === ts;
  const aT = ts && against.suit === ts;

  if (cT && !aT) return true;
  if (!cT && aT) return false;
  if (cT && aT) return RANK_VALUE[card.rank] > RANK_VALUE[against.rank];
  // both non-trump
  if (card.suit === ledSuit && against.suit !== ledSuit) return true;
  if (card.suit !== ledSuit && against.suit === ledSuit) return false;
  return RANK_VALUE[card.rank] > RANK_VALUE[against.rank];
}

export function determineTrickWinner(trickCards, ledSuit, trump) {
  let winner = trickCards[0];
  for (const entry of trickCards.slice(1)) {
    if (beatsCard(entry.card, winner.card, ledSuit, trump)) winner = entry;
  }
  return winner.player;
}

export function getLegalCards(hand, ledSuit) {
  if (!ledSuit) return hand;
  const hasLed = hand.some(c => c.suit === ledSuit);
  return hasLed ? hand.filter(c => c.suit === ledSuit) : hand;
}

export function calculateTeamPoints(completedTricks) {
  const pts = { A: 0, B: 0 };
  for (const t of completedTricks) {
    pts[TEAMS[t.winner]] += t.points;
  }
  return pts;
}

export function hasPair(hand, trumpSuit) {
  const hasK = hand.some(c => c.rank === 'K' && c.suit === trumpSuit);
  const hasQ = hand.some(c => c.rank === 'Q' && c.suit === trumpSuit);
  return hasK && hasQ;
}

// Estimate optimal bid given 4-card partial hand
export function calculateOptimalBid(hand4) {
  const pts = handPoints(hand4);
  const estimated = Math.round(pts * 2.6) + 10;
  return Math.max(14, Math.min(20, estimated));
}

export { beatsCard };
