import { useState, useCallback } from 'react';
import CardComponent from './CardComponent.jsx';
import {
  generateBiddingScenario, gradeBiddingAnswer,
  generateTrumpTimingScenario, gradeTrumpTimingAnswer,
  generateTrickTacticsScenario, gradeTrickTacticsAnswer,
} from '../logic/trainingEngine.js';

export default function TrainingTab() {
  const [mode, setMode] = useState(null); // 'bid' | 'trump' | 'trick'
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0 });

  const startMode = useCallback((m) => {
    setMode(m);
    setResult(null);
    if (m === 'bid') setScenario(generateBiddingScenario());
    else if (m === 'trump') setScenario(generateTrumpTimingScenario());
    else if (m === 'trick') setScenario(generateTrickTacticsScenario());
  }, []);

  const next = useCallback(() => {
    setResult(null);
    if (mode === 'bid') setScenario(generateBiddingScenario());
    else if (mode === 'trump') setScenario(generateTrumpTimingScenario());
    else setScenario(generateTrickTacticsScenario());
  }, [mode]);

  const recordResult = (correct) => {
    setStats(s => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
      streak: correct ? s.streak + 1 : 0,
    }));
  };

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={title}>TRAINING</div>
        {stats.total > 0 && (
          <div style={statsBar}>
            <span style={mono}>{stats.correct}/{stats.total} correct</span>
            {stats.streak >= 3 && <span style={{ color: '#e8ff47', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>🔥 {stats.streak} streak</span>}
          </div>
        )}
      </div>

      {!mode && <ModeSelect onSelect={startMode} />}

      {mode === 'bid' && scenario && (
        <BiddingTrainer
          scenario={scenario} result={result}
          onAnswer={(ans) => {
            const r = gradeBiddingAnswer(scenario.hand, ans, scenario.optimal);
            setResult(r); recordResult(r.correct);
          }}
          onNext={next}
          onBack={() => { setMode(null); setResult(null); }}
        />
      )}

      {mode === 'trump' && scenario && (
        <TrumpTimingTrainer
          scenario={scenario} result={result}
          onAnswer={(ans) => {
            const r = gradeTrumpTimingAnswer(ans, scenario);
            setResult(r); recordResult(r.correct);
          }}
          onNext={next}
          onBack={() => { setMode(null); setResult(null); }}
        />
      )}

      {mode === 'trick' && scenario && (
        <TrickTacticsTrainer
          scenario={scenario} result={result}
          onAnswer={(card) => {
            const r = gradeTrickTacticsAnswer(card, scenario);
            setResult(r); recordResult(r.correct);
          }}
          onNext={next}
          onBack={() => { setMode(null); setResult(null); }}
        />
      )}
    </div>
  );
}

function ModeSelect({ onSelect }) {
  const modes = [
    { id: 'bid', title: 'BIDDING TRAINER', desc: 'Given 4 cards, predict the correct bid range.', icon: '🎯' },
    { id: 'trump', title: 'TRUMP TIMING', desc: 'Mid-game scenario: trump now or save it?', icon: '⚡' },
    { id: 'trick', title: 'TRICK TACTICS', desc: '3 cards played. Pick your best response.', icon: '🃏' },
  ];
  return (
    <div style={modeGrid}>
      {modes.map(m => (
        <button key={m.id} style={modeCard} onClick={() => onSelect(m.id)}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
          <div style={modeTitle}>{m.title}</div>
          <div style={modeDesc}>{m.desc}</div>
        </button>
      ))}
    </div>
  );
}

function BiddingTrainer({ scenario, result, onAnswer, onNext, onBack }) {
  const [input, setInput] = useState(14);
  return (
    <div style={trainerWrap}>
      <div style={backBtn} onClick={onBack}>← BACK</div>
      <div style={scenTitle}>BIDDING TRAINER</div>
      <div style={question}>You see these 4 cards. What do you bid?</div>

      <div style={handRow}>
        {scenario.hand.map(card => <CardComponent key={card.id} card={card} />)}
      </div>

      {!result && (
        <div style={answerRow}>
          <div style={stepper}>
            <button style={stepBtn} onClick={() => setInput(v => Math.max(14, v - 1))}>−</button>
            <span style={bigNum}>{input}</span>
            <button style={stepBtn} onClick={() => setInput(v => Math.min(28, v + 1))}>+</button>
          </div>
          <button style={submitBtn} onClick={() => onAnswer(input)}>SUBMIT BID</button>
        </div>
      )}

      <FeedbackBox result={result} onNext={onNext} />
    </div>
  );
}

function TrumpTimingTrainer({ scenario, result, onAnswer, onNext, onBack }) {
  return (
    <div style={trainerWrap}>
      <div style={backBtn} onClick={onBack}>← BACK</div>
      <div style={scenTitle}>TRUMP TIMING</div>
      <div style={question}>
        Led suit: {scenario.ledSuit} · Trump: {scenario.trumpSuit} (hidden to opponents)<br />
        Trick so far has <b style={{ color: '#e8ff47' }}>{scenario.pts}pt{scenario.pts !== 1 ? 's' : ''}</b>. You can't follow suit.
      </div>

      <div style={handRow}>
        {scenario.trickCards.map(({ player, card }) => (
          <div key={card.id} style={{ textAlign: 'center' }}>
            <CardComponent card={card} />
            <div style={{ fontSize: 9, color: '#555', marginTop: 2, fontFamily: "'Barlow Condensed', sans-serif" }}>{player}</div>
          </div>
        ))}
      </div>

      <div style={{ color: '#444', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>Your hand:</div>
      <div style={handRow}>
        {scenario.hand.slice(0, 5).map(card => <CardComponent key={card.id} card={card} />)}
      </div>

      {!result && (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button style={choiceBtn('#e8ff47')} onClick={() => onAnswer('trump')}>PLAY TRUMP</button>
          <button style={choiceBtn('#555')} onClick={() => onAnswer('dump')}>DISCARD LOW CARD</button>
        </div>
      )}

      <FeedbackBox result={result} onNext={onNext} />
    </div>
  );
}

function TrickTacticsTrainer({ scenario, result, onAnswer, onNext, onBack }) {
  return (
    <div style={trainerWrap}>
      <div style={backBtn} onClick={onBack}>← BACK</div>
      <div style={scenTitle}>TRICK TACTICS</div>
      <div style={question}>
        3 cards played. Led: {scenario.ledSuit} · Trick worth <b style={{ color: '#e8ff47' }}>{scenario.pts}pt{scenario.pts !== 1 ? 's' : ''}</b>.<br />
        Which card do you play?
      </div>

      <div style={trickRow_}>
        {scenario.trickCards.map(({ player, card }) => (
          <div key={card.id} style={{ textAlign: 'center' }}>
            <CardComponent card={card} />
            <div style={{ fontSize: 9, color: '#555', marginTop: 2, fontFamily: "'Barlow Condensed', sans-serif" }}>{player}</div>
          </div>
        ))}
      </div>

      <div style={{ color: '#444', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>Legal cards to play:</div>
      {!result && (
        <div style={handRow}>
          {scenario.legal.map(card => (
            <div key={card.id} style={{ cursor: 'pointer' }} onClick={() => onAnswer(card)}>
              <CardComponent card={card} playable />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div style={handRow}>
          {scenario.legal.map(card => (
            <div key={card.id} style={{ opacity: card.id === scenario.bestCard.id ? 1 : 0.4 }}>
              <CardComponent card={card} />
              {card.id === scenario.bestCard.id && (
                <div style={{ textAlign: 'center', fontSize: 9, color: '#e8ff47', fontFamily: "'Barlow Condensed', sans-serif', letterSpacing:1" }}>BEST</div>
              )}
            </div>
          ))}
        </div>
      )}

      <FeedbackBox result={result} onNext={onNext} />
    </div>
  );
}

function FeedbackBox({ result, onNext }) {
  if (!result) return null;
  return (
    <div style={feedbackWrap(result.correct)}>
      <div style={{ color: result.correct ? '#e8ff47' : '#e8474e', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 14, letterSpacing: 2 }}>
        {result.correct ? '✓ CORRECT' : '✗ INCORRECT'}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.6 }}>
        {result.feedback}
      </div>
      <button style={{ ...submitBtn, marginTop: 12 }} onClick={onNext}>NEXT SCENARIO →</button>
    </div>
  );
}

const wrap = { padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const title = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: 4, color: '#fff' };
const statsBar = { display: 'flex', gap: 16, alignItems: 'center' };
const mono = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#aaa' };
const modeGrid = { display: 'flex', gap: 16, flexWrap: 'wrap' };
const modeCard = {
  background: '#111', border: '1px solid #222', borderRadius: 8,
  padding: 24, cursor: 'pointer', textAlign: 'left', flex: '1 1 180px',
  transition: 'border-color 0.15s',
};
const modeTitle = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: 3, color: '#fff', marginBottom: 6 };
const modeDesc = { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#555', lineHeight: 1.5 };
const trainerWrap = { display: 'flex', flexDirection: 'column', gap: 14 };
const backBtn = { color: '#444', cursor: 'pointer', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: 2 };
const scenTitle = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: 4, color: '#e8ff47' };
const question = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#888', lineHeight: 1.8 };
const handRow = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const trickRow_ = { display: 'flex', gap: 12, alignItems: 'flex-end' };
const answerRow = { display: 'flex', gap: 16, alignItems: 'center' };
const stepper = { display: 'flex', alignItems: 'center', gap: 12 };
const bigNum = { fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700, color: '#e8ff47', minWidth: 48, textAlign: 'center' };
const stepBtn = {
  background: '#1a1a1a', border: '1px solid #333', color: '#aaa',
  width: 32, height: 32, borderRadius: 4, cursor: 'pointer', fontSize: 18,
};
const submitBtn = {
  background: '#e8ff47', color: '#0a0a0a', border: 'none', borderRadius: 4,
  padding: '8px 20px', cursor: 'pointer',
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 13, letterSpacing: 2,
};
const choiceBtn = (color) => ({
  background: 'transparent', color, border: `1px solid ${color}`, borderRadius: 4,
  padding: '10px 20px', cursor: 'pointer',
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 2,
});
const feedbackWrap = (correct) => ({
  background: correct ? 'rgba(232,255,71,0.05)' : 'rgba(232,71,78,0.05)',
  border: `1px solid ${correct ? '#2a2e1a' : '#2e1a1a'}`,
  borderRadius: 6,
  padding: 16,
});
