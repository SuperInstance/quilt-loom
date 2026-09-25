// Hearts — trick winner — elite specimen #9
// family: sort_stable   hash: 25051d6b0b
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const ranked = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead)
    .sort((a, b) => b[0].r - a[0].r);
  if (!ranked.length) return 0;
  return ranked[0][1];
};
export default solve;