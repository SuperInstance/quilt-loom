// Hearts — trick winner — elite specimen #2
// family: sort_stable   hash: 860a9a33e9
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const leadCards = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead);
  if (!leadCards.length) return 0;
  const byRank = [...leadCards].sort((a, b) => b[0].r - a[0].r);
  return byRank.shift()[1];
};
export default solve;