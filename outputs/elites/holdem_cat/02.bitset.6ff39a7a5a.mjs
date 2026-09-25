// Hold'em — five-card category — elite specimen #2
// family: bitset   hash: 6ff39a7a5a
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given exactly five cards (rank 2..14, ace=14; suit 0..3), return the hand category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight (wheel A-5 counts), 5 flush, 6 full house, 7 quads, 8 straight flush.
export const solve = function solve(input) {
  let mask = 0;
  const cnt = {};
  for (const [r] of input.cards) { mask |= (1 << r); cnt[r] = (cnt[r] || 0) + 1; }
  let flush = true;
  for (const c of input.cards) if (c[1] !== input.cards[0][1]) flush = false;
  let straightHigh = 0, run = 0;
  for (let v = 2; v <= 14; v++) {
    run = (mask & (1 << v)) ? run + 1 : 0;
    if (run >= 5) straightHigh = v;
  }
  if ((mask & 0x403c) === 0x403c) straightHigh = 5; // wheel A-5
  let maxC = 0, pairs = 0;
  for (const k in cnt) {
    if (cnt[k] > maxC) maxC = cnt[k];
    if (cnt[k] === 2) pairs++;
  }
  if (flush && straightHigh) return 8;
  if (maxC === 4) return 7;
  if (maxC === 3 && pairs === 1) return 6;
  if (flush) return 5;
  if (straightHigh) return 4;
  if (maxC === 3) return 3;
  if (pairs === 2) return 2;
  if (pairs === 1) return 1;
  return 0;
};
export default solve;