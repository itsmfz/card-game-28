import {
  createDeck, shuffle, getDealOrder, dealCards, getTeam, PLAYERS_CCW, hasZeroPointCards,
} from './deck.js';
import { determineTrickWinner, getLegalCards, calculateTeamPoints, hasPair, trickPoints } from './scoring.js';
import { getAIBid, getAITrumpSelection, getAICardPlay } from './aiPlayer.js';
import { analyzeHand } from './analysisEngine.js';

const NEXT_CCW = { SOUTH: 'WEST', WEST: 'NORTH', NORTH: 'EAST', EAST: 'SOUTH' };

export const initialState = {
  phase: 'MENU', // MENU | DEAL_PHASE_1 | BIDDING | TRUMP_SELECT | DEAL_PHASE_2 | PLAY | SCORING | ANALYSIS
  difficulty: 'medium',
  gameScore: { A: 0, B: 0 },
  matchWinner: null,

  deck: [],
  dealer: 'EAST',
  dealOrder: [],

  hands: { SOUTH: [], NORTH: [], EAST: [], WEST: [] },
  initialHands: { SOUTH: [], NORTH: [], EAST: [], WEST: [] },

  biddingOrder: [],
  biddingIndex: 0,
  currentBid: 13,
  bidWinner: null,
  consecutivePasses: 0,
  bidHistory: [],
  canRedeal: false,

  trump: { suit: null, revealed: false },
  effectiveBid: 0,
  pairShown: null,

  trickNumber: 0,
  currentLeader: 'SOUTH',
  currentPlayer: 'SOUTH',
  currentTrick: [],
  ledSuit: null,
  completedTricks: [],
  trickHumanHands: [],

  aiThinking: false,
  trickResolving: null,
  message: '',
  handAnalysis: null,
};

function nextDealer(dealer) { return NEXT_CCW[dealer]; }

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_DIFFICULTY':
      return { ...state, difficulty: action.difficulty };

    case 'START_GAME':
      return startNewHand({ ...initialState, difficulty: state.difficulty });

    case 'NEW_HAND':
      return startNewHand({
        ...state,
        phase: 'DEAL_PHASE_1',
        handAnalysis: null,
        dealer: nextDealer(state.dealer),
      });

    case 'PLACE_BID':
      return handleBid(state, action.amount, 'SOUTH');

    case 'AI_BID':
      return doAIBid(state);

    case 'SELECT_TRUMP':
      return handleTrumpSelect(state, action.suit);

    case 'AI_SELECT_TRUMP':
      return doAITrumpSelect(state);

    case 'PLAY_CARD':
      return handlePlayCard(state, action.card, 'SOUTH');

    case 'AI_PLAY':
      return doAIPlay(state);

    case 'REVEAL_TRUMP':
      return {
        ...state,
        trump: { ...state.trump, revealed: true },
        message: `Trump revealed: ${state.trump.suit}`,
      };

    case 'SHOW_PAIR': {
      if (state.pairShown) return state;
      const team = getTeam('SOUTH');
      const bidderTeam = getTeam(state.bidWinner);
      const effect = team === bidderTeam ? -4 : +4;
      const newBid = Math.max(14, Math.min(28, state.effectiveBid + effect));
      return {
        ...state,
        pairShown: { team, effect },
        effectiveBid: newBid,
        message: effect < 0 ? `Pair shown! Your bid drops to ${newBid}.` : `Pair shown by opponents! Bid rises to ${newBid}.`,
      };
    }

    case 'REDEAL':
      return startNewHand({ ...state, dealer: state.dealer });

    case 'RESOLVE_TRICK': {
      const { trickResolving } = state;
      if (!trickResolving) return state;
      if (trickResolving.isFinal) {
        return scoreHand({ ...state, trickResolving: null, currentTrick: [], ledSuit: null });
      }
      return {
        ...state,
        trickResolving: null,
        currentTrick: [],
        ledSuit: null,
        trickNumber: state.trickNumber + 1,
        currentLeader: trickResolving.winner,
        currentPlayer: trickResolving.winner,
        aiThinking: trickResolving.winner !== 'SOUTH',
      };
    }

    case 'DISMISS_ANALYSIS':
      if (state.matchWinner) {
        return { ...initialState, difficulty: state.difficulty };
      }
      return gameReducer({ ...state, handAnalysis: null }, { type: 'NEW_HAND' });

    default:
      return state;
  }
}

// ─── helpers ────────────────────────────────────────────────────

function startNewHand(state) {
  const deck = shuffle(createDeck());
  const dealOrder = getDealOrder(state.dealer);
  const { hands, remaining } = dealCards(deck, dealOrder, 4);

  const biddingOrder = dealOrder; // first dealt = first to bid (player to dealer's right)
  const firstBidder = biddingOrder[0];

  const canRedeal = firstBidder === 'SOUTH' && hasZeroPointCards(hands['SOUTH']);

  const aiThinking = firstBidder !== 'SOUTH';

  return {
    ...state,
    phase: 'BIDDING',
    deck: remaining,
    dealOrder,
    hands,
    initialHands: { ...hands },
    biddingOrder,
    biddingIndex: 0,
    currentBid: 13,
    bidWinner: null,
    consecutivePasses: 0,
    bidHistory: [],
    canRedeal,
    trump: { suit: null, revealed: false },
    effectiveBid: 0,
    pairShown: null,
    trickNumber: 0,
    currentLeader: 'SOUTH',
    currentPlayer: firstBidder,
    currentTrick: [],
    ledSuit: null,
    completedTricks: [],
    trickHumanHands: [],
    aiThinking,
    trickResolving: null,
    message: canRedeal ? 'No point cards — you may request a redeal.' : '',
    handAnalysis: null,
  };
}

function handleBid(state, amount, player) {
  if (state.currentPlayer !== player) return state;

  const newHistory = [...state.bidHistory, { player, action: amount === 'PASS' ? 'PASS' : 'BID', amount }];
  const lastThree = newHistory.slice(-3);
  // Require all 4 players have had at least one turn before ending
  const biddingOver = newHistory.length >= 4 && lastThree.length === 3 && lastThree.every(e => e.action === 'PASS');

  const newBidWinner = amount !== 'PASS' ? player : state.bidWinner;
  const newCurrentBid = amount !== 'PASS' ? amount : state.currentBid;
  const newConsec = amount !== 'PASS' ? 0 : state.consecutivePasses + 1;

  const nextIndex = state.biddingIndex + 1;
  const nextBidder = state.biddingOrder[nextIndex % 4];
  const message = amount === 'PASS' ? `${player} passes.` : `${player} bids ${amount}.`;

  if (biddingOver) {
    return endBidding({ ...state, bidWinner: newBidWinner, effectiveBid: newCurrentBid, bidHistory: newHistory, message });
  }

  return {
    ...state,
    currentBid: newCurrentBid,
    bidWinner: newBidWinner,
    consecutivePasses: newConsec,
    bidHistory: newHistory,
    biddingIndex: nextIndex,
    currentPlayer: nextBidder,
    aiThinking: nextBidder !== 'SOUTH',
    message,
  };
}

function endBidding(state) {
  if (!state.bidWinner) {
    // Everyone passed → redeal
    return startNewHand({ ...state, dealer: nextDealer(state.dealer) });
  }
  return {
    ...state,
    phase: 'TRUMP_SELECT',
    currentPlayer: state.bidWinner,
    aiThinking: state.bidWinner !== 'SOUTH',
    message: `${state.bidWinner} won bid at ${state.effectiveBid}. Select trump.`,
  };
}

function doAIBid(state) {
  const player = state.currentPlayer;
  const hand = state.hands[player];
  const bid = getAIBid(hand, state.currentBid, state.difficulty);
  return handleBid(state, bid, player);
}

function handleTrumpSelect(state, suit) {
  // Deal phase 2
  const { hands: newCards, remaining } = dealCards(state.deck, state.dealOrder, 4);
  const mergedHands = {};
  for (const p of PLAYERS_CCW) {
    mergedHands[p] = [...state.hands[p], ...newCards[p]];
  }

  const firstLeader = state.bidWinner; // bidder leads first trick

  return {
    ...state,
    phase: 'PLAY',
    deck: remaining,
    hands: mergedHands,
    trump: { suit, revealed: false },
    effectiveBid: state.effectiveBid || state.currentBid,
    trickNumber: 1,
    currentLeader: firstLeader,
    currentPlayer: firstLeader,
    trickHumanHands: [mergedHands['SOUTH']],
    aiThinking: firstLeader !== 'SOUTH',
    message: `Trump selected (hidden). ${firstLeader} leads trick 1.`,
    canRedeal: false,
  };
}

function doAITrumpSelect(state) {
  const suit = getAITrumpSelection(state.hands[state.bidWinner]);
  return handleTrumpSelect(state, suit);
}

function handlePlayCard(state, card, player) {
  if (state.currentPlayer !== player) return state;
  if (state.trickResolving) return state;
  const hand = state.hands[player].filter(c => c.id !== card.id);
  const isFirstCard = state.currentTrick.length === 0;
  const ledSuit = isFirstCard ? card.suit : state.ledSuit;

  // Trump reveal: played trump when leading (explicit lead), or can't follow led suit
  let trump = state.trump;
  if (!trump.revealed && card.suit === trump.suit) {
    if (isFirstCard) {
      // Leading with trump forces reveal
      trump = { ...trump, revealed: true };
    } else {
      // Can't follow led suit and played trump
      const hadLedSuit = state.hands[player].some(c => c.suit === ledSuit && c.id !== card.id);
      if (!hadLedSuit) trump = { ...trump, revealed: true };
    }
  }

  const newTrick = [...state.currentTrick, { player, card }];
  const newHands = { ...state.hands, [player]: hand };

  if (newTrick.length === 4) {
    // Trick complete — pause to show all 4 cards; RESOLVE_TRICK will advance
    const winner = determineTrickWinner(newTrick, ledSuit, trump);
    const pts = trickPoints(newTrick);
    const completedTrick = {
      cards: newTrick,
      winner,
      points: pts,
      trickNumber: state.trickNumber,
      ledSuit,
      trumpRevealed: trump.revealed,
      humanHand: state.hands['SOUTH'],
    };
    const completedTricks = [...state.completedTricks, completedTrick];
    const trickHumanHands = [...state.trickHumanHands, newHands['SOUTH']];

    return {
      ...state,
      trump,
      hands: newHands,
      currentTrick: newTrick,
      ledSuit,
      completedTricks,
      trickHumanHands,
      trickResolving: {
        winner,
        trickNumber: state.trickNumber,
        isFinal: state.trickNumber === 8,
      },
      message: `${winner} wins trick ${state.trickNumber} (${pts}pt${pts !== 1 ? 's' : ''}).`,
    };
  }

  // Trick continues
  const nextPlayer = NEXT_CCW[player];
  return {
    ...state,
    trump,
    hands: newHands,
    currentTrick: newTrick,
    ledSuit,
    currentPlayer: nextPlayer,
    aiThinking: nextPlayer !== 'SOUTH',
    message: '',
  };
}

function doAIPlay(state) {
  const player = state.currentPlayer;
  const hand = state.hands[player];
  const card = getAICardPlay(
    player, hand, state.currentTrick, state.ledSuit, state.trump,
    state.difficulty, state.completedTricks
  );
  return handlePlayCard(state, card, player);
}

function scoreHand(state) {
  const teamPoints = calculateTeamPoints(state.completedTricks);
  const bidderTeam = getTeam(state.bidWinner);
  const otherTeam = bidderTeam === 'A' ? 'B' : 'A';
  const madeBid = teamPoints[bidderTeam] >= state.effectiveBid;

  const newScore = { ...state.gameScore };
  if (madeBid) newScore[bidderTeam]++;
  else newScore[otherTeam]++;

  const matchWinner = newScore.A >= 6 ? 'A' : newScore.B >= 6 ? 'B' : null;

  // Build analysis history
  const historyTricks = state.completedTricks.map((t, i) => ({
    ...t,
    humanHand: state.trickHumanHands[i] || [],
  }));

  const handHistory = {
    initialHand: state.initialHands['SOUTH'],
    bid: state.effectiveBid,
    trumpSuit: state.trump.suit,
    tricks: historyTricks,
    teamPoints,
    bidWinner: state.bidWinner,
    effectiveBid: state.effectiveBid,
    pairShown: state.pairShown,
  };

  const handAnalysis = analyzeHand(handHistory);

  return {
    ...state,
    phase: 'ANALYSIS',
    gameScore: newScore,
    matchWinner,
    aiThinking: false,
    handAnalysis,
    message: madeBid
      ? `${bidderTeam} made the bid! (${teamPoints[bidderTeam]}/${state.effectiveBid})`
      : `${bidderTeam} missed the bid. Opponents score.`,
  };
}
