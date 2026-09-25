// Witness idiom — fnv-1a-64 hex — elite specimen #2
// family: hilo32   hash: 3d237a99ef
// bred by the quilt-loom Divergence Foundry (offline run, gen curve in outputs/results.json)
// contract: Given {text} (ASCII string), compute FNV-1a 64-bit: h=0xcbf29ce484222325; for each char code c in order: h ^= c; h *= 0x100000001b3 (mod 2^64). Return h as lowercase hex, zero-padded to 16 chars.
export const solve = function solve(input) {
  const s = input.text;
  let hi = 0xcbf29ce4, lo = 0x84222325;
  for (let i = 0; i < s.length; i++) {
    const cc = s.charCodeAt(i);
    lo = (lo ^ cc) >>> 0;
    const T = hi * 435 + lo * 256;
    const m = lo * 435;
    const newLo = m % 4294967296;
    const c = (m - newLo) / 4294967296;
    const T0 = T % 4294967296;
    hi = (T0 + c) % 4294967296;
    lo = newLo;
  }
  const H = hi.toString(16).padStart(8, '0');
  const L = lo.toString(16).padStart(8, '0');
  return (H + L).toLowerCase();
};
export default solve;