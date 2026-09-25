// quilt-loom/loom/targets_fleet.mjs — FLEET targets for the Divergence
// Foundry. These are NOT toy contracts: each is lifted from a real
// SuperInstance portfolio project and must survive the forge like any game
// logic. Ported line-for-line from the projects they govern:
//
//   pager_band    — quilt-tools/01 fleet-pager: edge-triggered paging bands
//                   with hysteresis and the first-sample guard
//   witness_fnv   — the fnv-1a-64 witness idiom (ledger-seal, ocean receipts,
//                   the loom's own chain): every receipt re-derives anywhere
//   cosine_sparse — quilt-tools/03 ocean-recall + E8 ocean match: integer
//                   count bags, exact rational cosine
//
// Same target shape as targets_grid/targets_cards:
//   spec / oracle / canon / genInput(R) / baseProbes / rarity / families[]

// ── F1: FLEET-PAGER hysteresis banding ──────────────────────────────────────
// Integer in/outs + boolean flags: bit-exact across ANY structure, which makes
// it the cleanest place to catch structural mimics that dropped the
// first-sample guard (the bug the pager was born with).
const F1 = {
  id: 'pager_band',
  title: 'Fleet-pager — hysteresis banding',
  spec: 'Given severity cur (integer 0-100) and prev (previous severity, integer or null): band = "sev2" if cur>=70, "sev3" if cur>=40, else "quiet". page_sev2 fires iff prev!=null and cur>=70 and prev<70; page_sev3 iff prev!=null and cur>=40 and cur<70 and prev<40; resolve iff prev!=null and cur<50 and prev>=50. Return {band, page_sev2, page_sev3, resolve}.',
  probeCap: 40,
  oracle: `function solve(input) {
  const cur = input.cur, prev = input.prev;
  const has = (prev !== null && prev !== undefined);
  let band;
  if (cur >= 70) band = 'sev2';
  else if (cur >= 40) band = 'sev3';
  else band = 'quiet';
  return {
    band,
    page_sev2: has && cur >= 70 && prev < 70,
    page_sev3: has && cur >= 40 && cur < 70 && prev < 40,
    resolve: has && cur < 50 && prev >= 50,
  };
}`,
  canon: (o) => JSON.stringify({ band: String(o.band), a: !!o.page_sev2, b: !!o.page_sev3, r: !!o.resolve }),
  genInput(R) {
    const edge = [0, 39, 40, 41, 49, 50, 51, 69, 70, 71, 99, 100];
    const pick = () => (R() < 0.55 ? edge[Math.floor(R() * edge.length)] : Math.floor(R() * 101));
    return { cur: pick(), prev: R() < 0.15 ? null : pick() };
  },
  baseProbes: [
    { cur: 70, prev: null }, { cur: 69, prev: null }, { cur: 40, prev: null },
    { cur: 69, prev: 40 }, { cur: 70, prev: 69 }, { cur: 70, prev: 70 },
    { cur: 40, prev: 39 }, { cur: 39, prev: 45 }, { cur: 50, prev: 50 },
    { cur: 49, prev: 51 }, { cur: 30, prev: 75 }, { cur: 100, prev: 0 },
    { cur: 0, prev: 100 }, { cur: 65, prev: 12 }, { cur: 71, prev: 40 },
  ],
  rarity: (o) => -((o.page_sev2 ? 1 : 0) + (o.page_sev3 ? 1 : 0) + (o.resolve ? 1 : 0)),
  families: [
    {
      id: 'ladder', note: 'if/else band ladder + explicit boolean conjunctions', sound: true,
      render(R, corrupt) {
        const guard = corrupt > 0.85 ? 'true' : '(prev !== null && prev !== undefined)';
        const cmp = corrupt > 0.8 ? '>' : '>=';
        const rb = corrupt > 0.9 ? 49 : 50;
        return `function solve(input) {
  const cur = input.cur, prev = input.prev;
  let band;
  if (cur ${cmp} 70) band = 'sev2';
  else if (cur ${cmp} 40) band = 'sev3';
  else band = 'quiet';
  const has = ${guard};
  return {
    band,
    page_sev2: has && cur >= 70 && prev < 70,
    page_sev3: has && cur >= 40 && cur < 70 && prev < 40,
    resolve: has && cur < ${rb} && prev >= ${rb},
  };
}`;
      },
    },
    {
      id: 'rules_table', note: 'data-driven: threshold rows + condition matrix folded with every()', sound: true,
      render(R, corrupt) {
        const guard = corrupt > 0.85 ? '1' : 'has';
        const cmp = corrupt > 0.8 ? '>' : '>=';
        const rb = corrupt > 0.9 ? 49 : 50;
        return `function solve(input) {
  const cur = input.cur, prev = input.prev;
  const rows = [[70, 'sev2'], [40, 'sev3']];
  let band = 'quiet';
  for (const row of rows) {
    if (cur ${cmp} row[0]) { band = row[1]; break; }
  }
  const has = (prev !== null && prev !== undefined);
  const flags = [
    ['page_sev2', [cur >= 70, prev < 70]],
    ['page_sev3', [cur >= 40, cur < 70, prev < 40]],
    ['resolve', [cur < ${rb}, prev >= ${rb}]],
  ];
  const out = { band, page_sev2: false, page_sev3: false, resolve: false };
  if (${guard}) {
    for (const f of flags) {
      if (f[1].every(Boolean)) out[f[0]] = true;
    }
  }
  return out;
}`;
      },
    },
    {
      id: 'boolean_index', note: 'band via boolean-sum array index; flags as unordered algebra', sound: true,
      render(R, corrupt) {
        const guard = corrupt > 0.85 ? 'true' : '!(prev == null)';
        const cmp = corrupt > 0.8 ? '>' : '>=';
        const rb = corrupt > 0.9 ? 49 : 50;
        return `function solve(input) {
  const cur = input.cur, prev = input.prev;
  const band = ['quiet', 'sev3', 'sev2'][(cur ${cmp} 40) + (cur ${cmp} 70)];
  const has = ${guard};
  return {
    band,
    page_sev2: has && (prev < 70) && (cur >= 70),
    page_sev3: has && (cur < 70) && (prev < 40) && (cur >= 40),
    resolve: has && (prev >= ${rb}) && (cur < ${rb}),
  };
}`;
      },
    },
  ],
};

// ── F2: THE WITNESS — fnv-1a-64 over ASCII, hex out ─────────────────────────
// The hash every receipt in the portfolio chains on. Three exact doctrines:
// bigint single register / exact 32-bit hi-lo schoolbook multiply / paired
// char stepping. All must produce the SAME 16-hex-char witness id.
const F2 = {
  id: 'witness_fnv',
  title: 'Witness idiom — fnv-1a-64 hex',
  spec: 'Given {text} (ASCII string), compute FNV-1a 64-bit: h=0xcbf29ce484222325; for each char code c in order: h ^= c; h *= 0x100000001b3 (mod 2^64). Return h as lowercase hex, zero-padded to 16 chars.',
  probeCap: 36,
  oracle: `function solve(input) {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let i = 0; i < input.text.length; i++) {
    h ^= BigInt(input.text.charCodeAt(i));
    h = (h * prime) & mask;
  }
  return h.toString(16).padStart(16, '0');
}`,
  canon: (o) => String(o).toLowerCase(),
  genInput(R) {
    const cs = 'abcdefghijk0123456789_{}:".';
    const n = Math.floor(R() * 48);
    let s = '';
    for (let i = 0; i < n; i++) s += cs[Math.floor(R() * cs.length)];
    return { text: s };
  },
  baseProbes: [
    { text: '' }, { text: 'a' }, { text: 'hello world' }, { text: '{"k":1}' },
    { text: 'canon:ACK' }, { text: '0'.repeat(64) }, { text: 'quilt' }, { text: 'AaAaAa' },
  ],
  rarity: (o) => (String(o).startsWith('00') ? -2 : 0),
  families: [
    {
      id: 'bigint_fold', note: 'reduce-fold over chars; mask timing is algebraically free', sound: true,
      render(R, corrupt) {
        const maskAtEnd = R() < 0.5;
        const prime = corrupt > 0.85 ? '0x100000001b7n' : '0x100000001b3n';
        const pad = corrupt > 0.8 ? 12 : 16;
        const step = maskAtEnd
          ? 'acc = (acc ^ BigInt(s.charCodeAt(i))) * P;'
          : 'acc = ((acc ^ BigInt(s.charCodeAt(i))) * P) & M;';
        return `function solve(input) {
  const s = input.text;
  const P = ${prime}, M = 0xffffffffffffffffn;
  let acc = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    ${step}
  }
  return (acc & M).toString(16).padStart(${pad}, '0');
}`;
      },
    },
    {
      id: 'hilo32', note: 'exact 32-bit schoolbook: no BigInt, hi/lo halves (prime = 2^40 + 435)', sound: true,
      render(R, corrupt) {
        const xorInto = corrupt > 0.85 ? 'hi' : 'lo';
        const low = corrupt > 0.8 ? 437 : 435;
        const carry = corrupt > 0.9 ? '' : ' + c';
        return `function solve(input) {
  const s = input.text;
  let hi = 0xcbf29ce4, lo = 0x84222325;
  for (let i = 0; i < s.length; i++) {
    const cc = s.charCodeAt(i);
    ${xorInto} = (${xorInto} ^ cc) >>> 0;
    const T = hi * ${low} + lo * 256;
    const m = lo * ${low};
    const newLo = m % 4294967296;
    const c = (m - newLo) / 4294967296;
    const T0 = T % 4294967296;
    hi = (T0${carry}) % 4294967296;
    lo = newLo;
  }
  const H = hi.toString(16).padStart(8, '0');
  const L = lo.toString(16).padStart(8, '0');
  return (H + L).toLowerCase();
}`;
      },
    },
    {
      id: 'word_pairs', note: 'paired stepping through a closure — same op order, alien shape', sound: true,
      render(R, corrupt) {
        const stride = corrupt > 0.85 ? 3 : 2;
        const swap = corrupt > 0.8;
        return `function solve(input) {
  const s = input.text;
  let h = 0xcbf29ce484222325n;
  const P = 0x100000001b3n, M = 0xffffffffffffffffn;
  const step = (ch) => { h = ((h ^ BigInt(ch.charCodeAt(0))) * P) & M; };
  for (let i = 0; i < s.length; i += ${stride}) {
    const a = s[i], b = s[i + 1];
    if (${swap}) { if (b !== undefined) step(b); step(a); }
    else { step(a); if (b !== undefined) step(b); }
  }
  return h.toString(16).padStart(16, '0');
}`;
      },
    },
  ],
};

// ── F3: OCEAN-RECALL cosine over integer count bags ─────────────────────────
// Integer counts make dot/norms exact integers — so ANY summation order gives
// the identical double after one division. Structure diversity without float
// lottery. The empty-bag guard is the classic fake-killer.
const F3 = {
  id: 'cosine_sparse',
  title: 'Ocean recall — sparse integer cosine',
  spec: 'Given {a, b} (objects mapping term->positive integer count), return their cosine similarity as a number rounded to 4 decimals (Math.round(x*10000)/10000). Convention: if either bag has zero total norm, return 0.',
  probeCap: 36,
  oracle: `function solve(input) {
  const a = input.a, b = input.b;
  let dot = 0, na = 0, nb = 0;
  for (const k in a) na += a[k] * a[k];
  for (const k in b) nb += b[k] * b[k];
  for (const k in a) {
    if (k in b) dot += a[k] * b[k];
  }
  if (na === 0 || nb === 0) return 0;
  return Math.round((dot / (Math.sqrt(na) * Math.sqrt(nb))) * 10000) / 10000;
}`,
  canon: (o) => (typeof o === 'number' && isFinite(o)) ? o.toFixed(4) : String(o),
  genInput(R) {
    const vocab = ['tide', 'ocean', 'receipt', 'hash', 'sheet', 'cell', 'wave', 'budget'];
    const bag = () => {
      const n = 1 + Math.floor(R() * 6);
      const o = {};
      for (let i = 0; i < n; i++) {
        const k = vocab[Math.floor(R() * vocab.length)];
        o[k] = 1 + Math.floor(R() * 5);
      }
      return o;
    };
    return { a: bag(), b: bag() };
  },
  baseProbes: [
    { a: { tide: 2, ocean: 1 }, b: { tide: 2, ocean: 1 } },
    { a: { tide: 1 }, b: { ocean: 1 } },
    { a: {}, b: { tide: 3 } },
    { a: { tide: 3 }, b: {} },
    { a: { tide: 1, hash: 2 }, b: { hash: 2, tide: 1, cell: 7 } },
    { a: { sheet: 4, cell: 1 }, b: { sheet: 1, wave: 9 } },
    { a: { receipt: 5 }, b: { receipt: 5, hash: 1 } },
  ],
  rarity: (o) => -Math.round(Number(o) * 10),
  families: [
    {
      id: 'a_key_scan', note: 'dot over a-keys only, b[k]||0 defaulting', sound: true,
      render(R, corrupt) {
        const def = corrupt > 0.85 ? 'b[k]' : '(b[k] || 0)';
        const guard = corrupt > 0.8 ? '' : 'if (na === 0 || nb === 0) return 0;';
        const mul = corrupt > 0.9 ? 1000 : 10000;
        return `function solve(input) {
  const a = input.a, b = input.b;
  let dot = 0, na = 0, nb = 0;
  for (const k in a) { na += a[k] * a[k]; }
  for (const k in b) { nb += b[k] * b[k]; }
  ${guard}
  for (const k in a) { dot += a[k] * ${def}; }
  const cos = dot / (Math.sqrt(na) * Math.sqrt(nb));
  return Math.round(cos * ${mul}) / ${mul};
}`;
      },
    },
    {
      id: 'union_set', note: 'key union via Set, zero-default both sides', sound: true,
      render(R, corrupt) {
        const guard = corrupt > 0.85 ? '' : 'if (na === 0 || nb === 0) return 0;';
        const op = corrupt > 0.8 ? '+' : '*';
        return `function solve(input) {
  const a = input.a, b = input.b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const x = a[k] || 0, y = b[k] || 0;
    dot += x ${op} y;
  }
  for (const k of Object.keys(a)) { na += a[k] * a[k]; }
  for (const k of Object.keys(b)) { nb += b[k] * b[k]; }
  ${guard}
  return Math.round((dot / (Math.sqrt(na) * Math.sqrt(nb))) * 10000) / 10000;
}`;
      },
    },
    {
      id: 'sorted_two_pointer', note: 'sorted key arrays walked with two pointers', sound: true,
      render(R, corrupt) {
        const guard = corrupt > 0.85 ? '' : 'if (na === 0 || nb === 0) return 0;';
        const cmp = corrupt > 0.8 ? '>' : '<';
        return `function solve(input) {
  const a = input.a, b = input.b;
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  let i = 0, j = 0, dot = 0;
  while (i < ka.length && j < kb.length) {
    if (ka[i] === kb[j]) { dot += a[ka[i]] * b[kb[j]]; i++; j++; }
    else if (ka[i] ${cmp} kb[j]) { i++; }
    else { j++; }
  }
  let na = 0;
  for (const k of ka) { na += a[k] * a[k]; }
  let nb = 0;
  for (const k of kb) { nb += b[k] * b[k]; }
  ${guard}
  return Math.round((dot / (Math.sqrt(na) * Math.sqrt(nb))) * 10000) / 10000;
}`;
      },
    },
  ],
};

export const FLEET_TARGETS = [F1, F2, F3];
