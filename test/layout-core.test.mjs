// Unit tests for LayoutCore pure logic (tools/layout-lab/layout-core.js).
// Repo is CommonJS (no "type":"module"); layout-core.js uses module.exports,
// so it is default-importable here from an ESM test file.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import LayoutCore from '../layout-core.js';

describe('tokensToCssVars', () => {
  it('flattens a nested token map into :root custom properties', () => {
    const tokens = {
      color: { shellBg: 'rgba(24,26,32,0.8)', ok: '#10b981' },
      radius: { panel: '22px' },
    };
    const css = LayoutCore.tokensToCssVars(tokens);
    assert.match(css, /^:root\s*\{/);
    assert.match(css, /--color-shellBg:\s*rgba\(24,26,32,0\.8\);/);
    assert.match(css, /--color-ok:\s*#10b981;/);
    assert.match(css, /--radius-panel:\s*22px;/);
    assert.match(css, /\}\s*$/);
  });

  it('returns an empty :root block for empty tokens', () => {
    assert.equal(LayoutCore.tokensToCssVars({}).replace(/\s/g, ''), ':root{}');
  });
});

describe('tokensToTailwind', () => {
  it('emits a theme.extend block mapping color/space/radius groups', () => {
    const tokens = {
      color: { shellBg: 'rgba(24,26,32,0.8)', ok: '#10b981' },
      space: { md: '12px' },
      radius: { panel: '22px' },
    };
    const out = LayoutCore.tokensToTailwind(tokens);
    assert.match(out, /theme:\s*\{/);
    assert.match(out, /extend:\s*\{/);
    assert.match(out, /colors:\s*\{/);
    assert.match(out, /shellBg:\s*'rgba\(24,26,32,0\.8\)'/);
    assert.match(out, /spacing:\s*\{/);
    assert.match(out, /md:\s*'12px'/);
    assert.match(out, /borderRadius:\s*\{/);
    assert.match(out, /panel:\s*'22px'/);
  });

  it('omits groups that are absent', () => {
    const out = LayoutCore.tokensToTailwind({ color: { ok: '#10b981' } });
    assert.match(out, /colors:/);
    assert.doesNotMatch(out, /spacing:/);
    assert.doesNotMatch(out, /borderRadius:/);
  });
});

describe('grid template export', () => {
  it('gridTemplateColumnsFromSizes joins px tracks', () => {
    assert.equal(
      LayoutCore.gridTemplateColumnsFromSizes([300, 240, 180]),
      '300px 240px 180px',
    );
  });

  it('gridTemplateExport produces a paste-ready CSS block', () => {
    const css = LayoutCore.gridTemplateExport({
      areas: '"conv sugg side"',
      gap: '12px',
      sizes: [300, 240, 180],
    });
    assert.match(css, /display:\s*grid;/);
    assert.match(css, /grid-template-columns:\s*300px 240px 180px;/);
    assert.match(css, /grid-template-areas:\s*"conv sugg side";/);
    assert.match(css, /gap:\s*12px;/);
  });

  it('gridTemplateExport omits areas when not provided', () => {
    const css = LayoutCore.gridTemplateExport({ gap: '8px', sizes: [400, 400] });
    assert.doesNotMatch(css, /grid-template-areas/);
    assert.match(css, /grid-template-columns:\s*400px 400px;/);
  });
});

describe('resizeColumns', () => {
  it('grows left track and shrinks right by the same delta', () => {
    const out = LayoutCore.resizeColumns([300, 300], 0, 50, 80);
    assert.deepEqual(out, [350, 250]);
  });

  it('clamps the shrinking track at minPx and stops the handle', () => {
    // right would go to 50 (< 80); clamp right to 80, left absorbs the rest
    const out = LayoutCore.resizeColumns([300, 300], 0, 250, 80);
    assert.deepEqual(out, [520, 80]);
  });

  it('clamps when dragging the other direction past min', () => {
    const out = LayoutCore.resizeColumns([300, 300], 0, -250, 80);
    assert.deepEqual(out, [80, 520]);
  });

  it('preserves the summed width of the two affected tracks', () => {
    const before = [300, 300];
    const out = LayoutCore.resizeColumns(before, 0, 37, 80);
    assert.equal(out[0] + out[1], before[0] + before[1]);
  });

  it('only touches the two tracks adjacent to the handle', () => {
    const out = LayoutCore.resizeColumns([200, 200, 200], 1, 40, 50);
    assert.equal(out[0], 200);
    assert.deepEqual([out[1], out[2]], [240, 160]);
  });
});

describe('state codec', () => {
  it('round-trips a state object', () => {
    const state = { variant: 'three-frame', width: 780, sizes: { 'three-frame': [300, 240, 180] }, notes: { 'three-frame': 'tight' } };
    const enc = LayoutCore.encodeState(state);
    assert.equal(typeof enc, 'string');
    assert.deepEqual(LayoutCore.decodeState(enc), state);
  });

  it('decodeState returns null on malformed input', () => {
    assert.equal(LayoutCore.decodeState('%%%not-json%%%'), null);
    assert.equal(LayoutCore.decodeState(''), null);
  });
});

describe('validateConfig', () => {
  const good = {
    project: 'x',
    tokens: { color: { ok: '#10b981' } },
    renderers: { messages: () => '<div></div>' },
    seed: { messages: [] },
    variants: [{ id: 'v1', grid: { columns: '1fr', areas: '"main"' }, panes: { main: { render: 'messages' } } }],
  };

  it('accepts a well-formed config', () => {
    const r = LayoutCore.validateConfig(good);
    assert.equal(r.ok, true);
    assert.deepEqual(r.errors, []);
  });

  it('rejects a non-object', () => {
    assert.equal(LayoutCore.validateConfig(null).ok, false);
  });

  it('reports each missing top-level section', () => {
    const r = LayoutCore.validateConfig({ project: 'x' });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /tokens/.test(e)));
    assert.ok(r.errors.some((e) => /renderers/.test(e)));
    assert.ok(r.errors.some((e) => /variants/.test(e)));
  });

  it('requires at least one renderer function', () => {
    const r = LayoutCore.validateConfig({ ...good, renderers: {} });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /renderer/.test(e)));
  });

  it('requires each variant to have id + grid.columns + grid.areas', () => {
    const r = LayoutCore.validateConfig({ ...good, variants: [{ id: 'v1' }] });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /grid/.test(e)));
  });
});

describe('uniqueAreas (multi-row grids)', () => {
  it('returns ordered unique area names from a single-row areas string', () => {
    assert.deepEqual(LayoutCore.uniqueAreas('"conv sugg side"'), ['conv', 'sugg', 'side']);
  });

  it('dedupes spanning names across multiple rows, preserving first-seen order', () => {
    const areas = '"pill pill pill" "conv sugg side" "ctl ctl ctl"';
    assert.deepEqual(LayoutCore.uniqueAreas(areas), ['pill', 'conv', 'sugg', 'side', 'ctl']);
  });

  it('ignores the "." empty-cell token', () => {
    assert.deepEqual(LayoutCore.uniqueAreas('"a . b"'), ['a', 'b']);
  });
});

describe('columnHandleOffsets', () => {
  it('returns N-1 gap-center x positions for column dividers', () => {
    // sizes [300,200,100], gap 12 → boundary0 at 300+6=306, boundary1 at 300+200+12+6=518
    assert.deepEqual(LayoutCore.columnHandleOffsets([300, 200, 100], 12), [306, 518]);
  });

  it('returns empty for a single column', () => {
    assert.deepEqual(LayoutCore.columnHandleOffsets([500], 12), []);
  });
});

describe('defaultColumnSizes (gap-aware, fits the canvas)', () => {
  it('column sums + inter-column gaps equal the total width (no overflow)', () => {
    const sizes = LayoutCore.defaultColumnSizes(3, 1080, 12, 120);
    const sum = sizes.reduce((a, b) => a + b, 0);
    assert.equal(sum + 12 * 2, 1080); // 2 gaps between 3 columns
    assert.deepEqual(sizes, [352, 352, 352]);
  });

  it('puts any rounding remainder on the first column', () => {
    const sizes = LayoutCore.defaultColumnSizes(3, 1000, 12, 120);
    assert.equal(sizes.reduce((a, b) => a + b, 0) + 24, 1000);
    assert.deepEqual(sizes, [326, 325, 325]);
  });

  it('respects minPx when the width is too small', () => {
    assert.deepEqual(LayoutCore.defaultColumnSizes(3, 100, 12, 120), [120, 120, 120]);
  });

  it('single column spans the full width', () => {
    assert.deepEqual(LayoutCore.defaultColumnSizes(1, 780, 12, 120), [780]);
  });
});

describe('columnSizesFromTemplate (honors fr proportions, fits canvas)', () => {
  it('distributes usable width by fr weights and fits exactly', () => {
    const sizes = LayoutCore.columnSizesFromTemplate('1.3fr 1fr 0.8fr', 1080, 12, 120);
    assert.equal(sizes.reduce((a, b) => a + b, 0) + 24, 1080);
    assert.deepEqual(sizes, [444, 340, 272]); // ~1.3 : 1 : 0.8
  });

  it('different proportions produce different splits', () => {
    const conv = LayoutCore.columnSizesFromTemplate('1.7fr 1fr 0.7fr', 1080, 12, 120);
    const sugg = LayoutCore.columnSizesFromTemplate('1fr 1.4fr 0.7fr', 1080, 12, 120);
    assert.notDeepEqual(conv, sugg);
    assert.ok(conv[0] > conv[1] && conv[1] > conv[2]); // conversation widest
    assert.ok(sugg[1] > sugg[0] && sugg[0] > sugg[2]); // suggestions widest
    assert.equal(conv.reduce((a, b) => a + b, 0) + 24, 1080);
  });

  it('single fr column spans the full width', () => {
    assert.deepEqual(LayoutCore.columnSizesFromTemplate('1fr', 780, 12, 120), [780]);
  });
});
