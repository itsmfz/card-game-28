import { useState } from 'react';
import { handPoints } from '../logic/scoring.js';
import { CARD_POINTS } from '../logic/deck.js';

export default function BidPanel({ currentBid, bidHistory, hand4, canRedeal, onBid, onRedeal, isHumanTurn }) {
  const [bidAmount, setBidAmount] = useState(Math.max(14, currentBid + 1));
  const minBid = currentBid + 1;

  const pts = hand4 ? handPoints(hand4) : 0;
  const pointCards = hand4 ? hand4.filter(c => CARD_POINTS[c.rank] > 0) : [];

  return (
    <div style={wrap}>
      <div style={title}>BIDDING</div>

      <div style={infoRow}>
        <span style={mono}>Current bid: <b>{currentBid === 13 ? '—' : currentBid}</b></span>
        <span style={mono}>Your hand: <b>{pts}pts</b></span>
      </div>

      {pointCards.length > 0 && (
        <div style={{ fontSize: 11, color: '#666', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
          {pointCards.map(c => `${c.rank}${c.suit}(${CARD_POINTS[c.rank]})`).join(' ')}
        </div>
      )}

      <div style={history}>
        {bidHistory.slice(-6).map((b, i) => (
          <span key={i} style={{ color: b.action === 'PASS' ? '#555' : '#e8ff47', marginRight: 8, fontSize: 11 }}>
            {b.player}: {b.action === 'PASS' ? 'PASS' : b.amount}
          </span>
        ))}
      </div>

      {isHumanTurn && (
        <div style={controls}>
          <div style={stepper}>
            <button style={stepBtn} onClick={() => setBidAmount(v => Math.max(minBid, v - 1))}>−</button>
            <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: '#e8ff47', minWidth: 48, textAlign: 'center' }}>
              {bidAmount}
            </span>
            <button style={stepBtn} onClick={() => setBidAmount(v => Math.min(28, v + 1))}>+</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={bidBtn} onClick={() => { onBid(bidAmount); setBidAmount(Math.max(minBid, bidAmount + 1)); }}>
              BID {bidAmount}
            </button>
            <button style={passBtn} onClick={() => onBid('PASS')}>PASS</button>
          </div>
          {canRedeal && (
            <button style={redealBtn} onClick={onRedeal}>REQUEST REDEAL</button>
          )}
        </div>
      )}

      {!isHumanTurn && (
        <div style={{ color: '#666', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, marginTop: 8 }}>
          AI bidding...
        </div>
      )}
    </div>
  );
}

const wrap = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: 8,
  padding: 16,
  minWidth: 240,
};
const title = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  letterSpacing: 3,
  color: '#e8ff47',
  marginBottom: 10,
};
const infoRow = { display: 'flex', gap: 16, marginBottom: 6 };
const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#aaa' };
const history = { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12, minHeight: 20 };
const controls = { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' };
const stepper = { display: 'flex', alignItems: 'center', gap: 12 };
const stepBtn = {
  background: '#1a1a1a', border: '1px solid #333', color: '#aaa', width: 28, height: 28,
  borderRadius: 4, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const bidBtn = {
  background: '#e8ff47', color: '#0a0a0a', border: 'none', borderRadius: 4,
  padding: '8px 16px', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900, fontSize: 14, letterSpacing: 2,
};
const passBtn = {
  background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: 4,
  padding: '8px 16px', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700, fontSize: 14, letterSpacing: 2,
};
const redealBtn = {
  background: 'transparent', color: '#e8474e', border: '1px solid #e8474e', borderRadius: 4,
  padding: '6px 12px', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700, fontSize: 11, letterSpacing: 2, marginTop: 4,
};
