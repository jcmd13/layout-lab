// Loads the demo config (a classic script that assigns globalThis.LAYOUT_LAB_CONFIG)
// in a VM sandbox and asserts it is a valid LayoutCore config whose renderers produce HTML.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import LayoutCore from '../layout-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadConfig() {
  const src = readFileSync(path.resolve(__dirname, '../configs/demo.config.js'), 'utf8');
  const sandbox = {};
  sandbox.globalThis = sandbox; // config may target globalThis or window
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.LAYOUT_LAB_CONFIG;
}

describe('demo.config.js', () => {
  let cfg;
  before(() => { cfg = loadConfig(); });

  it('is a valid LayoutCore config', () => {
    const r = LayoutCore.validateConfig(cfg);
    assert.deepEqual(r.errors, []);
    assert.equal(r.ok, true);
  });

  it('defines the example variants (incl. a multi-row chrome variant)', () => {
    // cfg is loaded in a separate VM realm, so its arrays carry that realm's
    // Array.prototype; deepStrictEqual checks prototypes. Normalize into this
    // realm with Array.from / spread before comparing.
    const ids = Array.from(cfg.variants, (v) => v.id).sort();
    assert.deepEqual(ids, ['current', 'three-frame', 'two-frame', 'with-chrome'].sort());
  });

  it('the multi-row chrome variant has rows + a multi-row areas string', () => {
    const wc = cfg.variants.find((v) => v.id === 'with-chrome');
    assert.ok(wc.grid.rows, 'with-chrome needs grid.rows');
    assert.ok(wc.grid.areas.split('"').filter((s) => s.trim()).length >= 3, 'expected >= 3 area rows');
  });

  it('every renderer returns a non-empty HTML string for the seed', () => {
    for (const name of Object.keys(cfg.renderers)) {
      const html = cfg.renderers[name](cfg.seed, cfg.tokens);
      assert.equal(typeof html, 'string', `${name} must return a string`);
      assert.ok(html.trim().length > 0, `${name} must return non-empty HTML`);
    }
  });

  it('the three-frame variant has a term<->health toggle pane', () => {
    const tf = cfg.variants.find((v) => v.id === 'three-frame');
    const togglePane = Object.values(tf.panes).find((p) => Array.isArray(p.toggle));
    assert.ok(togglePane, 'three-frame needs a pane with a toggle array');
    assert.deepEqual([...togglePane.toggle].sort(), ['health', 'termAppendix'].sort());
  });
});
