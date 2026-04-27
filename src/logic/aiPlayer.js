import { CARD_POINTS, RANK_VALUE, TEAMS } from './deck.js';
import { getLegalCards, handPoints, beatsCard } from './scoring.js';

export function getAIBid(hand, currentBid, difficulty) {
  const pts = handPoints(hand);
  let bid;

  if (difficulty === 'easy') {
    bid = Math.round(pts * 2) + 10;
  } else if (difficulty === 'medium') {
    const maxSuit = Math.max(
      ...Object.values(
        hand.reduce((acc, c) => { acc[c.suit] = (acc[c.suit] || 0) + 1; return acc; }, {})
      )
    );
    bid = Math.round(pts * 2.4) + maxSuit;
  } else {
    const jacks = hand.filter(c => c.rank === 'J').length;
    const nines = hand.filter(c => c.rank === '9').length;
    bid = Math.round(pts * 2.7) + jacks * 2 + nines;
  }

  bid = Math.round(Math.min(20, bid));
  if (bid < 14 || bid <= currentBid) return 'PASS';
  return bid;
}

export function getAITrumpSelection(hand) {
  const suitPts = {};
  const suitJack = {};
  for (const card of hand) {
    suitPts[card.suit] = (suitPts[card.suit] || 0) + CARD_POINTS[card.rank];
    if (card.rank === 'J') suitJack[card.suit] = true;
  }

  return Object.entries(suitPts).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return (suitJack[b[0]] ? 1 : 0) - (suitJack[a[0]] ? 1 : 0);
  })[0][0];
}

function getCurrentWinner(trickCards, ledSuit, trump) {
  if (!trickCards.length) return null;
  let w = trickCards[0];
  for (const e of trickCards.slice(1)) {
    if (beatsCard(e.card, w.card, ledSuit, trump)) w = e;
  }
  return w.player;
}

function canBeatWinner(card, trickCards, ledSuit, trump) {
  if (!trickCards.length) return true;
  let w = trickCards[0];
  for (const e of trickCards.slice(1)) {
    if (beatsCard(e.card, w.card, ledSuit, trump)) w = e;
  }
  return beatsCard(card, w.card, ledSuit, trump);
}

function lowest(cards) {
  return [...cards].sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank])[0];
}
function highest(cards) {
  return [...cards].sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank])[0];
}

export function getAICardPlay(player, hand, trickCards, ledSuit, trump, difficulty, completedTricks) {
  const legal = getLegalCards(hand, ledSuit);

  if (difficulty === 'easy') {
    if (!ledSuit) return legal[Math.floor(Math.random() * legal.length)];
    return highest(legal);
  }

  if (difficulty === 'medium') {
    return playMedium(player, legal, trickCards, ledSuit, trump);
  }

  return playHard(player, legal, trickCards, ledSuit, trump, completedTricks);
}

function playMedium(player, legal, trickCards, ledSuit, trump) {
  const pts = trickCards.reduce((s, { card }) => s + CARD_POINTS[card.rank], 0);

  if (!ledSuit) return highest(legal);

  const winner = getCurrentWinner(trickCards, ledSuit, trump);
  const partnerWinning = winner && TEAMS[winner] === TEAMS[player];

  if (partnerWinning) return lowest(legal);

  const canBeat = legal.filter(c => canBeatWinner(c, trickCards, ledSuit, trump));
  if (canBeat.length && pts > 0) {
    return lowest(canBeat); // cheapest winning card
  }
  return lowest(legal);
}

function playHard(player, legal, trickCards, ledSuit, trump, completedTricks) {
  const pts = trickCards.reduce((s, { card }) => s + CARD_POINTS[card.rank], 0);

  if (!ledSuit) {
    // Lead: high cards early to flush trump
    const highCards = legal.filter(c => c.rank === 'J' || c.rank === '9');
    if (highCards.length && (completedTricks || []).length < 4) return highCards[0];
    return highest(legal);
  }

  const winner = getCurrentWinner(trickCards, ledSuit, trump);
  const partnerWinning = winner && TEAMS[winner] === TEAMS[player];

  if (partnerWinning && pts < 3) return lowest(legal);

  const canBeat = legal.filter(c => canBeatWinner(c, trickCards, ledSuit, trump));
  if (canBeat.length && (pts >= 3 || !partnerWinning)) {
    return lowest(canBeat);
  }
  return lowest(legal);
}
