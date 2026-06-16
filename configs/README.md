# Layout Lab — project configs

Layout Lab is one engine (`../layout-lab.html` + `../layout-core.js`) driven by a
per-project config. **To use it on a new project, write one `*.config.js` file —
nothing in the engine changes.**

## Add a project

1. Copy `_template.config.js` to `<project>.config.js`.
2. Fill in the four required keys (the engine supplies everything else):
   - `tokens` — flat groups (`color`, `space`, `radius`, …). Become `--group-key`
     CSS vars and the Tailwind/CSS exports.
   - `renderers` — `{ name: (seed, tokens) => htmlString }`. Pure; no DOM. Use the
     `ll-*` class names (see the engine `<style>`) or your own inline styles with
     `var(--group-key)`.
   - `seed` — real sample data passed to your renderers.
   - `variants` — candidate layouts: `{ id, name, grid:{columns, areas}, panes }`.
     A pane is `{ render: '<rendererName>' }` or `{ toggle: ['a','b'] }` for a
     switchable pane.
   - `widthPresets` (optional) — `[{label, px}]` width buttons.
3. Open `../layout-lab.html?config=configs/<project>.config.js`.

## Validate a config

`node --test test/<project>-config.test.mjs` (copy `demo-config.test.mjs`):
it asserts `validateConfig` passes and every renderer returns non-empty HTML.
