import { motion } from 'framer-motion';

const CHAPTERS = [
  {
    num: '01',
    title: 'WHAT IS THIS GAME?',
    body: '28 is a trick-taking card game from Kerala, India. 4 players, 2 teams. You (South) and North are Team A. East and West are Team B. Your goal: win as many point cards as possible — there are exactly 28 points in the deck.',
    demo: null,
  },
  {
    num: '02',
    title: 'WHICH CARDS ARE POWERFUL?',
    body: 'The Jack is the most powerful card in every suit — worth 3 points. The Nine is second — worth 2 points. Aces and Tens are worth 1 point each. Kings, Queens, 8s, and 7s? Zero points. Just soldiers.',
    demo: 'rank_order',
  },
  {
    num: '03',
    title: 'WHAT IS BIDDING?',
    body: 'Before the game starts, everyone looks at their first 4 cards and makes a prediction: "I think my team can win THIS many points." The highest bidder wins. If you win the bid, you secretly choose the trump suit. The minimum bid is 14. Each bid must beat the last.',
    demo: null,
  },
  {
    num: '04',
    title: 'WHAT IS TRUMP?',
    body: 'Trump is a secret super-suit chosen by the highest bidder. A trump card beats every card from other suits — even powerful ones like the Ace or Jack. The trump suit stays hidden until someone plays a trump card, or the bidder chooses to reveal it.',
    demo: 'trump_demo',
  },
  {
    num: '05',
    title: 'HOW DO TRICKS WORK?',
    body: 'Each round, everyone plays one card. This is called a trick. The first card sets the "led suit" — everyone must follow that suit if they can. The highest card of the led suit wins, unless someone plays trump. The trick winner leads the next trick.',
    demo: null,
  },
  {
    num: '06',
    title: 'HOW DO YOU WIN?',
    body: 'If you won the bid, your team must collect at least that many points in tricks. Meet or beat your bid → your team scores 1 game point. Miss it → the other team scores. First team to win 6 game points wins the entire match. The trump pair (K+Q of trump) can adjust the bid by ±4.',
    demo: null,
  },
];

const RANK_DEMO = [
  { rank: 'J', pts: '3pts', label: 'MOST POWERFUL' },
  { rank: '9', pts: '2pts', label: '' },
  { rank: 'A', pts: '1pt', label: '' },
  { rank: '10', pts: '1pt', label: '' },
  { rank: 'K', pts: '0', label: '' },
  { rank: 'Q', pts: '0', label: '' },
  { rank: '8', pts: '0', label: '' },
  { rank: '7', pts: '0', label: 'WEAKEST' },
];

export default function HelpTab() {
  return (
    <div style={wrap}>
      <div style={title}>THE RULES OF 28</div>
      <div style={subtitle}>Everything you need to play.</div>

      {CHAPTERS.map((ch, i) => (
        <motion.div
          key={ch.num}
          style={chapter}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <div style={chNum}>{ch.num}</div>
          <div style={chContent}>
            <div style={chTitle}>{ch.title}</div>
            <div style={chBody}>{ch.body}</div>

            {ch.demo === 'rank_order' && (
              <div style={rankDemo}>
                {RANK_DEMO.map((r, j) => (
                  <div key={j} style={rankItem(j)}>
                    <div style={rankCard(j < 4)}>{r.rank}</div>
                    <div style={rankPts(j < 2)}>{r.pts}</div>
                    {r.label && <div style={rankLab}>{r.label}</div>}
                  </div>
                ))}
              </div>
            )}

            {ch.demo === 'trump_demo' && (
              <div style={trumpDemo}>
                <div style={trumpCard('♣')}>
                  <span style={{ color: '#f0f0e8', fontSize: 20 }}>A</span>
                  <span style={{ color: '#f0f0e8', fontSize: 12 }}>♣</span>
                </div>
                <div style={beats}>LOSES TO</div>
                <div style={trumpCard('♠', true)}>
                  <span style={{ color: '#f0f0e8', fontSize: 20 }}>7</span>
                  <span style={{ color: '#f0f0e8', fontSize: 12 }}>♠</span>
                </div>
                <div style={trumpBadge}>TRUMP ♠</div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const wrap = { padding: 24, display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 720, margin: '0 auto' };
const title = { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 40, letterSpacing: 6, color: '#fff' };
const subtitle = { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#444', marginTop: -20 };
const chapter = {
  display: 'flex', gap: 24, alignItems: 'flex-start',
  borderTop: '1px solid #1a1a1a', paddingTop: 28,
};
const chNum = {
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 64,
  color: '#e8ff47', lineHeight: 1, minWidth: 60, flexShrink: 0,
};
const chContent = { display: 'flex', flexDirection: 'column', gap: 10, flex: 1 };
const chTitle = {
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22,
  letterSpacing: 3, color: '#fff',
};
const chBody = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#888', lineHeight: 1.8,
};
const rankDemo = {
  display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12,
};
const rankItem = (i) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  opacity: i >= 4 ? 0.5 : 1,
});
const rankCard = (points) => ({
  width: 40, height: 56, background: '#f0f0e8',
  border: `1px solid ${points ? '#e8ff47' : '#333'}`,
  borderRadius: 4,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18,
  color: '#1a1a1a',
});
const rankPts = (high) => ({
  fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
  color: high ? '#e8ff47' : '#555',
});
const rankLab = {
  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 8,
  letterSpacing: 1, color: '#444',
};
const trumpDemo = {
  display: 'flex', alignItems: 'center', gap: 12, marginTop: 12,
};
const trumpCard = (suit, isTrump) => ({
  width: 50, height: 70, background: '#f0f0e8',
  border: `2px solid ${isTrump ? '#e8ff47' : '#333'}`,
  borderRadius: 4,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
});
const beats = {
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
  fontSize: 10, letterSpacing: 2, color: '#e8474e',
};
const trumpBadge = {
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
  fontSize: 10, letterSpacing: 2, color: '#e8ff47',
  border: '1px solid #e8ff47', borderRadius: 3, padding: '2px 6px',
};
