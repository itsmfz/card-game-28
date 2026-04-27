import { motion, AnimatePresence } from 'framer-motion';

// Fixed: ♠/♣ use near-black on light card, ♥/♦ use red
const SUIT_COLOR = {
  '♥': '#dc2020',
  '♦': '#dc2020',
  '♠': '#0a0a0a',
  '♣': '#0a0a0a',
};

export default function TrumpReveal({
  trump, bidWinner, isHuman, onSelectTrump, onRevealTrump,
  phase, canShowPair, onShowPair,
}) {
  const SUITS = ['♠', '♥', '♦', '♣'];

  return (
    <div style={wrap}>
      <div style={label}>TRUMP</div>

      {/* ── Trump select (human picks suit) ───────── */}
      {phase === 'TRUMP_SELECT' && isHuman && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={hint}>Pick your trump suit (stays hidden)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SUITS.map(suit => (
              <button
                key={suit}
                style={suitBtn}
                onClick={() => onSelectTrump(suit)}
              >
                <span style={{ color: SUIT_COLOR[suit], fontSize: 28, lineHeight: 1, fontWeight: 700 }}>{suit}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'TRUMP_SELECT' && !isHuman && (
        <div style={hint}>{bidWinner} selecting trump…</div>
      )}

      {/* ── Play phase: show face-down or revealed card ── */}
      {phase === 'PLAY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <div style={{ perspective: 400 }}>
          <AnimatePresence mode="wait">
            {trump.revealed ? (
              <motion.div
                key="revealed"
                style={trumpCard}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              >
                <span style={{ color: SUIT_COLOR[trump.suit], fontSize: 28, lineHeight: 1 }}>
                  {trump.suit}
                </span>
                <span style={trumpLabel}>TRUMP</span>
              </motion.div>
            ) : (
              <motion.div key="hidden" style={hiddenCard}>
                <span style={hiddenLabel}>HIDDEN</span>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Bidder can reveal trump at any time */}
          {!trump.revealed && isHuman && (
            <button style={revealBtn} onClick={onRevealTrump}>REVEAL TRUMP</button>
          )}

          {/* Pair button (available after reveal or with revealed trump) */}
          {canShowPair && (
            <button style={pairBtn} onClick={onShowPair}>SHOW PAIR (±4)</button>
          )}
        </div>
      )}

      {/* Bid info */}
      {bidWinner && (
        <div style={bidInfo}>
          bid winner: <b style={{ color: bidWinner === 'SOUTH' ? '#e8ff47' : '#888' }}>
            {bidWinner === 'SOUTH' ? 'YOU' : bidWinner}
          </b>
        </div>
      )}
    </div>
  );
}

const wrap = {
  background: '#0e0e14',
  border: '1px solid #1a1a24',
  borderRadius: 8,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const label = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: 4,
  color: '#666',
};

const hint = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: '#999',
};

const suitBtn = {
  background: '#f5f0e8',
  border: '1px solid #c0b0a0',
  borderRadius: 6,
  width: 52,
  height: 52,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const trumpCard = {
  width: 54,
  height: 76,
  background: '#f5f0e8',
  border: '2px solid #e8ff47',
  borderRadius: 5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
};

const trumpLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 8,
  letterSpacing: 2,
  color: '#888',
};

const hiddenCard = {
  width: 54,
  height: 76,
  background: '#1c1c2e',
  border: '1px solid #2a2a40',
  borderRadius: 5,
  backgroundImage:
    'repeating-linear-gradient(45deg, #252540 0px, #252540 3px, #1c1c2e 3px, #1c1c2e 9px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const hiddenLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 8,
  letterSpacing: 2,
  color: '#3a3a5a',
};

const revealBtn = {
  background: 'transparent',
  color: '#e8ff47',
  border: '1px solid #e8ff47',
  borderRadius: 3,
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 2,
};

const pairBtn = {
  background: 'transparent',
  color: '#7fbc41',
  border: '1px solid #7fbc41',
  borderRadius: 3,
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 2,
};

const bidInfo = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: '#999',
  borderTop: '1px solid #1a1a24',
  paddingTop: 8,
};
