import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardComponent from './CardComponent.jsx';

const WINNER_DIR = {
  NORTH: { x: 0,   y: -80 },
  SOUTH: { x: 0,   y:  80 },
  EAST:  { x: 80,  y:   0 },
  WEST:  { x: -80, y:   0 },
};

export default function TrickArea({ currentTrick, ledSuit, trump, lastTrickWinner, trickNumber, trickResolving }) {
  const byPlayer = {};
  for (const { player, card } of currentTrick) byPlayer[player] = card;

  const [winnerDir, setWinnerDir] = useState(null);
  const clearRef = useRef(null);
  useEffect(() => {
    if (trickResolving) {
      clearTimeout(clearRef.current);
      setWinnerDir(WINNER_DIR[trickResolving.winner]);
    } else {
      clearRef.current = setTimeout(() => setWinnerDir(null), 1000);
    }
    return () => clearTimeout(clearRef.current);
  }, [trickResolving]);

  // Flash yellow border when trump is newly revealed
  const [trumpFlash, setTrumpFlash] = useState(false);
  const prevRevealed = useRef(false);
  useEffect(() => {
    if (trump.revealed && !prevRevealed.current) {
      setTrumpFlash(true);
      const t = setTimeout(() => setTrumpFlash(false), 600);
      return () => clearTimeout(t);
    }
    prevRevealed.current = trump.revealed;
  }, [trump.revealed]);

  const resolving = !!trickResolving;
  const winner = trickResolving?.winner;

  return (
    <div style={wrap}>
      {/* Trump status badge — absolute, top-right, never overlaps player zones */}
      <AnimatePresence mode="wait">
        {trump.suit && (
          trump.revealed ? (
            <motion.span
              key="revealed"
              style={{
                ...trumpBadge,
                color: '#e8ff47',
                border: trumpFlash ? '2px solid #e8ff47' : '1px solid #e8ff47',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              trump {trump.suit}
            </motion.span>
          ) : (
            <motion.span
              key="hidden"
              style={{ ...trumpBadge, color: '#555', border: '1px solid #2a2a35' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              trump hidden
            </motion.span>
          )
        )}
      </AnimatePresence>

      {/* Info strip — trick number, led suit, winner flash only */}
      <div style={infoRow}>
        <span style={trickLabel}>TRICK {trickNumber}</span>
        {ledSuit && <span style={chip}>led {ledSuit}</span>}
        <AnimatePresence>
          {resolving && winner && (
            <motion.span
              key="winner-flash"
              style={{ ...chip, color: '#e8ff47', borderColor: '#e8ff47', fontWeight: 700 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {winner === 'SOUTH' ? 'YOU WIN' : `${winner} WINS`}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* 3×3 CSS grid */}
      <div style={grid}>
        <div style={cell(1, 2)}><Slot card={byPlayer.NORTH} label="N" winnerDir={winnerDir} /></div>
        <div style={cell(2, 1)}><Slot card={byPlayer.WEST}  label="W" winnerDir={winnerDir} /></div>
        <div style={cell(2, 2)}>
          {currentTrick.length === 0 && lastTrickWinner && (
            <div style={leadMsg}>
              {lastTrickWinner === 'SOUTH' ? 'YOU LEAD' : `${lastTrickWinner} LEADS`}
            </div>
          )}
          {currentTrick.length === 0 && !lastTrickWinner && (
            <div style={leadMsg}>WAITING</div>
          )}
        </div>
        <div style={cell(2, 3)}><Slot card={byPlayer.EAST}  label="E" winnerDir={winnerDir} /></div>
        <div style={cell(3, 2)}><Slot card={byPlayer.SOUTH} label="YOU" you winnerDir={winnerDir} /></div>
      </div>
    </div>
  );
}

function Slot({ card, label, you, winnerDir }) {
  const exitAnim = winnerDir
    ? { opacity: 0, x: winnerDir.x, y: winnerDir.y, transition: { duration: 0.8, ease: 'easeIn' } }
    : { opacity: 0, scale: 0.5, transition: { duration: 0.2 } };

  return (
    <div style={slotWrap}>
      <div style={{ ...slotLabel, color: you ? '#e8ff47' : '#3a3a4a' }}>{label}</div>
      <div style={cardHolder}>
        <AnimatePresence mode="wait">
          {card ? (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.65, y: you ? 12 : -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={exitAnim}
              transition={{ duration: 0.5 }}
            >
              <CardComponent card={card} />
            </motion.div>
          ) : (
            <motion.div key="empty" style={emptySlot} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────

const wrap = {
  background: '#0d0d10',
  border: '1px solid #1e1e28',
  borderRadius: 12,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  position: 'relative',
};

const trumpBadge = {
  position: 'absolute',
  top: 8,
  right: 8,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  borderRadius: 3,
  padding: '2px 6px',
  pointerEvents: 'none',
};

const infoRow = {
  display: 'flex',
  gap: 6,
  alignItems: 'center',
  flexWrap: 'wrap',
  alignSelf: 'flex-start',
  paddingRight: 90,
};

const trickLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 900,
  fontSize: 13,
  letterSpacing: 4,
  color: '#2e2e3a',
};

const chip = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: '#555',
  border: '1px solid #2a2a35',
  borderRadius: 3,
  padding: '1px 5px',
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '90px 80px 90px',
  gridTemplateRows: '110px 80px 110px',
  gap: 6,
};

const cell = (row, col) => ({
  gridRow: row,
  gridColumn: col,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const slotWrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
};

const slotLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 2,
};

const cardHolder = {
  width: 72,
  height: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const emptySlot = {
  width: 72,
  height: 100,
  border: '1px dashed #1e1e28',
  borderRadius: 5,
};

const leadMsg = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 2,
  color: '#2a2a3a',
  textAlign: 'center',
  lineHeight: 1.4,
};
