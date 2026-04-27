import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GRADE_COLOR = { A: '#e8ff47', B: '#7fbc41', C: '#f0a000', D: '#e8474e', F: '#e8474e' };
const FLAG_ICON = { bid: '💡', trick: '🃏', pair: '♦' };

function deriveHandWinner(message) {
  if (!message) return null;
  if (/^A made/.test(message)) return 'A';
  if (/^B made/.test(message)) return 'B';
  if (/^A missed/.test(message)) return 'B';
  if (/^B missed/.test(message)) return 'A';
  return null;
}

export default function AnalysisOverlay({ analysis, gameScore, matchWinner, message, onContinue }) {
  if (!analysis) return null;

  const handWinner = deriveHandWinner(message);
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    setBannerVisible(true);
    const t = setTimeout(() => setBannerVisible(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        style={backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Hand result banner — slides down, stays, slides back up */}
        <AnimatePresence>
          {bannerVisible && handWinner && (
            <motion.div
              style={banner}
              initial={{ y: -80 }}
              animate={{ y: 0 }}
              exit={{ y: -80 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              {matchWinner
                ? `TEAM ${matchWinner} WINS THE MATCH`
                : `TEAM ${handWinner} WINS THE HAND · +1 GAME POINT`}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          style={panel}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={header}>
            <div style={headerText}>HAND ANALYSIS</div>
            <div style={{
              width: 120, height: 120,
              border: `2px solid ${GRADE_COLOR[analysis.grade] || '#aaa'}`,
              borderRadius: 8,
              background: 'transparent',
              boxShadow: '0 0 40px rgba(232,255,71,0.25)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 2,
            }}>
              <div style={{ ...grade, color: GRADE_COLOR[analysis.grade] || '#aaa' }}>
                {analysis.grade}
              </div>
              <div style={gradeLabel}>GRADE</div>
            </div>
          </div>

          <div style={result}>
            {message}
          </div>

          <div style={statsRow}>
            <Stat label="YOUR BID" value={analysis.actualBid} />
            <Stat label="OPTIMAL" value={`${analysis.optimalBid - 1}–${analysis.optimalBid}`} />
            <Stat label="TEAM A PTS" value={analysis.teamPoints?.A ?? '—'} />
            <Stat label="TEAM B PTS" value={analysis.teamPoints?.B ?? '—'} />
            <Stat label="DECISIONS" value={`${analysis.goodPlays}/${analysis.totalDecisions}`} />
          </div>

          <div style={flagsSection}>
            {analysis.flags.length === 0 ? (
              <div style={noFlags}>Clean hand. No major mistakes detected.</div>
            ) : (
              analysis.flags.map((flag, i) => (
                <motion.div
                  key={i}
                  style={flagItem}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                >
                  <span style={{ fontSize: 14 }}>{FLAG_ICON[flag.type] || '●'}</span>
                  <span style={flagText}>{flag.text}</span>
                </motion.div>
              ))
            )}
          </div>

          <div style={scoreSection}>
            <div style={scoreLabel}>MATCH SCORE</div>
            <div style={scoreRow}>
              <PipRow label="A (You+N)" score={gameScore.A} winner={matchWinner === 'A'} />
              <PipRow label="B (E+W)" score={gameScore.B} winner={matchWinner === 'B'} />
            </div>
          </div>

          <button style={continueBtn} onClick={onContinue}>
            {matchWinner ? 'MATCH OVER — NEW GAME' : 'NEXT HAND →'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value }) {
  return (
    <div style={statBox}>
      <div style={statLabel}>{label}</div>
      <div style={statValue}>{value}</div>
    </div>
  );
}

function PipRow({ label, score, winner }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 9, color: '#555', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: i < score ? (winner ? '#e8ff47' : '#7fbc41') : 'transparent',
              border: `1px solid ${i < score ? '#e8ff47' : '#333'}`,
            }}
            initial={i < score ? { scale: 0.5, opacity: 0 } : {}}
            animate={i < score ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: i * 0.13, duration: 0.3, type: 'spring', stiffness: 280 }}
          />
        ))}
      </div>
      {winner && <div style={{ color: '#e8ff47', fontSize: 9, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>WINNER</div>}
    </div>
  );
}

const banner = {
  position: 'fixed',
  top: 0, left: '50%',
  transform: 'translateX(-50%)',
  background: '#e8ff47',
  color: '#0a0a0a',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  letterSpacing: 4,
  padding: '14px 36px',
  borderRadius: '0 0 12px 12px',
  zIndex: 200,
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 32px rgba(232,255,71,0.3)',
};

const backdrop = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.88)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100,
  backdropFilter: 'blur(4px)',
};
const panel = {
  background: '#0f0f0f',
  border: '1px solid #222',
  borderRadius: 12,
  padding: 32,
  maxWidth: 560,
  width: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const headerText = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900, fontSize: 24, letterSpacing: 4, color: '#fff',
};
const grade = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900, fontSize: 96, lineHeight: 1,
};
const gradeLabel = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700, fontSize: 11, letterSpacing: 3, color: '#888',
};
const result = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12, color: '#aaa',
  borderLeft: '2px solid #222', paddingLeft: 12,
};
const statsRow = { display: 'flex', gap: 12, flexWrap: 'wrap' };
const statBox = {
  background: '#111', border: '1px solid #1a1a1a',
  borderRadius: 6, padding: '8px 12px',
  display: 'flex', flexDirection: 'column', gap: 4,
};
const statLabel = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 9, letterSpacing: 2, color: '#555',
};
const statValue = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 16, fontWeight: 700, color: '#e8ff47',
};
const flagsSection = { display: 'flex', flexDirection: 'column', gap: 8 };
const flagItem = {
  display: 'flex', gap: 10, alignItems: 'flex-start',
  borderLeft: '3px solid #e8ff47',
  background: '#111',
  padding: '12px 16px',
  borderRadius: '0 4px 4px 0',
};
const flagText = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#888', lineHeight: 1.5 };
const noFlags = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#444' };
const scoreSection = { display: 'flex', flexDirection: 'column', gap: 8 };
const scoreLabel = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700, fontSize: 11, letterSpacing: 3, color: '#333',
};
const scoreRow = { display: 'flex', gap: 24 };
const continueBtn = {
  background: '#e8ff47', color: '#0a0a0a',
  border: 'none', borderRadius: 6,
  padding: '14px 32px', cursor: 'pointer',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900, fontSize: 14, letterSpacing: 3,
  alignSelf: 'flex-end',
};
