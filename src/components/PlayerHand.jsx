import { motion, AnimatePresence } from 'framer-motion';
import CardComponent from './CardComponent.jsx';
import { getLegalCards } from '../logic/scoring.js';
import { CARD_POINTS } from '../logic/deck.js';

// Card sizes: North smaller to avoid overlap with trick table
const CW = 60, CH = 85;       // East/West
const CW_N = 55, CH_N = 78;   // North

// Rotation offsets for fans
const ROT_H = [-8, -5, -2, 2, 5, 8];  // North horizontal
const ROT_V = [-4, -2, 0, 2, 4, 2];   // East/West vertical

function AIHand({ hand, playerName, vertical }) {
  const count = hand.length || 0;
  const visible = Math.min(count, 6);
  const cw = vertical ? CW : CW_N;
  const ch = vertical ? CH : CH_N;

  if (vertical) {
    const OVERLAP = 18;
    const stackH = visible > 0 ? ch + (visible - 1) * OVERLAP : ch;
    return (
      <div style={aiWrap}>
        <div style={aiName}>{playerName}</div>
        <div style={{ position: 'relative', width: cw + 16, height: stackH, flexShrink: 0 }}>
          {Array.from({ length: visible }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: i * OVERLAP,
                left: 8,
                zIndex: i,
                transform: `rotate(${ROT_V[i] ?? 0}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <CardComponent faceDown small style={{ width: cw, height: ch }} />
            </div>
          ))}
        </div>
        <div style={countBadge}>{count}</div>
      </div>
    );
  }

  // NORTH: horizontal fan with rotation offsets
  const OVERLAP_H = 20;
  const fanW = visible > 0 ? cw + (visible - 1) * OVERLAP_H : cw;
  return (
    <div style={aiWrap}>
      <div style={aiName}>{playerName}</div>
      <div style={{ position: 'relative', height: ch + 16, width: fanW, flexShrink: 0 }}>
        {Array.from({ length: visible }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * OVERLAP_H,
              top: 8,
              zIndex: i,
              transform: `rotate(${ROT_H[i] ?? 0}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            <CardComponent faceDown small style={{ width: cw, height: ch }} />
          </div>
        ))}
      </div>
      <div style={countBadge}>{count}</div>
    </div>
  );
}

function HumanHand({ hand, ledSuit, phase, isHuman, onPlay }) {
  const legalIds = isHuman && phase === 'PLAY'
    ? getLegalCards(hand, ledSuit).map(c => c.id)
    : [];

  return (
    <div style={humanWrap}>
      <div style={humanCards}>
        <AnimatePresence>
          {hand.map((card, i) => {
            const pts = CARD_POINTS[card.rank];
            const playable = legalIds.includes(card.id);
            return (
              <motion.div
                key={card.id}
                layout
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, willChange: 'transform' }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <CardComponent
                  card={card}
                  large
                  playable={playable}
                  onClick={() => playable && onPlay(card)}
                />
                {pts > 0 ? (
                  <div style={ptsBadge}>{pts}pt{pts !== 1 ? 's' : ''}</div>
                ) : (
                  <div style={ptsBadgeDim}>—</div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <div style={youLabel}>
        YOU · SOUTH
        {isHuman && phase === 'PLAY' && (
          <span style={{ color: '#e8ff47', marginLeft: 8, fontSize: 9 }}>YOUR TURN</span>
        )}
      </div>
    </div>
  );
}

export default function PlayerHand({
  hand, ledSuit, phase, isHuman, onPlay, playerName, faceDown, vertical,
}) {
  if (faceDown) {
    return <AIHand hand={hand} playerName={playerName} vertical={vertical} />;
  }
  return (
    <HumanHand
      hand={hand}
      ledSuit={ledSuit}
      phase={phase}
      isHuman={isHuman}
      onPlay={onPlay}
    />
  );
}

// ─── styles ────────────────────────────────────────────────────

const aiWrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
};

const aiName = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 3,
  color: '#3a3a4a',
};

const countBadge = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: '#555',
  background: '#111',
  border: '1px solid #222',
  borderRadius: 3,
  padding: '2px 7px',
};

const humanWrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  minHeight: 170,
};

const humanCards = {
  display: 'flex',
  gap: 5,
  flexWrap: 'nowrap',
  justifyContent: 'center',
  minHeight: 130,
  alignItems: 'flex-end',
};

const ptsBadge = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  fontWeight: 700,
  color: '#e8ff47',
  background: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  padding: '2px 7px',
  letterSpacing: 0.5,
  lineHeight: 1,
  whiteSpace: 'nowrap',
};

const ptsBadgeDim = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: '#2a2a2a',
  lineHeight: 1,
  userSelect: 'none',
};

const youLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 3,
  color: '#555',
};
