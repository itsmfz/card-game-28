import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerHand from './PlayerHand.jsx';
import TrickArea from './TrickArea.jsx';
import BidPanel from './BidPanel.jsx';
import TrumpReveal from './TrumpReveal.jsx';
import { hasPair } from '../logic/scoring.js';

export default function GameTable({ state, dispatch }) {
  const {
    phase, hands, currentTrick, ledSuit, trump, currentPlayer,
    currentBid, bidHistory, bidWinner, effectiveBid, pairShown,
    canRedeal, completedTricks, trickNumber, currentLeader,
    gameScore, matchWinner, message, difficulty, trickResolving,
  } = state;

  const isHumanBidTurn = phase === 'BIDDING' && currentPlayer === 'SOUTH';
  const isHumanPlayTurn = phase === 'PLAY' && currentPlayer === 'SOUTH' && !trickResolving;
  const humanHasPair =
    trump.suit && phase === 'PLAY' && !pairShown &&
    hasPair(hands['SOUTH'], trump.suit);

  const teamPoints = completedTricks.reduce(
    (acc, t) => {
      acc[{ SOUTH: 'A', NORTH: 'A', EAST: 'B', WEST: 'B' }[t.winner]] += t.points;
      return acc;
    },
    { A: 0, B: 0 }
  );

  const biddingTeam = bidWinner ? { SOUTH: 'A', NORTH: 'A', EAST: 'B', WEST: 'B' }[bidWinner] : null;
  const tricksLeft = 8 - completedTricks.length;

  // Trick winner popup — fires when trickResolving clears (RESOLVE_TRICK)
  const [trickPopup, setTrickPopup] = useState(null);
  const prevResolving = useRef(null);
  useEffect(() => {
    if (prevResolving.current && !trickResolving && completedTricks.length > 0) {
      const last = completedTricks[completedTricks.length - 1];
      setTrickPopup({ winner: last.winner, points: last.points, key: last.trickNumber });
    }
    prevResolving.current = trickResolving;
  }, [trickResolving]);
  useEffect(() => {
    if (!trickPopup) return;
    const t = setTimeout(() => setTrickPopup(null), 1400);
    return () => clearTimeout(t);
  }, [trickPopup?.key]);

  return (
    <div style={tableWrap}>

      {/* ── Main content: table + right panel ─────────── */}
      <div style={contentRow}>

        {/* Left: game table */}
        <div style={tableArea}>
          {/* Trick winner popups — absolutely positioned per player zone */}
          {POPUP_POS_KEYS.map(p => (
            <div key={p} style={POPUP_POS[p]}>
              <AnimatePresence>
                {trickPopup?.winner === p && (
                  <TrickPopupBadge points={trickPopup.points} pkey={trickPopup.key} player={p} />
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* North */}
          <div style={northZone}>
            <PlayerHand
              hand={hands['NORTH']} faceDown
              playerName="NORTH" vertical={false}
            />
          </div>

          {/* Middle row: West | Trick | East */}
          <div style={middleRow}>
            <div style={sideZone}>
              <PlayerHand
                hand={hands['WEST']} faceDown
                playerName="WEST" vertical
              />
            </div>

            <TrickArea
              currentTrick={currentTrick}
              ledSuit={ledSuit}
              trump={trump}
              lastTrickWinner={currentLeader}
              trickNumber={trickNumber || 1}
              trickResolving={trickResolving}
            />

            <div style={sideZone}>
              <PlayerHand
                hand={hands['EAST']} faceDown
                playerName="EAST" vertical
              />
            </div>
          </div>

          {/* Points bar — always reserved, populated during PLAY */}
          <PtsBar
            teamPoints={teamPoints}
            gameScore={gameScore}
            effectiveBid={effectiveBid}
            matchWinner={matchWinner}
            phase={phase}
            biddingTeam={biddingTeam}
            tricksLeft={tricksLeft}
          />

          {/* South (human) */}
          <div style={southZone}>
            <PlayerHand
              hand={hands['SOUTH']}
              ledSuit={ledSuit}
              phase={phase}
              isHuman={isHumanPlayTurn}
              onPlay={(card) => dispatch({ type: 'PLAY_CARD', card })}
            />
          </div>
        </div>

        {/* Right: action panel */}
        <div style={rightPanel}>

          {phase === 'BIDDING' && (
            <BidPanel
              currentBid={currentBid}
              bidHistory={bidHistory}
              hand4={hands['SOUTH']}
              canRedeal={canRedeal}
              isHumanTurn={isHumanBidTurn}
              onBid={(amount) => dispatch({ type: 'PLACE_BID', amount })}
              onRedeal={() => dispatch({ type: 'REDEAL' })}
            />
          )}

          {(phase === 'TRUMP_SELECT' || phase === 'PLAY') && (
            <TrumpReveal
              trump={trump}
              bidWinner={bidWinner}
              isHuman={bidWinner === 'SOUTH'}
              phase={phase}
              canShowPair={humanHasPair}
              onSelectTrump={(suit) => dispatch({ type: 'SELECT_TRUMP', suit })}
              onRevealTrump={() => dispatch({ type: 'REVEAL_TRUMP' })}
              onShowPair={() => dispatch({ type: 'SHOW_PAIR' })}
            />
          )}

          {/* Tricks log */}
          {completedTricks.length > 0 && (
            <div style={trickLog}>
              <div style={logHeader}>TRICK LOG</div>
              {completedTricks.slice().reverse().slice(0, 8).map((t, i) => (
                <div key={i} style={logRow}>
                  <span style={logNum}>#{t.trickNumber}</span>
                  <span style={{ ...logWinner, color: WINNER_COLOR[t.winner] }}>
                    {t.winner === 'SOUTH' ? 'YOU' : t.winner}
                  </span>
                  <span style={logPts}>{t.points}pt</span>
                  <span style={logCards}>
                    {t.cards.map(e => `${e.card.rank}${e.card.suit}`).join(' ')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={sidebarDivider} />

          {/* Match score */}
          <div style={sidebarSection}>
            <div style={logHeader}>MATCH</div>
            <SidebarPipRow
              label="TEAM A (YOU+N)"
              score={gameScore.A}
              winner={matchWinner === 'A'}
            />
            <SidebarPipRow
              label="TEAM B (E+W)"
              score={gameScore.B}
              winner={matchWinner === 'B'}
            />
          </div>

          {/* Divider */}
          <div style={sidebarDivider} />

          {/* Difficulty */}
          <div style={sidebarSection}>
            <div style={logHeader}>DIFFICULTY</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  style={diffBtn(d === difficulty)}
                  onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: d })}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PtsBar ────────────────────────────────────────────────────

function PtsBar({ teamPoints, gameScore, effectiveBid, matchWinner, phase, biddingTeam, tricksLeft }) {
  const active = phase === 'PLAY';
  const biddingPts = (active && biddingTeam) ? teamPoints[biddingTeam] : 0;
  const target = active && effectiveBid > 0 ? effectiveBid : null;
  const pct = target ? Math.min(biddingPts / target, 1) : 0;
  const met = target !== null && biddingPts >= target;
  // Max 7 pts per trick (J=3, 9=2, A=1, 10=1)
  const impossible = !met && target !== null && (target - biddingPts) > (tricksLeft ?? 8) * 7;

  return (
    <div style={ptsBarWrap}>
      <TeamCell
        label="TEAM A (YOU+N)"
        pts={active ? teamPoints.A : 0}
        score={gameScore.A}
        winner={matchWinner === 'A'}
      />
      <TargetBlock target={target} pct={pct} met={met} impossible={impossible} />
      <TeamCell
        label="TEAM B (E+W)"
        pts={active ? teamPoints.B : 0}
        score={gameScore.B}
        winner={matchWinner === 'B'}
        right
      />
    </div>
  );
}

function TargetBlock({ target, pct, met, impossible }) {
  const [flash, setFlash] = useState(false);
  const prevMet = useRef(false);

  useEffect(() => {
    if (met && !prevMet.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
    prevMet.current = met;
  }, [met]);

  if (!target) return <div style={{ minWidth: 80 }} />;

  const numColor = met ? '#4ade80' : impossible ? '#f87171' : '#e8ff47';
  const marker = met ? '✓' : impossible ? '✗' : null;

  return (
    <motion.div
      style={targetWrap}
      animate={flash
        ? { borderColor: ['#e8ff47', 'transparent', '#e8ff47', 'transparent'] }
        : { borderColor: 'transparent' }}
      transition={{ duration: 0.8, ease: 'linear' }}
    >
      <span style={targetLabel}>TARGET</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ ...targetNum, color: numColor }}>{target}</span>
        {marker && <span style={{ ...targetMarker, color: numColor }}>{marker}</span>}
      </div>
      <div style={progressTrack}>
        <motion.div
          style={{ ...progressFill, background: met ? '#4ade80' : '#e8ff47' }}
          animate={{ width: `${Math.round(pct * 100)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
}

function TeamCell({ label, pts, score, winner, right }) {
  const [display, setDisplay] = useState(pts);
  const [pulse, setPulse] = useState(false);
  const [delta, setDelta] = useState(null);
  const prevPts = useRef(pts);
  const prevPulse = useRef(pts);

  useEffect(() => {
    if (pts === prevPts.current) return;
    const from = prevPts.current;
    const d = pts - from;
    prevPts.current = pts;
    prevPulse.current = pts;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / 600, 1);
      setDisplay(Math.round(from + (pts - from) * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setPulse(true);
    setDelta({ value: d, key: Date.now() });
    const t = setTimeout(() => { setPulse(false); setDelta(null); }, 800);
    return () => clearTimeout(t);
  }, [pts]);

  const pips = Array.from({ length: 6 }).map((_, i) => (
    <div
      key={i}
      style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: i < score ? (winner ? '#e8ff47' : '#7fbc41') : 'transparent',
        border: `1px solid ${i < score ? (winner ? '#e8ff47' : '#7fbc41') : '#333'}`,
      }}
    />
  ));

  const numBlock = (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <AnimatePresence>
        {delta && (
          <motion.div
            key={delta.key}
            style={deltaFloat}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: -30 }}
            transition={{ duration: 0.6, times: [0, 0.1, 0.7, 1] }}
          >
            +{delta.value}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.span
        style={{ ...teamNum, display: 'inline-block' }}
        animate={pulse ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {display}
      </motion.span>
      <span style={teamNumLabel}>pts</span>
    </div>
  );

  const labelEl = <span style={teamLabel}>{label}</span>;
  const pipRow = <div style={{ display: 'flex', gap: 3 }}>{pips}</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: right ? 'row-reverse' : 'row' }}>
      {numBlock}
      {pipRow}
      {labelEl}
    </div>
  );
}

function SidebarPipRow({ label, score, winner }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 9, letterSpacing: 1, color: '#555' }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < score ? (winner ? '#e8ff47' : '#7fbc41') : 'transparent',
            border: `1.5px solid ${i < score ? (winner ? '#e8ff47' : '#7fbc41') : '#333'}`,
          }} />
        ))}
      </div>
    </div>
  );
}

// Per-player animation: SOUTH exits left (at score bar), EAST/WEST exit inward, NORTH exits upward
const POPUP_ANIM = {
  NORTH: { x: [0, 0, 0, 0, 0],   y: [0, 0, 0, -20, -40], dur: 1.2 },
  SOUTH: { x: [0, 0, 0, -30, -60], y: [0, 0, 0, 0, 0],   dur: 0.7 },
  EAST:  { x: [0, 0, 0, -30, -60], y: [0, 0, 0, 0, 0],   dur: 1.2 },
  WEST:  { x: [0, 0, 0,  30,  60], y: [0, 0, 0, 0, 0],   dur: 1.2 },
};

function TrickPopupBadge({ points, pkey, player }) {
  const dim = points === 0;
  const anim = POPUP_ANIM[player] || POPUP_ANIM.NORTH;
  return (
    <motion.div
      key={pkey}
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{
        scale: dim ? [0, 0.6, 0.5, 0.5, 0.5] : [0, 1.2, 1, 1, 1],
        opacity: dim ? [0, 0.3, 0.3, 0.3, 0] : [0, 1, 1, 1, 0],
        x: anim.x,
        y: anim.y,
      }}
      transition={{ duration: anim.dur, times: [0, 0.25, 0.4, 0.7, 1], ease: 'easeOut' }}
      style={{
        color: '#e8ff47',
        fontSize: '2rem',
        fontWeight: 900,
        fontFamily: "'Barlow Condensed', sans-serif",
        letterSpacing: 3,
        whiteSpace: 'nowrap',
        textShadow: dim ? 'none' : '0 0 20px rgba(232,255,71,0.5)',
        pointerEvents: 'none',
      }}
    >
      +{points} pts
    </motion.div>
  );
}

const POPUP_POS_KEYS = ['NORTH', 'SOUTH', 'EAST', 'WEST'];
const POPUP_POS = {
  // NORTH: float upward from above the trick table
  NORTH: { position: 'absolute', top: '7%',  left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none' },
  // SOUTH: anchored at Team A score bar level, left side — never overlaps hand
  SOUTH: { position: 'absolute', bottom: 220, left: '8%', zIndex: 50, pointerEvents: 'none' },
  // EAST: right side, floats inward (leftward)
  EAST:  { position: 'absolute', top: '45%', right: '5%', zIndex: 50, pointerEvents: 'none' },
  // WEST: left side, floats inward (rightward)
  WEST:  { position: 'absolute', top: '45%', left: '5%', zIndex: 50, pointerEvents: 'none' },
};


const WINNER_COLOR = {
  SOUTH: '#e8ff47',
  NORTH: '#7fbc41',
  EAST: '#e87f47',
  WEST: '#4799e8',
};

// ─── styles ────────────────────────────────────────────────────

const tableWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '12px 16px',
  flex: 1,
  minHeight: 0,
  overflowX: 'hidden',
};

const topBar = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexShrink: 0,
  height: 24,
};

const phaseChip = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 900,
  fontSize: 10,
  letterSpacing: 4,
  color: '#2e2e3a',
};

const diffRow = { display: 'flex', gap: 4 };
const diffBtn = (active) => ({
  background: 'transparent',
  color: active ? '#e8ff47' : '#666',
  border: `1px solid ${active ? '#e8ff47' : '#333'}`,
  borderRadius: 3,
  padding: '3px 8px',
  cursor: 'pointer',
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 2,
});

const msgBar = {
  background: '#0e0e14',
  border: '1px solid #1e1e28',
  borderRadius: 4,
  padding: '5px 12px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: '#555',
  flexShrink: 0,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
};

const contentRow = {
  display: 'flex',
  gap: 16,
  flex: 1,
  minHeight: 0,
  alignItems: 'stretch',
};

const tableArea = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  background: '#0e0e14',
  border: '1px solid #1a1a24',
  borderRadius: 16,
  padding: 16,
  minWidth: 0,
  minHeight: 0,
  position: 'relative',
};

const northZone = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  flexShrink: 0,
  paddingBottom: 12,
};

const middleRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  width: '100%',
  flex: 1,
  minHeight: 0,
};

const sideZone = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 90,
  flexShrink: 0,
  overflow: 'hidden',
};

const ptsBarWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  height: 56,
  flexShrink: 0,
  padding: '0 8px',
  background: '#080810',
  border: '1px solid #1a1a24',
  borderRadius: 8,
};

const targetWrap = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  minWidth: 80, padding: '3px 10px',
  border: '1px solid transparent',
  borderRadius: 4,
};

const targetLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10, letterSpacing: 2, color: '#555',
};

const targetNum = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 28, fontWeight: 700, lineHeight: 1,
};

const targetMarker = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 14, fontWeight: 700,
};

const progressTrack = {
  width: 70, height: 4, background: '#222',
  borderRadius: 2, overflow: 'hidden',
};

const progressFill = {
  height: '100%', borderRadius: 2,
};

const teamLabel = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 2,
  color: '#555',
  whiteSpace: 'nowrap',
};

const teamNum = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 22,
  fontWeight: 700,
  color: '#e8ff47',
  lineHeight: 1,
};

const teamNumLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: '#444',
  lineHeight: 1,
};

const deltaFloat = {
  position: 'absolute',
  bottom: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  fontWeight: 700,
  color: '#e8ff47',
  whiteSpace: 'nowrap',
  pointerEvents: 'none',
  zIndex: 10,
};

const southZone = {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
};

const rightPanel = {
  width: 280,
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  overflowY: 'auto',
  minHeight: 0,
};

const trickLog = {
  background: '#0e0e14',
  border: '1px solid #1a1a24',
  borderRadius: 8,
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
};

const logHeader = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.15em',
  color: '#666',
  marginBottom: 4,
};

const logRow = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const logNum = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: '#666',
  minWidth: 20,
};

const logWinner = {
  fontFamily: "'Barlow Condensed', monospace, sans-serif",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 1,
  minWidth: 36,
};

const logPts = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9,
  color: '#ccc',
  minWidth: 22,
};

const logCards = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  color: '#888',
};

const sidebarDivider = {
  height: 1,
  background: '#1e1e1e',
  flexShrink: 0,
};

const sidebarSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
