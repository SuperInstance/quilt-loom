// Hearts — trick winner — elite specimen #3
// family: filter_max   hash: 09e67da624
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given a Hearts trick (list of plays in order, each with player, suit, rank), return the INDEX of the winning play: the highest-ranked card of the suit led by the first play. Cards of other suits never win.
export const solve = function solve(input) {
  const plays = input.plays;
  const lead = plays[0].s;
  let maxR = -Infinity, best = 0;
  for (const p of plays) if (p.s === lead && p.r > maxR) { maxR = p.r; best = plays.indexOf(p); }
  return plays[best] && plays[best].s === lead ? best : 0;
};
export default solve;