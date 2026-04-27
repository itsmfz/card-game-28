import { createDeck, shuffle, SUITS, RANKS, RANK_VALUE, CARD_POINTS, TEAMS } from './deck.js';
import { handPoints, calculateOptimalBid, getLegalCards, trickPoints, beatsCard } from './scoring.js';

// --- Bidding Trainer ---
export function generateBiddingScenario() {
  const deck = shuffle(createDeck());
  const hand = deck.slice(0, 4);
  const optimal = calculateOptimalBid(hand);
  const pts = handPoints(hand);
  return { hand, optimal, pts };
}

export function gradeBiddingAnswer(hand, answer, optimal) {
  const diff = Math.abs(answer - optimal);
  const pts = handPoints(hand);

  const pointCards = hand.filter(c => CARD_POINTS[c.rank] > 0);
  const breakdown = pointCards.map(c => `${c.rank}${c.suit}(${CARD_POINTS[c.rank]}pt)`).join(', ');

  let correct = diff <= 1;
  let feedback;

  if (diff === 0) {
    feedback = `Perfect. ${breakdown} = ${pts}pts → bid ${optimal} is spot-on.`;
  } else if (diff <= 1) {
    feedback = `Close. Optimal was ${optimal}. Your ${answer} is acceptable. ${breakdown} = ${pts}pts.`;
  } else if (answer > optimal) {
    feedback = `Overbid by ${diff}. With only ${pts} point cards (${breakdown}), ${optimal} was safer.`;
  } else {
    feedback = `Underbid by ${diff}. ${breakdown} = ${pts}pts supports bidding up to ${optimal}.`;
  }

  return { correct, feedback, optimal };
}

// --- Trump Timing Trainer ---
export function generateTrumpTimingScenario() {
  const deck = shuffle(createDeck());
  const trumpSuit = SUITS[Math.floor(Math.random() * 4)];

  // Build a hand without following suit for led card
  const ledSuit = SUITS.filter(s => s !== trumpSuit)[Math.floor(Math.random() * 3)];
  const hand = deck
    .filter(c => c.suit !== ledSuit)
    .slice(0, 5);

  // Build partial trick (2 cards already played, neither is trump)
  const trickDeck = deck.filter(c =>
    !hand.find(h => h.id === c.id) && c.suit === ledSuit
  );
  const trickCards = [
    { player: 'WEST', card: trickDeck[0] },
    { player: 'NORTH', card: trickDeck[1] },
  ];

  const pts = trickPoints(trickCards);
  const hasTrump = hand.some(c => c.suit === trumpSuit);

  const correctPlay = pts >= 3 && hasTrump ? 'trump' : 'dump';
  const reason = correctPlay === 'trump'
    ? `Trick worth ${pts}pt${pts !== 1 ? 's' : ''} — worth spending trump.`
    : `Only ${pts}pt${pts !== 1 ? 's' : ''} at stake. Save trump for higher-value tricks.`;

  return { hand, trickCards, ledSuit, trumpSuit, pts, hasTrump, correctPlay, reason };
}

export function gradeTrumpTimingAnswer(answer, scenario) {
  const correct = answer === scenario.correctPlay;
  return {
    correct,
    feedback: correct
      ? `Correct. ${scenario.reason}`
      : `Not ideal. ${scenario.reason}`,
  };
}

// --- Trick Tactics Trainer ---
export function generateTrickTacticsScenario() {
  const deck = shuffle(createDeck());
  const trumpSuit = SUITS[Math.floor(Math.random() * 4)];
  const ledSuit = SUITS.filter(s => s !== trumpSuit)[Math.floor(Math.random() * 3)];

  // 3 cards already played (by AI players)
  const aiCards = deck.filter(c => c.suit === ledSuit).slice(0, 3);
  const trickCards = [
    { player: 'WEST', card: aiCards[0] },
    { player: 'NORTH', card: aiCards[1] },
    { player: 'EAST', card: aiCards[2] },
  ];

  // Human hand: 4 cards, mixed (some can follow, some can't)
  const excluded = new Set(aiCards.map(c => c.id));
  const hand = deck
    .filter(c => !excluded.has(c.id))
    .slice(0, 4);

  const trump = { suit: trumpSuit, revealed: true };
  const legal = getLegalCards(hand, ledSuit);
  const pts = trickPoints(trickCards);

  // Evaluate each legal card
  const options = legal.map(card => {
    const allCards = [...trickCards, { player: 'SOUTH', card }];
    let winner = allCards[0];
    for (const e of allCards.slice(1)) {
      if (beatsCard(e.card, winner.card, ledSuit, trump)) winner = e;
    }
    const wins = winner.player === 'SOUTH';
    const cardPts = CARD_POINTS[card.rank];
    return { card, wins, pts: wins ? pts + cardPts : cardPts, score: wins ? pts + cardPts + 2 : -cardPts };
  });

  const best = [...options].sort((a, b) => b.score - a.score)[0];

  return { hand, trickCards, ledSuit, trumpSuit, pts, legal, options, bestCard: best.card };
}

export function gradeTrickTacticsAnswer(played, scenario) {
  const { options, bestCard, pts } = scenario;
  const trump = { suit: scenario.trumpSuit, revealed: true };

  const playedOption = options.find(o => o.card.id === played.id);
  const bestOption = options.find(o => o.card.id === bestCard.id);
  const correct = played.id === bestCard.id || (playedOption && playedOption.score === bestOption.score);

  let feedback;
  if (correct) {
    feedback = bestOption.wins
      ? `Best play. ${played.rank}${played.suit} wins this trick (+${pts}pts total).`
      : `Smart discard — ${played.rank}${played.suit} saves your strong cards.`;
  } else {
    feedback = bestOption.wins
      ? `${bestCard.rank}${bestCard.suit} would win this trick capturing ${pts}pts. ${played.rank}${played.suit} ${playedOption?.wins ? 'also wins but costs more' : 'loses'}.`
      : `Better to dump ${bestCard.rank}${bestCard.suit} (0pts) and save your power cards.`;
  }

  return { correct, feedback };
}
