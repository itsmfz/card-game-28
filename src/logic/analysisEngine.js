import { CARD_POINTS, RANK_VALUE } from './deck.js';
import { getLegalCards, handPoints, trickPoints, beatsCard, calculateOptimalBid, hasPair } from './scoring.js';

const TRICK_TIPS = {
  missed_win: (n, card, alt, pts) =>
    `Trick ${n}: You played ${card.rank}${card.suit}. ${alt.rank}${alt.suit} would have won and captured ${pts}pts.`,
  wasted_trump: (n, pts) =>
    `Trick ${n}: You trumped for only ${pts}pt${pts === 1 ? '' : 's'}. Saving trump for higher-value tricks is usually better.`,
  good_dump: (n) =>
    `Trick ${n}: Smart discard — correctly avoided winning a low-value trick.`,
  pair_missed: () =>
    `You held the trump pair (K+Q) but never showed it. Showing it would have reduced your bid target by 4.`,
  bid_high: (actual, optimal) =>
    `You overbid by ${actual - optimal}. Optimal range was ${optimal - 1}–${optimal} based on your opening hand.`,
  bid_low: (bid, won) =>
    `You could have bid higher — your team won ${won}pts vs your bid of ${bid}.`,
};

function simulateTrickOutcome(humanCard, trickCards, ledSuit, trump) {
  const all = [...trickCards, { player: 'SOUTH', card: humanCard }];
  let winner = all[0];
  for (const e of all.slice(1)) {
    if (beatsCard(e.card, winner.card, ledSuit, trump)) winner = e;
  }
  return winner.player === 'SOUTH';
}

export function analyzeHand(history) {
  if (!history) return null;

  const {
    initialHand,
    bid,
    trumpSuit,
    tricks,
    teamPoints,
    bidWinner,
    effectiveBid,
    pairShown,
  } = history;

  const flags = [];
  let goodPlays = 0;
  let totalDecisions = 0;

  // 1. Bid accuracy
  const optimalBid = calculateOptimalBid(initialHand);
  const bidDiff = bid - optimalBid;

  if (bidWinner === 'SOUTH') {
    if (bidDiff > 2) {
      flags.push({ type: 'bid', text: TRICK_TIPS.bid_high(bid, optimalBid) });
    } else if (bidDiff < -3 && teamPoints.A > bid + 2) {
      flags.push({ type: 'bid', text: TRICK_TIPS.bid_low(bid, teamPoints.A) });
    }
  }

  // 2. Trick decisions
  for (const trick of tricks) {
    const humanEntry = trick.cards.find(e => e.player === 'SOUTH');
    if (!humanEntry) continue;

    totalDecisions++;
    const pts = trickPoints(trick.cards);
    const humanWon = trick.winner === 'SOUTH';

    // Check if human played trump when trick was low value
    if (humanEntry.card.suit === trumpSuit && !trick.ledSuit.match(trumpSuit) && pts <= 1) {
      flags.push({ type: 'trick', text: TRICK_TIPS.wasted_trump(trick.trickNumber, pts) });
      continue;
    }

    // Check if a different card would have won and been worth it
    if (!humanWon && pts >= 2 && trick.humanHand) {
      const otherCards = trick.humanHand.filter(c => c.id !== humanEntry.card.id);
      const legal = getLegalCards(otherCards, trick.ledSuit);
      const betterAlts = legal.filter(c =>
        simulateTrickOutcome(c, trick.cards.filter(e => e.player !== 'SOUTH'), trick.ledSuit, { suit: trumpSuit, revealed: trick.trumpRevealed })
      );

      if (betterAlts.length) {
        const best = betterAlts.sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank])[0];
        flags.push({
          type: 'trick',
          text: TRICK_TIPS.missed_win(trick.trickNumber, humanEntry.card, best, pts),
        });
      } else {
        goodPlays++;
      }
    } else if (humanWon || pts < 2) {
      goodPlays++;
    }
  }

  // 3. Pair awareness
  const finalHandWithTrump = tricks.length ? tricks[0].humanHand : [];
  if (trumpSuit && finalHandWithTrump.length && hasPair(finalHandWithTrump, trumpSuit)) {
    if (!pairShown || pairShown.team !== 'A') {
      flags.push({ type: 'pair', text: TRICK_TIPS.pair_missed() });
    }
  }

  // Grade
  const optimalRatio = totalDecisions > 0 ? goodPlays / totalDecisions : 1;
  const madeBid = bidWinner === 'SOUTH' && teamPoints.A >= effectiveBid;

  let grade;
  if (!flags.some(f => f.type === 'bid') && optimalRatio >= 0.75) grade = 'A';
  else if (Math.abs(bidDiff) <= 2 && optimalRatio >= 0.5) grade = 'B';
  else if (Math.abs(bidDiff) <= 4 && optimalRatio >= 0.35) grade = 'C';
  else if (!madeBid && bidWinner === 'SOUTH') grade = 'D';
  else grade = flags.length > 3 ? 'D' : 'C';

  return {
    grade,
    flags,
    optimalBid,
    actualBid: bid,
    teamPoints,
    effectiveBid,
    madeBid,
    goodPlays,
    totalDecisions,
  };
}
