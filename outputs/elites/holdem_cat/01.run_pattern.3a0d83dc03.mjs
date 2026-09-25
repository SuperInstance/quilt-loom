// Hold'em — five-card category — elite specimen #1
// family: run_pattern   hash: 3a0d83dc03
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given exactly five cards (rank 2..14, ace=14; suit 0..3), return the hand category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight (wheel A-5 counts), 5 flush, 6 full house, 7 quads, 8 straight flush.
export const solve = function solve(input) {
  const vals = input.cards.map(c => c[0]).sort((a, b) => a - b);
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const runs = [];
  for (const v of vals) {
    if (runs.length && runs[runs.length - 1][0] === v) runs[runs.length - 1][1]++;
    else runs.push([v, 1]);
  }
  const shape = runs.map(r => r[1]).sort((a, b) => b - a).join('');
  let straight = false;
  if (runs.length === 5) {
    let consec = true;
    for (let i = 1; i < 5; i++) if (vals[i] !== vals[0] + i) consec = false;
    straight = consec;
    if (!straight && vals.join() === "2,3,4,5,14") straight = true;
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