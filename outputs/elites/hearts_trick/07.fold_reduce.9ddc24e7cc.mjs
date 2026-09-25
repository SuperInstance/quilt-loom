// Hearts — trick winner — elite specimen #7
// family: fold_reduce   hash: 9ddc24e7cc
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const entries = plays.map((p, i) => ({ p, i }));
  const best = entries.reduce((acc, e) =>
    (e.p.s === lead && (acc === null || e.p.r > acc.p.r)) ? e : acc, null);
  return best ? best.i : -1;
};
export default solve;