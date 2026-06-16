# Layout Lab — project configs

Layout Lab is one engine (`../layout-lab.html` + `../layout-core.js`) driven by a
per-project config. **To use it on a new project, write one `*.config.js` file —
nothing in the engine changes.**

**This folder holds only `_template.config.js` (a blank to copy) and
`demo.config.js` (a worked example).** Real project configs and their rendered
outputs live **inside the consuming project** (e.g. a `ui-reference/` folder), so the
tool stays generic and private app tokens never land here. Point the engine at your
config with `?config=` (serve a common parent; see the top-level README).

## Add a project

1. Copy `_template.config.js` into your project, e.g. `yourapp/ui-reference/yourapp.config.js`.
2. Fill in the four required keys (the engine supplies everything else):
   - `tokens` — flat groups (`color`, `space`, `radius`, …). Become `--group-key`
     CSS vars and the Tailwind/CSS exports.
   - `renderers` — `{ name: (seed, tokens) => htmlString }`. Pure; no DOM. Use the
     `ll-*` class names (see the engine `<style>`) or your own inline styles with
     `var(--group-key)`.
   - `seed` — real sample data passed to your renderers.
   - `variants` — candidate layouts: `{ id, name, grid:{columns, areas, rows?}, panes }`.
     A pane is `{ render: '<rendererName>' }` or `{ toggle: ['a','b'] }` for a
     switchable pane.
   - `widthPresets` (optional) — `[{label, px}]` width buttons.
3. Open `…/layout-lab.html?config=<path-to-your-config>`.

## Multi-row grids (chrome: headers/toolbars/footers)

Give a variant a multi-row `grid.areas` string plus `grid.rows`, and a renderer per
area. Repeated area names span; `.` is an empty cell. Example:

```js
grid: {
  columns: '1.3fr 1fr 0.8fr',
  rows: 'auto 1fr auto',
  areas: '"head head head" "conv sugg side" "foot foot foot"',
},
panes: { head:{render:'header'}, conv:{render:'messages'}, sugg:{render:'suggestions'},
         side:{toggle:['terms','health']}, foot:{render:'footer'} },
```

Column dividers are draggable in any row. Generic chrome classes available in the
engine: `.ll-bar`, `.ll-logo`, `.ll-title`, `.ll-spacer`, `.ll-ctl`(`.ll-stop`),
`.ll-input`, `.ll-pad`.

## Validate a config

`node --test <your>-config.test.mjs` (copy `demo-config.test.mjs`): it asserts
`validateConfig` passes and every renderer returns non-empty HTML.
