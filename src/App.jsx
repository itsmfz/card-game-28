import { useReducer, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameReducer, initialState } from './logic/gameReducer.js';
import GameTable from './components/GameTable.jsx';
import AnalysisOverlay from './components/AnalysisOverlay.jsx';
import TrainingTab from './components/TrainingTab.jsx';
import HelpTab from './components/HelpTab.jsx';

const TABS = ['GAME', 'TRAINING', 'HELP'];

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [tab, setTab] = useState('GAME');

  // AI turn handler
  useEffect(() => {
    if (state.phase === 'MENU') return;
    if (state.phase === 'ANALYSIS') return;
    if (state.trickResolving) return;
    if (state.currentPlayer === 'SOUTH') return;

    let timer;
    if (state.phase === 'BIDDING') {
      timer = setTimeout(() => dispatch({ type: 'AI_BID' }), 650);
    } else if (state.phase === 'TRUMP_SELECT' && state.bidWinner !== 'SOUTH') {
      timer = setTimeout(() => dispatch({ type: 'AI_SELECT_TRUMP' }), 700);
    } else if (state.phase === 'PLAY') {
      timer = setTimeout(() => dispatch({ type: 'AI_PLAY' }), 900);
    }

    return () => clearTimeout(timer);
  }, [state.currentPlayer, state.phase, state.bidWinner, state.trickNumber, state.currentTrick.length, state.trickResolving]);

  // Trick resolve: pause 1.2s so player sees all 4 cards, then advance
  useEffect(() => {
    if (!state.trickResolving) return;
    const timer = setTimeout(() => dispatch({ type: 'RESOLVE_TRICK' }), 1200);
    return () => clearTimeout(timer);
  }, [state.trickResolving]);

  return (
    <div style={appWrap}>
      {/* Top nav */}
      <nav style={nav}>
        <div style={logo}>28</div>
        <div style={tabs}>
          {TABS.map(t => (
            <button key={t} style={tabBtn(t === tab)} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div style={content}>
        {tab === 'GAME' && (
          state.phase === 'MENU' ? (
            <MenuScreen dispatch={dispatch} />
          ) : (
            <GameTable state={state} dispatch={dispatch} />
          )
        )}
        {tab === 'TRAINING' && <TrainingTab />}
        {tab === 'HELP' && <HelpTab />}
      </div>

      {/* Analysis overlay — shows over any tab */}
      <AnimatePresence>
        {state.phase === 'ANALYSIS' && (
          <AnalysisOverlay
            analysis={state.handAnalysis}
            gameScore={state.gameScore}
            matchWinner={state.matchWinner}
            message={state.message}
            onContinue={() => dispatch({ type: 'DISMISS_ANALYSIS' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuScreen({ dispatch }) {
  return (
    <motion.div style={menuWrap} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={bigTitle}>28</div>
      <div style={menuSub}>Kerala card game · 4 players · 2 teams</div>

      <div style={menuCards}>
        <InfoCard title="TOTAL DECK POINTS" value="28" />
        <InfoCard title="TRICKS PER HAND" value="8" />
        <InfoCard title="GAME POINTS TO WIN" value="6" />
      </div>

      <button style={startBtn} onClick={() => dispatch({ type: 'START_GAME' })}>
        START GAME
      </button>

      <div style={menuHint}>
        You play South · Team A (South + North) · vs Team B (East + West)
      </div>
    </motion.div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div style={infoCard}>
      <div style={infoVal}>{value}</div>
      <div style={infoLabel}>{title}</div>
    </div>
  );
}

const appWrap = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
  background: '#0a0a0a',
};

const nav = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '12px 24px',
  borderBottom: '1px solid #1a1a1a',
  flexShrink: 0,
};

const logo = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 28,
  letterSpacing: 4,
  color: '#e8ff47',
};

const tabs = { display: 'flex', gap: 4 };

const tabBtn = (active) => ({
  background: 'transparent',
  color: active ? '#e8ff47' : '#444',
  border: 'none',
  borderBottom: `2px solid ${active ? '#e8ff47' : 'transparent'}`,
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 14,
  letterSpacing: 3,
  transition: 'all 0.15s ease',
});

const content = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

const menuWrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  flex: 1,
  padding: 40,
};

const bigTitle = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 120,
  letterSpacing: 16,
  color: '#fff',
  lineHeight: 1,
};

const menuSub = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 12,
  color: '#444',
  letterSpacing: 2,
  marginTop: -16,
};

const menuCards = { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' };

const infoCard = {
  background: '#111',
  border: '1px solid #1a1a1a',
  borderRadius: 8,
  padding: '20px 32px',
  textAlign: 'center',
};

const infoVal = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 700,
  fontSize: 36,
  color: '#e8ff47',
};

const infoLabel = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: 3,
  color: '#444',
  marginTop: 4,
};

const startBtn = {
  background: '#e8ff47',
  color: '#0a0a0a',
  border: 'none',
  borderRadius: 6,
  padding: '16px 48px',
  cursor: 'pointer',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 900,
  fontSize: 18,
  letterSpacing: 6,
  marginTop: 8,
};

const menuHint = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: '#333',
};
