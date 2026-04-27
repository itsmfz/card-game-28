# 28 — The Card Game

A digital implementation of 28 (Irupathiyettu), the classic trick-taking card game runs fully offline as a native Mac desktop app.
---

## ✦ Features

- **Full 28 rule engine** — bidding, hidden trump, pair rule, 8 tricks, scoring to 6 points
- **3 AI difficulty levels** — Easy, Medium, Hard with distinct strategic logic
- **Post-hand Game Analysis** — letter grade + trick-by-trick feedback after every hand
- **Training Tab** — procedurally generated scenarios: Bidding Trainer, Trump Timing, Trick Tactics
- **Help Tab** — plain-language guide that teaches the game from scratch
- **Dark brutalist UI** — black background, acid yellow accents
- **Native Mac app** — ships as a `.dmg`, no install friction

---

## ⚙ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Desktop | Electron |
| Animations | Framer Motion |
| Styling | Tailwind CSS |
| Game Logic | Pure rule-based engine (no external APIs) |

---

## 🃏 Game Rules (Quick Reference)

28 is a 4-player, 2-team trick-taking game played with 32 cards (7–10, J, Q, K, A in all four suits).

- **Card values:** J=3, 9=2, A=1, 10=1, others=0. Total points in a deck: 28.
- **Bidding:** Players bid the number of points their team will win. Minimum bid is 14.
- **Hidden trump:** The bidder secretly selects a trump suit — it is not revealed until called.
- **Calling trump:** Trump is revealed only when a player cannot follow suit or chooses to call it.
- **Pair rule:** Holding both Jacks or both 9s counts as a special declaration worth extra points.
- **Winning a hand:** The team that meets or exceeds their bid wins the hand.
- **Game scoring:** First team to reach 6 game points wins. A failed bid subtracts points.
- **8 tricks** are played per hand, one card per player per trick.

---

## 🚀 Run Locally

```bash
npm install
npm run dev
```

Opens in Electron with hot reload.

---

## 📦 Build Mac DMG

```bash
npm run electron:build
```

Output is written to `dist/`. Requires macOS.

---

## License

MIT
