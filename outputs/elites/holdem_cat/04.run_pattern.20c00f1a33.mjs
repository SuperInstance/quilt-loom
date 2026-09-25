// Hold'em — five-card category — elite specimen #4
// family: run_pattern   hash: 20c00f1a33
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given exactly five cards (rank 2..14, ace=14; suit 0..3), return the hand category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight (wheel A-5 counts), 5 flush, 6 full house, 7 quads, 8 straight flush.
export const solve = function solve(input) {
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const cnt = new Map();
  for (const [r] of input.cards) cnt.set(r, (cnt.get(r) || 0) + 1);
  const shape = [...cnt.values()].sort((a, b) => b - a).join('');
  const distinct = [...cnt.keys()].sort((a, b) => a - b);
  let straight = false;
  if (distinct.length === 5) {
    straight = distinct[4] - distinct[0] === 4;
    if (!straight && distinct.join() === "2,3,4,5,14") straight = true;
  }
  if (flush && straight) return 8;
  if (shape === '41') return 7;
  if (shape === '32') return 6;
  if (flush) return 5;
  if (straight) return 4;
  if (shape === '311') return 3;
  if (shape === '221') return 2;
  if (shape === '2111') return 1;
  return 0;
};
export default solve;