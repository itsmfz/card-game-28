import { motion } from 'framer-motion';

// ♥/♦ red, ♠/♣ near-black — always contrast against off-white bg
const SUIT_COLOR = {
  '♥': '#dc2020',
  '♦': '#dc2020',
  '♠': '#0a0a0a',
  '♣': '#0a0a0a',
};

export default function CardComponent({ card, playable, selected, onClick, faceDown, small, large, style }) {
  const w = small ? 38 : large ? 90 : 72;
  const h = small ? 54 : large ? 130 : 100;

  // ── Face-down ────────────────────────────────────────────────
  if (faceDown || !card) {
    return (
      <motion.div
        style={{
          width: w, height: h,
          background: '#1c1c2e',
          border: '1px solid #333',
          borderRadius: 5,
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
          ...style,
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Diagonal stripe back pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'repeating-linear-gradient(45deg, #252540 0px, #252540 3px, #1c1c2e 3px, #1c1c2e 9px)',
        }} />
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px solid #3a3a5a',
          borderRadius: 3,
        }} />
      </motion.div>
    );
  }

  // ── Face-up ──────────────────────────────────────────────────
  const color = SUIT_COLOR[card.suit] || '#1a1a1a';
  const rankFs = small ? 11 : large ? 20 : 15;
  const suitFs = small ? 9 : large ? 15 : 12;
  const centerFs = small ? 16 : large ? 40 : 30;

  return (
    <motion.div
      className={`card${playable ? ' card-playable' : ''}${selected ? ' card-selected' : ''}`}
      style={{
        width: w, height: h,
        background: '#f5f0e8',
        border: selected ? '2px solid #e8ff47' : '1px solid #ccc0b0',
        borderRadius: 5,
        flexShrink: 0,
        position: 'relative',
        userSelect: 'none',
        cursor: playable ? 'pointer' : 'default',
        willChange: 'transform',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        ...style,
      }}
      onClick={playable ? onClick : undefined}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={playable ? { y: -8 } : {}}
      whileTap={playable ? { scale: 0.96 } : {}}
      layout
    >
      {/* Top-left corner */}
      <div style={{
        position: 'absolute', top: 3, left: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        lineHeight: 1,
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', monospace, sans-serif",
          fontWeight: 700,
          fontSize: rankFs,
          color,
          lineHeight: 1,
        }}>{card.rank}</span>
        <span style={{
          fontSize: suitFs,
          color,
          lineHeight: 1,
          marginTop: 1,
        }}>{card.suit}</span>
      </div>

      {/* Center suit */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: centerFs,
        color,
        lineHeight: 1,
        pointerEvents: 'none',
      }}>{card.suit}</div>

      {/* Bottom-right corner (rotated 180°) */}
      <div style={{
        position: 'absolute', bottom: 3, right: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        transform: 'rotate(180deg)',
        lineHeight: 1,
      }}>
        <span style={{
          fontFamily: "'Barlow Condensed', monospace, sans-serif",
          fontWeight: 700,
          fontSize: rankFs,
          color,
          lineHeight: 1,
        }}>{card.rank}</span>
        <span style={{
          fontSize: suitFs,
          color,
          lineHeight: 1,
          marginTop: 1,
        }}>{card.suit}</span>
      </div>
    </motion.div>
  );
}
