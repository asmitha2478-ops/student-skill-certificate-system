'use strict';

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const prettify = (s) => { const t = String(s).replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

const state = { meta: [], lookups: {}, entity: null, rows: [], search: '' };
const main = $('#main');
const dlg = $('#dlg');
const form = $('#form');

async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'The request failed.');
    err.details = data && data.details;
    throw err;
  }
  return data;
}

let toastTimer;
function toast(message, isError = false) {
  const t = $('#toast');
  t.textContent = message;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 3800);
}

async function ensureLookup(ref) {
  if (!state.lookups[ref]) state.lookups[ref] = await api(`/lookup/${ref}`);
  return state.lookups[ref];
}

function statusBadge(value) {
  const cls = { Valid: 'ok', 'Expiring soon': 'warn', Expired: 'bad', 'No expiry': 'none' }[value] || 'none';
  return `<span class="badge ${cls}">${esc(value)}</span>`;
}

// ---------- navigation ----------
function renderNav(active) {
  const items = [
    `<li><a href="#/dashboard" ${active === 'dashboard' ? 'aria-current="page"' : ''}>Overview</a></li>`,
    ...state.meta.map(
      (e) => `<li><a href="#/${e.key}" ${active === e.key ? 'aria-current="page"' : ''}>${esc(e.label)}</a></li>`
    ),
    '<li class="divider" aria-hidden="true"></li>',
    `<li><a href="#/reports" ${active === 'reports' ? 'aria-current="page"' : ''}>SQL queries</a></li>`,
  ];
  $('#nav').innerHTML = items.join('');
}

function route() {
  const key = location.hash.replace(/^#\/?/, '') || 'dashboard';
  renderNav(key);
  document.title = 'Skill and Certificate Registry';
  if (key === 'dashboard') return showDashboard();
  if (key === 'reports') return showReports();
  const entity = state.meta.find((e) => e.key === key);
  if (entity) return showEntity(entity);
  location.hash = '#/dashboard';
}

// ---------- dashboard ----------
async function showDashboard() {
  main.innerHTML = `
    <div class="page-head"><div>
      <h1>Overview</h1>
      <p class="lead">Records for students, their skills, and the certificates they have earned.</p>
    </div></div>
    <div class="table-wrap ledger"><table>
      <thead><tr><th>Records</th><th class="num">Total</th><th></th></tr></thead>
      <tbody id="ledger"></tbody>
    </table></div>`;
  try {
    const stats = await api('/stats');
    $('#ledger').innerHTML = state.meta
      .map((e) => `<tr><td>${esc(e.label)}</td><td class="num">${stats[e.key]}</td><td><a href="#/${e.key}">Open</a></td></tr>`)
      .join('');
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- entity pages ----------
function showEntity(entity) {
  state.entity = entity;
  state.search = '';
  const singular = entity.singular.toLowerCase();
  main.innerHTML = `
    <div class="page-head">
      <h1>${esc(entity.label)}</h1>
      <div class="toolbar">
        <input id="search" class="search" type="search" placeholder="Search ${esc(entity.label.toLowerCase())}" aria-label="Search ${esc(entity.label.toLowerCase())}">
        <button class="btn primary" id="addBtn" type="button">Add ${esc(singular)}</button>
      </div>
    </div>
    <div id="tableArea"></div>
    <p class="count" id="count"></p>`;

  let timer;
  $('#search').addEventListener('input', (ev) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = ev.target.value.trim(); loadRows(); }, 250);
  });
  $('#addBtn').addEventListener('click', () => openForm(entity, null));
  loadRows();
}

async function loadRows() {
  const entity = state.entity;
  try {
    const rows = await api(`/${entity.key}?q=${encodeURIComponent(state.search)}`);
    if (state.entity !== entity) return; // user navigated away
    state.rows = rows;
    renderTable(entity, rows);
  } catch (err) {
    toast(err.message, true);
  }
}

function renderTable(entity, rows) {
  const area = $('#tableArea');
  if (!rows.length) {
    area.innerHTML = `<div class="table-wrap"><p class="empty">${
      state.search
        ? `No ${esc(entity.label.toLowerCase())} match “${esc(state.search)}”.`
        : `No ${esc(entity.label.toLowerCase())} yet. Use “Add ${esc(entity.singular.toLowerCase())}” to create the first one.`
    }</p></div>`;
    $('#count').textContent = '';
    return;
  }
  const head = entity.columns.map((c) => `<th>${esc(c.label)}</th>`).join('') + '<th><span class="visually-hidden">Actions</span></th>';
  const body = rows
    .map((row, i) => {
      const cells = entity.columns
        .map((c) => {
          const v = row[c.key];
          if (c.badge) return `<td>${statusBadge(v)}</td>`;
          return `<td>${v === null || v === undefined || v === '' ? '<span class="muted">—</span>' : esc(v)}</td>`;
        })
        .join('');
      return `<tr>${cells}<td class="actions">
        <button class="btn small" type="button" data-edit="${i}">Edit</button>
        <button class="btn small danger" type="button" data-delete="${i}">Delete</button></td></tr>`;
    })
    .join('');
  area.innerHTML = `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  $('#count').textContent = `${rows.length} ${rows.length === 1 ? 'record' : 'records'}`;

  area.querySelectorAll('[data-edit]').forEach((b) =>
    b.addEventListener('click', () => openForm(entity, state.rows[Number(b.dataset.edit)])));
  area.querySelectorAll('[data-delete]').forEach((b) =>
    b.addEventListener('click', () => deleteRow(entity, state.rows[Number(b.dataset.delete)])));
}

const keyPath = (entity, row) => `/${entity.key}/${entity.pk.map((k) => row[k]).join('/')}`;

async function deleteRow(entity, row) {
  if (!confirm(`Delete this ${entity.singular.toLowerCase()}? This cannot be undone.`)) return;
  try {
    const res = await api(keyPath(entity, row), { method: 'DELETE' });
    toast(res.message);
    state.lookups = {}; // dropdown contents may have changed
    loadRows();
  } catch (err) {
    toast(err.message, true);
  }
}

// ---------- add / edit form ----------
function fieldHtml(entity, f, row, editing) {
  const id = `f_${f.name}`;
  const value = row ? row[f.name] : '';
  const locked = editing && (f.auto || entity.pk.includes(f.name));
  const attrs = `id="${id}" name="${f.name}" ${f.required ? 'required' : ''} ${locked ? 'disabled' : ''}`;
  let control;

  if (f.type === 'enum') {
    control = `<select ${attrs}><option value="">Select…</option>${f.options
      .map((o) => `<option value="${esc(o)}" ${o === value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  } else if (f.type === 'fk') {
    const options = state.lookups[f.ref] || [];
    control = `<select ${attrs}><option value="">${f.required ? 'Select…' : 'None'}</option>${options
      .map((o) => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
  } else if (f.type === 'int') {
    control = `<input ${attrs} type="number" step="1" ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} value="${esc(value)}">`;
  } else if (f.type === 'date') {
    control = `<input ${attrs} type="date" value="${esc(value)}">`;
  } else if (f.type === 'email') {
    control = `<input ${attrs} type="email" maxlength="${f.max}" value="${esc(value)}">`;
  } else if (f.type === 'phone') {
    control = `<input ${attrs} type="tel" inputmode="tel" pattern="\\+?[0-9]{10,15}" title="10 to 15 digits, with an optional leading +" value="${esc(value)}">`;
  } else {
    control = `<input ${attrs} type="text" maxlength="${f.max}" value="${esc(value)}">`;
  }

  return `<label for="${id}">${esc(f.label)}${f.required || f.auto ? '' : ' <span class="opt">(optional)</span>'}</label>${control}${
    f.hint ? `<small>${esc(f.hint)}</small>` : ''}`;
}

async function openForm(entity, row) {
  const editing = Boolean(row);
  const singular = entity.singular.toLowerCase();
  try {
    for (const f of entity.fields) if (f.type === 'fk') await ensureLookup(f.ref);
  } catch (err) {
    return toast(err.message, true);
  }

  const fields = entity.fields.filter((f) => !(f.auto && !editing)).map((f) => fieldHtml(entity, f, row, editing)).join('');
  form.innerHTML = `
    <h2 id="dlgTitle">${editing ? 'Edit' : 'Add'} ${esc(singular)}</h2>
    <div id="formErrors" class="errors" role="alert" hidden></div>
    ${fields}
    <div class="actions">
      <button type="button" class="btn" id="cancelBtn">Cancel</button>
      <button type="submit" class="btn primary">${editing ? 'Save changes' : `Add ${esc(singular)}`}</button>
    </div>`;

  $('#cancelBtn').addEventListener('click', () => dlg.close());

  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const body = {};
    for (const f of entity.fields) {
      const el = form.elements[f.name];
      if (el && !el.disabled) body[f.name] = el.value;
    }

    // Extra client-side check; the server repeats every validation rule.
    if (body.issue_date && body.expiry_date && body.expiry_date < body.issue_date) {
      return showFormErrors('Expiry date cannot be earlier than the issue date.');
    }

    try {
      const res = editing
        ? await api(keyPath(entity, row), { method: 'PUT', body: JSON.stringify(body) })
        : await api(`/${entity.key}`, { method: 'POST', body: JSON.stringify(body) });
      dlg.close();
      toast(res.message);
      state.lookups = {};
      loadRows();
    } catch (err) {
      showFormErrors(err.message, err.details);
    }
  };

  dlg.showModal();
  const first = form.querySelector('input:not([disabled]), select:not([disabled])');
  if (first) first.focus();
}

function showFormErrors(message, details) {
  const box = $('#formErrors');
  box.hidden = false;
  box.innerHTML = `${esc(message)}${details && details.length ? `<ul>${details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}`;
  box.scrollIntoView({ block: 'nearest' });
}

// ---------- SQL queries page ----------
async function showReports() {
  main.innerHTML = `
    <div class="page-head"><div>
      <h1>SQL queries</h1>
      <p class="lead">Ready-made searches and summaries. Each one runs a real SQL query against the database, and the query is shown below the controls.</p>
    </div></div>
    <div class="reports">
      <ul class="report-list" id="reportList"></ul>
      <section id="reportBody" aria-live="polite"><p class="muted">Choose a query from the list.</p></section>
    </div>`;
  let reports;
  try { reports = await api('/reports'); } catch (err) { return toast(err.message, true); }

  const list = $('#reportList');
  list.innerHTML = reports.map((r) => `<li><button type="button" data-id="${r.id}">${esc(r.title)}</button></li>`).join('');
  list.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => {
      list.querySelectorAll('button').forEach((x) => x.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
      openReport(reports.find((r) => r.id === b.dataset.id));
    }));
}

async function openReport(report) {
  const body = $('#reportBody');
  for (const p of report.params) if (p.type === 'lookup') await ensureLookup(p.ref).catch(() => {});

  const controls = report.params.map((p) => {
    if (p.type === 'lookup') {
      const opts = state.lookups[p.ref] || [];
      return `<div class="field"><label for="p_${p.name}">${esc(p.label)}</label>
        <select id="p_${p.name}" name="${p.name}" required><option value="">Select…</option>${
          opts.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('')}</select></div>`;
    }
    return `<div class="field"><label for="p_${p.name}">${esc(p.label)}</label>
      <input id="p_${p.name}" name="${p.name}" type="number" step="1" min="${p.min}" max="${p.max}" value="${p.default ?? ''}" required></div>`;
  }).join('');

  body.innerHTML = `
    <h2>${esc(report.title)}</h2>
    <p class="muted">${esc(report.description)}</p>
    <form class="param-form" id="paramForm">${controls}<button class="btn primary" type="submit">Run query</button></form>
    <pre class="sql" tabindex="0">${esc(report.sql)}</pre>
    <div id="result"></div>`;

  const run = async (ev) => {
    if (ev) ev.preventDefault();
    const pf = $('#paramForm');
    const qs = new URLSearchParams(report.params.map((p) => [p.name, pf.elements[p.name].value]));
    try {
      const data = await api(`/reports/${report.id}?${qs}`);
      renderResult(data);
    } catch (err) {
      toast(err.message, true);
    }
  };
  $('#paramForm').addEventListener('submit', run);
  if (!report.params.length) run();
}

function renderResult({ columns, rows }) {
  const out = $('#result');
  if (!rows.length) { out.innerHTML = '<div class="table-wrap"><p class="empty">The query ran and returned no rows.</p></div>'; return; }
  const head = columns.map((c) => `<th class="${typeof rows[0][c] === 'number' ? 'num' : ''}">${esc(prettify(c))}</th>`).join('');
  const body = rows.map((r) => `<tr>${columns.map((c) =>
    `<td class="${typeof r[c] === 'number' ? 'num' : ''}">${r[c] === null ? '<span class="muted">—</span>' : esc(r[c])}</td>`).join('')}</tr>`).join('');
  out.innerHTML = `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    <p class="count">${rows.length} ${rows.length === 1 ? 'row' : 'rows'} returned</p>`;
}

// ---------- start ----------
(async function init() {
  try {
    state.meta = await api('/meta');
  } catch (err) {
    main.innerHTML = `<h1>Cannot reach the server</h1><p class="lead">${esc(err.message)}</p>`;
    return;
  }
  window.addEventListener('hashchange', route);
  route();
})();
