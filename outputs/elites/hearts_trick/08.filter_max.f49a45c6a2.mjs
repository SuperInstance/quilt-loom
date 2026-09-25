// Hearts — trick winner — elite specimen #8
// family: filter_max   hash: f49a45c6a2
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  const inSuit = plays.map((p, i) => [p, i]).filter(([p]) => p.s === lead);
  if (!inSuit.length) return 0;
  const maxR = Math.max(...inSuit.map(([p]) => p.r));
  const winner = inSuit.find(([p]) => p.r === maxR);
  return winner[1];
};
export default solve;