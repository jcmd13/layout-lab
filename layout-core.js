// LayoutCore — pure logic for Layout Lab. NO DOM access.
// UMD-lite: works as a classic <script> in the browser (sets globalThis.LayoutCore,
// loads over file:// and http) AND as a CommonJS module in Node (module.exports),
// so node --test can default-import it from a .mjs file. No build step.
(function (global) {
  'use strict';

  function tokensToCssVars(tokens) {
    const lines = [];
    for (const group of Object.keys(tokens || {})) {
      const entries = tokens[group] || {};
      for (const key of Object.keys(entries)) {
        lines.push(`  --${group}-${key}: ${entries[key]};`);
      }
    }
    return lines.length ? `:root {\n${lines.join('\n')}\n}` : ':root {}';
  }

  function tokensToTailwind(tokens) {
    const t = tokens || {};
    const obj = (group) => {
      const e = t[group] || {};
      const keys = Object.keys(e);
      if (!keys.length) return null;
      return keys.map((k) => `        ${k}: '${e[k]}'`).join(',\n');
    };
    const groups = [
      ['colors', obj('color')],
      ['spacing', obj('space')],
      ['borderRadius', obj('radius')],
    ].filter(([, body]) => body);
    const body = groups
      .map(([name, lines]) => `      ${name}: {\n${lines}\n      }`)
      .join(',\n');
    return `module.exports = {\n  theme: {\n    extend: {\n${body}\n    }\n  }\n};`;
  }

  function gridTemplateColumnsFromSizes(sizes) {
    return (sizes || []).map((s) => `${Math.round(s)}px`).join(' ');
  }

  function gridTemplateExport({ areas, gap, sizes }) {
    const lines = [
      'display: grid;',
      `grid-template-columns: ${gridTemplateColumnsFromSizes(sizes)};`,
    ];
    if (areas) lines.push(`grid-template-areas: ${areas};`);
    if (gap) lines.push(`gap: ${gap};`);
    return lines.join('\n');
  }

  // Ordered, de-duplicated area names from a (possibly multi-row) grid-template-areas
  // string. '"pill pill" "a b"' -> ['pill','a','b']. The "." empty-cell token is dropped.
  function uniqueAreas(areasStr) {
    const seen = new Set();
    const out = [];
    for (const name of String(areasStr || '').replace(/"/g, ' ').trim().split(/\s+/)) {
      if (!name || name === '.') continue;
      if (!seen.has(name)) { seen.add(name); out.push(name); }
    }
    return out;
  }

  // Center x of each internal column divider, accounting for the inter-column gap.
  // Used to place full-height drag handles over a (possibly multi-row) grid.
  function columnHandleOffsets(sizes, gap) {
    const out = [];
    let x = 0;
    for (let i = 0; i < sizes.length - 1; i++) {
      x += sizes[i];
      out.push(x + gap * i + gap / 2);
    }
    return out;
  }

  function resizeColumns(sizes, handleIndex, deltaPx, minPx) {
    const out = sizes.slice();
    const i = handleIndex;
    const pair = out[i] + out[i + 1];
    let left = out[i] + deltaPx;
    // Clamp left into [minPx, pair - minPx] so neither track drops below min
    // and the summed width of the pair is preserved.
    const max = pair - minPx;
    if (left < minPx) left = minPx;
    if (left > max) left = max;
    out[i] = left;
    out[i + 1] = pair - left;
    return out;
  }

  function encodeState(state) {
    return encodeURIComponent(JSON.stringify(state));
  }

  function decodeState(str) {
    if (!str) return null;
    try {
      return JSON.parse(decodeURIComponent(str));
    } catch (_e) {
      return null;
    }
  }

  function validateConfig(config) {
    const errors = [];
    if (!config || typeof config !== 'object') {
      return { ok: false, errors: ['config must be an object'] };
    }
    if (!config.tokens || typeof config.tokens !== 'object') errors.push('missing tokens object');
    const rend = config.renderers;
    if (!rend || typeof rend !== 'object') {
      errors.push('missing renderers object');
    } else if (!Object.values(rend).some((fn) => typeof fn === 'function')) {
      errors.push('renderers must contain at least one function');
    }
    if (!config.seed || typeof config.seed !== 'object') errors.push('missing seed object');
    if (!Array.isArray(config.variants) || config.variants.length === 0) {
      errors.push('variants must be a non-empty array');
    } else {
      config.variants.forEach((v, idx) => {
        if (!v || !v.id) errors.push(`variant[${idx}] missing id`);
        if (!v || !v.grid || !v.grid.columns || !v.grid.areas) {
          errors.push(`variant[${idx}] missing grid.columns/grid.areas`);
        }
      });
    }
    return { ok: errors.length === 0, errors };
  }

  const LayoutCore = {
    tokensToCssVars, tokensToTailwind,
    gridTemplateColumnsFromSizes, gridTemplateExport,
    uniqueAreas, columnHandleOffsets,
    resizeColumns, encodeState, decodeState, validateConfig,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LayoutCore;
  global.LayoutCore = LayoutCore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
