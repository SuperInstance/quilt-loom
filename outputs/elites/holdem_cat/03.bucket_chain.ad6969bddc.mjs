// Hold'em — five-card category — elite specimen #3
// family: bucket_chain   hash: ad6969bddc
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given exactly five cards (rank 2..14, ace=14; suit 0..3), return the hand category: 0 high card, 1 pair, 2 two pair, 3 trips, 4 straight (wheel A-5 counts), 5 flush, 6 full house, 7 quads, 8 straight flush.
export const solve = function solve(input) {
  const vals = input.cards.map(c => c[0]).sort((a, b) => a - b);
  const flush = input.cards.every(c => c[1] === input.cards[0][1]);
  const distinct = [...new Set(vals)];
  let straight = 0;
  if (distinct.length === 5) {
    if (distinct[4] - distinct[0] === 4) straight = distinct[4];
    else if (distinct[0] === 2 && distinct[1] === 3 && distinct[2] === 4 && distinct[3] === 5 && distinct[4] === 14) straight = 5;
  }
  const cnt = {};
  vals.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; });
  const groups = Object.values(cnt).sort((a, b) => b - a);
  switch (true) {
    case flush && straight > 0: return 8;
    case groups[0] === 4: return 7;
    case groups[0] === 3 && groups[1] === 2: return 6;
    case flush: return 5;
    case straight > 0: return 4;
    case groups[0] === 3: return 3;
    case groups[0] === 2 && groups[1] === 2: return 2;
    case groups[0] === 2: return 1;
    default: return 0;
  }
};
export default solve;