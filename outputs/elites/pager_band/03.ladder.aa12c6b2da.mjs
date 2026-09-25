// Fleet-pager — hysteresis banding — elite specimen #3
// family: ladder   hash: aa12c6b2da
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given severity cur (integer 0-100) and prev (previous severity, integer or null): band = "sev2" if cur>=70, "sev3" if cur>=40, else "quiet". page_sev2 fires iff prev!=null and cur>=70 and prev<70; page_sev3 iff prev!=null and cur>=40 and cur<70 and prev<40; resolve iff prev!=null and cur<50 and prev>=50. Return {band, page_sev2, page_sev3, resolve}.
export const solve = function solve(input) {
  const cur = input.cur, prev = input.prev;
  let band;
  if (cur >= 70) band = 'sev2';
  else if (cur >= 40) band = 'sev3';
  else band = 'quiet';
  const has = (prev !== null && prev !== undefined);
  return {
    band,
    page_sev2: has && cur >= 70 && prev < 70,
    page_sev3: has && cur >= 40 && cur < 70 && prev < 40,
    resolve: has && cur < 50 && prev >= 50,
  };
};
export default solve;