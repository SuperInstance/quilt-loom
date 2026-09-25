// Hearts — trick winner — elite specimen #6
// family: sort_stable   hash: 67d08c7461
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const ranked = plays
    .map((p, i) => ({ p, i }))
    .filter((e) => e.p.s === lead)
    .sort((x, y) => y.p.r - x.p.r);
  return ranked.length ? ranked[0].i : 0;
};
export default solve;