// Demo project config for Layout Lab — a generic "assistant overlay" example.
// Self-contained: no real-app tokens or content. Copy _template.config.js to start
// your own. Classic script: assigns the config to window (browser) or globalThis
// (Node VM test).
(function (g) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const tokens = {
    color: {
      shellBg: 'rgba(20,22,28,0.85)',
      shellBorder: 'rgba(255,255,255,0.10)',
      textPrimary: 'rgba(255,255,255,0.95)',
      textMuted: 'rgba(255,255,255,0.60)',
      ok: '#22c55e', warn: '#f59e0b', error: '#ef4444',
      accentBlue: '#3b82f6',
      accent1: '#22c55e', accent2: '#6366f1',
      accent3: '#f59e0b', accent4: '#06b6d4',
    },
    space: { xs: '4px', sm: '8px', md: '12px', lg: '16px' },
    radius: { panel: '20px', chip: '9999px', code: '12px' },
    blur: { shell: '14px' },
    font: { family: '-apple-system, system-ui, sans-serif', base: '14px', code: '13px' },
  };

  // Generic "card kind" taxonomy — rename freely for your own app.
  const KIND = {
    suggestion: { color: 'var(--color-accent1)', label: 'SUGGESTION' },
    summary: { color: 'var(--color-accent2)', label: 'SUMMARY' },
    questions: { color: 'var(--color-accent3)', label: 'QUESTIONS' },
    note: { color: 'var(--color-accent4)', label: 'NOTE' },
    plain: { color: 'var(--color-textMuted)', label: '' },
  };

  const renderers = {
    messages(seed) {
      return (seed.messages || []).map((m) => {
        if (m.role === 'you') {
          return `<div class="ll-msg ll-user">${esc(m.text)}</div>`;
        }
        if (m.role === 'them') {
          return `<div class="ll-msg ll-interviewer"><span class="ll-rolechip">speaker</span>${esc(m.text)}</div>`;
        }
        const meta = KIND[m.kind] || KIND.plain;
        const badge = meta.label ? `<span class="ll-badge" style="color:${meta.color};border-color:${meta.color}">${meta.label}</span>` : '';
        return `<div class="ll-msg ll-system" style="border-left:3px solid ${meta.color}">${badge}${esc(m.text)}</div>`;
      }).join('');
    },
    suggestions(seed) {
      const cards = (seed.messages || []).filter((m) => m.role === 'assistant');
      return `<div class="ll-cards">${cards.map((m) => {
        const meta = KIND[m.kind] || KIND.plain;
        return `<div class="ll-card" style="border-color:${meta.color}"><div class="ll-card-h" style="color:${meta.color}">${meta.label || 'NOTE'}</div><div class="ll-card-b">${esc(m.text)}</div></div>`;
      }).join('')}</div>`;
    },
    termAppendix(seed) {
      return `<div class="ll-terms">${(seed.glossary || []).map((k) =>
        `<div class="ll-term"><span class="ll-term-k">${esc(k.term)}</span><span class="ll-term-d">${esc(k.def)}</span></div>`).join('')}</div>`;
    },
    health(seed) {
      const h = seed.health || {};
      const pill = (label, status) => {
        const c = status === 'ok' || status === 'connected' ? 'var(--color-ok)'
          : status === 'degraded' || status === 'reconnecting' ? 'var(--color-warn)' : 'var(--color-error)';
        return `<div class="ll-pill" style="color:${c};border-color:${c}">${label}: ${status}</div>`;
      };
      return `<div class="ll-health">${pill('Model', h.model)}${pill('Stream A', h.streamA)}${pill('Stream B', h.streamB)}</div>`;
    },
    // Example app "chrome" renderers — show that multi-row grids can host real controls.
    header(seed) {
      return `<div class="ll-bar"><span class="ll-logo">●</span><span class="ll-title">${esc((seed.app || {}).title || 'Assistant')}</span><span class="ll-spacer"></span><button class="ll-ctl">Settings</button><button class="ll-ctl ll-stop">Stop</button></div>`;
    },
    footer() {
      return `<div class="ll-bar"><input class="ll-input" placeholder="Type a message…" /><button class="ll-ctl">Ask</button></div>`;
    },
  };

  const seed = {
    messages: [
      { role: 'them', text: 'Can you summarize the key risks in this proposal?' },
      { role: 'you', text: 'Sure — give me one second to pull the highlights.' },
      { role: 'assistant', kind: 'suggestion', text: 'Lead with the budget overrun; it is the biggest risk and easiest to quantify.' },
      { role: 'assistant', kind: 'summary', text: 'Covered so far: scope, timeline, and the two open dependencies.' },
      { role: 'assistant', kind: 'questions', text: 'Ask: who owns the integration? what is the fallback if vendor X slips?' },
    ],
    glossary: [
      { term: 'MVP', def: 'Minimum viable product' },
      { term: 'SLA', def: 'Service-level agreement' },
      { term: 'burn rate', def: 'Rate at which a budget is spent over time' },
    ],
    health: { model: 'ok', streamA: 'connected', streamB: 'degraded' },
  };

  const widthPresets = [
    { label: 'Narrow', px: 600 },
    { label: 'Medium', px: 780 },
    { label: 'Wide', px: 1040 },
  ];

  const variants = [
    {
      id: 'current', name: 'Single column',
      grid: { columns: '1fr', areas: '"main"' },
      panes: { main: { render: 'messages' } },
    },
    {
      id: 'three-frame', name: 'Three-Frame',
      grid: { columns: '1.3fr 1fr 0.8fr', areas: '"conv sugg side"' },
      panes: {
        conv: { render: 'messages' },
        sugg: { render: 'suggestions' },
        side: { toggle: ['termAppendix', 'health'] },
      },
    },
    {
      id: 'two-frame', name: 'Two-Frame + drawer',
      grid: { columns: '1.4fr 1fr', areas: '"conv sugg"' },
      panes: { conv: { render: 'messages' }, sugg: { render: 'suggestions' } },
      drawer: { render: 'termAppendix' },
    },
    {
      id: 'with-chrome', name: 'Three-Frame + header/footer (multi-row)',
      grid: {
        columns: '1.3fr 1fr 0.8fr',
        rows: 'auto 1fr auto',
        areas: '"head head head" "conv sugg side" "foot foot foot"',
      },
      panes: {
        head: { render: 'header' },
        conv: { render: 'messages' },
        sugg: { render: 'suggestions' },
        side: { toggle: ['termAppendix', 'health'] },
        foot: { render: 'footer' },
      },
    },
  ];

  g.LAYOUT_LAB_CONFIG = { project: 'demo', tokens, renderers, seed, widthPresets, variants };
})(typeof window !== 'undefined' ? window : globalThis);
