// Hearts — trick winner — elite specimen #4
// family: fold_reduce   hash: e0a6fdce56
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const best = plays.reduce((acc, p, i) =>
    (p.s === lead && (acc === -1 || p.r > plays[acc].r)) ? i : acc, -1);
  return best;
};
export default solve;