import { motion } from 'framer-motion';

export default function ScoreTracker({ gameScore, matchWinner }) {
  return (
    <div style={wrap}>
      <Team label="TEAM A (You+N)" score={gameScore.A} winner={matchWinner === 'A'} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: '#666', fontSize: 12, alignSelf: 'center' }}>vs</div>
      <Team label="TEAM B (E+W)" score={gameScore.B} winner={matchWinner === 'B'} />
    </div>
  );
}

function Team({ label, score, winner }) {
  return (
    <div style={teamWrap(winner)}>
      <div style={{ fontSize: 10, color: '#666', letterSpacing: 1, marginBottom: 4, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Pip key={i} filled={i < score} />
        ))}
      </div>
      {winner && <div style={{ color: '#e8ff47', fontSize: 10, marginTop: 4, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>WINNER</div>}
    </div>
  );
}

function Pip({ filled }) {
  return (
    <motion.div
      key={filled ? 'filled' : 'empty'}
      style={{
        width: 10, height: 10, borderRadius: '50%',
        background: filled ? '#e8ff47' : 'transparent',
        border: `1px solid ${filled ? '#e8ff47' : '#444'}`,
      }}
      initial={filled ? { scale: 0.4, opacity: 0 } : {}}
      animate={filled ? { scale: [0.4, 1.5, 1], opacity: 1 } : {}}
      transition={filled ? { duration: 0.6, ease: 'easeOut' } : {}}
    />
  );
}

const wrap = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  background: '#111',
  border: '1px solid #222',
  borderRadius: 6,
  padding: '8px 12px',
};

const teamWrap = (winner) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '4px 8px',
  border: `1px solid ${winner ? '#e8ff47' : 'transparent'}`,
  borderRadius: 4,
  transition: 'border-color 0.3s ease',
});
