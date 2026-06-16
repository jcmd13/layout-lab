// Layout Lab project config TEMPLATE. Copy to <project>.config.js and fill in.
// Load with: layout-lab.html?config=configs/<project>.config.js
(function (g) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const tokens = {
    color: { shellBg: '#111', textPrimary: '#fff', ok: '#10b981', warn: '#f59e0b', error: '#f43f5e' },
    space: { md: '12px' },
    radius: { panel: '12px' },
  };

  // render(data, tokens) -> HTML string. One per content type your variants reference.
  const renderers = {
    main(seed) { return (seed.items || []).map((x) => `<div class="ll-msg">${esc(x)}</div>`).join(''); },
  };

  const seed = { items: ['First item', 'Second item', 'Third item'] };

  const widthPresets = [{ label: 'Narrow', px: 480 }, { label: 'Wide', px: 960 }];

  const variants = [
    { id: 'one-col', name: 'One column', grid: { columns: '1fr', areas: '"main"' }, panes: { main: { render: 'main' } } },
    { id: 'two-col', name: 'Two column', grid: { columns: '1fr 1fr', areas: '"main aside"' }, panes: { main: { render: 'main' }, aside: { render: 'main' } } },
  ];

  g.LAYOUT_LAB_CONFIG = { project: 'TEMPLATE', tokens, renderers, seed, widthPresets, variants };
})(typeof window !== 'undefined' ? window : globalThis);
