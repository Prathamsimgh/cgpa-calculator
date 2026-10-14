'use strict';

/* =====================================================================
   CGPA -> % Calculator — pure calculation module (no DOM dependencies).
   Safe to require() in Node for tests: DOM wiring is guarded below.
   ===================================================================== */

const PRESETS = [
  {
    id: 'vtu-2018',
    label: 'VTU — 2015 / 2017 / 2018 schemes',
    tpl: '(CGPA − 0.75) × 10',
    tplRev: '(Percentage ÷ 10) + 0.75',
    toPercent: c => (c - 0.75) * 10,
    toCgpa: p => p / 10 + 0.75,
    note: 'Per VTU OBE/CBCS regulation 18OB §7.1: P = (CGPA − 0.75) × 10.'
  },
  {
    id: 'vtu-2021',
    label: 'VTU — 2021 scheme onwards',
    tpl: 'CGPA × 10',
    tplRev: 'Percentage ÷ 10',
    toPercent: c => c * 10,
    toCgpa: p => p / 10,
    note: 'Several sources report VTU dropped the 0.75 adjustment for 2021+ schemes. Verify against your scheme circular.'
  },
  {
    id: 'anna-10',
    label: 'Anna University — ×10',
    tpl: 'CGPA × 10',
    tplRev: 'Percentage ÷ 10',
    toPercent: c => c * 10,
    toCgpa: p => p / 10,
    note: 'Most commonly cited for Anna University (R2017/R2021). Some calculators cite (CGPA − 0.5) × 10 — check your marksheet.'
  },
  {
    id: 'anna-05',
    label: 'Anna University — (CGPA − 0.5) × 10',
    tpl: '(CGPA − 0.5) × 10',
    tplRev: '(Percentage ÷ 10) + 0.5',
    toPercent: c => (c - 0.5) * 10,
    toCgpa: p => p / 10 + 0.5,
    note: 'Alternate formula cited by several calculators for Anna University. Verify against your regulation.'
  },
  {
    id: 'aktu',
    label: 'AKTU — (CGPA − 0.75) × 10',
    tpl: '(CGPA − 0.75) × 10',
    tplRev: '(Percentage ÷ 10) + 0.75',
    toPercent: c => (c - 0.75) * 10,
    toCgpa: p => p / 10 + 0.75,
    note: 'Cited by the majority of sources for AKTU; a few cite plain ×10. Verify against AKTU academic regulations.'
  },
  {
    id: 'gtu',
    label: 'GTU — (CGPA − 0.5) × 10',
    tpl: '(CGPA − 0.5) × 10',
    tplRev: '(Percentage ÷ 10) + 0.5',
    toPercent: c => (c - 0.5) * 10,
    toCgpa: p => p / 10 + 0.5,
    note: 'Per GTU official circular: Percentage = (CGPA − 0.5) × 10.'
  },
  {
    id: 'mumbai',
    label: 'Mumbai University — 7.1 × CGPA + 11',
    tpl: '(7.1 × CGPA) + 11',
    tplRev: '(Percentage − 11) ÷ 7.1',
    toPercent: c => 7.1 * c + 11,
    toCgpa: p => (p - 11) / 7.1,
    note: 'Per MU Circular No. 1883 of 2017 (10-point CBCS). A 2026 circular reportedly changed this — verify.'
  },
  {
    id: 'cbse',
    label: 'CBSE — ×9.5',
    tpl: 'CGPA × 9.5',
    tplRev: 'Percentage ÷ 9.5',
    toPercent: c => c * 9.5,
    toCgpa: p => p / 9.5,
    note: 'CBSE Class 10/12 standard: Percentage = CGPA × 9.5.'
  },
  {
    id: 'generic',
    label: 'Generic 10-point scale — ×10',
    tpl: 'CGPA × 10',
    tplRev: 'Percentage ÷ 10',
    toPercent: c => c * 10,
    toCgpa: p => p / 10,
    note: 'Simple 10-point scale used by many IITs, NITs and private universities.'
  }
];

const CUSTOM_ID = 'custom';

function customPreset(multiplier, offset) {
  const m = Number(multiplier);
  const o = Number(offset);
  return {
    id: CUSTOM_ID,
    label: 'Custom formula',
    tpl: `(CGPA − ${fmt(o)}) × ${fmt(m)}`,
    tplRev: `(Percentage ÷ ${fmt(m)}) + ${fmt(o)}`,
    toPercent: c => (c - o) * m,
    toCgpa: p => p / m + o,
    note: 'Your custom formula: Percentage = (CGPA − offset) × multiplier.'
  };
}

function fmt(n) {
  return String(Math.round((Number(n) + Number.EPSILON) * 100) / 100);
}

function clampPct(v) {
  return Math.min(100, Math.max(0, v));
}

function clampCgpa(v) {
  return Math.min(10, Math.max(0, v));
}

/** Convert CGPA (0–10) to percentage using a preset. Clamps output to 0–100. */
function convertToPercent(cgpa, preset) {
  const raw = preset.toPercent(cgpa);
  const clamped = clampPct(raw);
  return { value: fmt(clamped), raw: fmt(raw), clamped: clamped !== raw };
}

/** Convert percentage (0–100) to CGPA using a preset. Clamps output to 0–10. */
function convertToCgpa(pct, preset) {
  const raw = preset.toCgpa(pct);
  const clamped = clampCgpa(raw);
  return { value: fmt(clamped), raw: fmt(raw), clamped: clamped !== raw };
}

/** Credit-weighted CGPA from [{sgpa, credits}]. Returns null when total credits <= 0. */
function calcCGPA(rows) {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    num += r.sgpa * r.credits;
    den += r.credits;
  }
  if (!(den > 0)) return null;
  return fmt(num / den);
}

function getPreset(id) {
  return PRESETS.find(p => p.id === id) || null;
}

/* Export for Node tests. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRESETS, CUSTOM_ID, customPreset, fmt, convertToPercent, convertToCgpa, calcCGPA, getPreset };
}

/* =====================================================================
   DOM wiring (browser only)
   ===================================================================== */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const $ = id => document.getElementById(id);

    /* ---------- Tabs ---------- */
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const panels = {
      'tab-convert': $('panel-convert'),
      'tab-reverse': $('panel-reverse'),
      'tab-sgpa': $('panel-sgpa')
    };

    function selectTab(tab) {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[t.id].hidden = !on;
      });
      tab.focus({ preventScroll: true });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); selectTab(tabs[j]); }
      });
    });

    /* ---------- University selects ---------- */
    function fillSelect(sel) {
      PRESETS.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label;
        sel.appendChild(opt);
      });
      const custom = document.createElement('option');
      custom.value = CUSTOM_ID;
      custom.textContent = 'Custom formula…';
      sel.appendChild(custom);
    }

    const uniConvert = $('uni-convert');
    const uniReverse = $('uni-reverse');
    fillSelect(uniConvert);
    fillSelect(uniReverse);

    function activePreset(sel, multId, offId) {
      if (sel.value === CUSTOM_ID) {
        const m = parseFloat($(multId).value);
        const o = parseFloat($(offId).value);
        if (!(m > 0) || Number.isNaN(o)) return null;
        return customPreset(m, o);
      }
      return getPreset(sel.value);
    }

    function syncNote(sel, noteEl, multId, offId) {
      const p = activePreset(sel, multId, offId);
      noteEl.textContent = p ? p.note : 'Enter a valid multiplier (above 0) and offset.';
    }

    uniConvert.addEventListener('change', () => {
      $('custom-convert-wrap').hidden = uniConvert.value !== CUSTOM_ID;
      syncNote(uniConvert, $('uni-convert-note'), 'custom-mult', 'custom-off');
    });
    uniReverse.addEventListener('change', () => {
      $('custom-reverse-wrap').hidden = uniReverse.value !== CUSTOM_ID;
      syncNote(uniReverse, $('uni-reverse-note'), 'custom-mult-r', 'custom-off-r');
    });
    ['custom-mult', 'custom-off'].forEach(id =>
      $(id).addEventListener('input', () => syncNote(uniConvert, $('uni-convert-note'), 'custom-mult', 'custom-off')));
    ['custom-mult-r', 'custom-off-r'].forEach(id =>
      $(id).addEventListener('input', () => syncNote(uniReverse, $('uni-reverse-note'), 'custom-mult-r', 'custom-off-r')));

    syncNote(uniConvert, $('uni-convert-note'), 'custom-mult', 'custom-off');
    syncNote(uniReverse, $('uni-reverse-note'), 'custom-mult-r', 'custom-off-r');

    /* ---------- Validation helpers ---------- */
    function setError(input, errEl, msg) {
      if (msg) {
        errEl.textContent = msg;
        errEl.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        return false;
      }
      errEl.hidden = true;
      errEl.textContent = '';
      input.removeAttribute('aria-invalid');
      return true;
    }

    function parseBounded(input, errEl, min, max, name) {
      const raw = input.value.trim();
      if (raw === '') return setError(input, errEl, `Please enter your ${name}.`), null;
      const v = Number(raw);
      if (!Number.isFinite(v)) return setError(input, errEl, `“${raw}” is not a valid number.`), null;
      if (v < min || v > max) return setError(input, errEl, `${name} must be between ${min} and ${max}.`), null;
      setError(input, errEl, '');
      return v;
    }

    /* ---------- CGPA -> % ---------- */
    $('form-convert').addEventListener('submit', e => {
      e.preventDefault();
      const cgpa = parseBounded($('cgpa-in'), $('convert-err'), 0, 10, 'CGPA');
      const preset = activePreset(uniConvert, 'custom-mult', 'custom-off');
      if (!preset) { setError($('custom-mult'), $('convert-err'), 'Custom multiplier must be a number above 0.'); return; }
      if (cgpa === null) { $('result-convert').hidden = true; return; }

      const r = convertToPercent(cgpa, preset);
      $('result-convert-value').textContent = r.value + '%';
      $('result-convert-formula').innerHTML =
        'Formula: <code>' + preset.tpl.replace('CGPA', fmt(cgpa)) + ' = ' + r.value + '%</code>';
      const noteEl = $('result-convert-note');
      if (r.clamped) {
        noteEl.textContent = `The formula gives ${r.raw}%, which is outside 0–100, so it is shown clamped.`;
        noteEl.hidden = false;
      } else {
        noteEl.hidden = true;
      }
      $('result-convert').hidden = false;
      $('copy-convert').dataset.text = `${fmt(cgpa)} CGPA (${preset.label}) = ${r.value}%`;
    });

    $('reset-convert').addEventListener('click', () => {
      $('form-convert').reset();
      $('custom-convert-wrap').hidden = true;
      $('result-convert').hidden = true;
      setError($('cgpa-in'), $('convert-err'), '');
      syncNote(uniConvert, $('uni-convert-note'), 'custom-mult', 'custom-off');
    });

    /* ---------- % -> CGPA ---------- */
    $('form-reverse').addEventListener('submit', e => {
      e.preventDefault();
      const pct = parseBounded($('pct-in'), $('reverse-err'), 0, 100, 'percentage');
      const preset = activePreset(uniReverse, 'custom-mult-r', 'custom-off-r');
      if (!preset) { setError($('pct-in'), $('reverse-err'), 'Custom multiplier must be a number above 0.'); return; }
      if (pct === null) { $('result-reverse').hidden = true; return; }

      const r = convertToCgpa(pct, preset);
      $('result-reverse-value').textContent = r.value;
      $('result-reverse-formula').innerHTML =
        'Formula: <code>' + preset.tplRev.replace('Percentage', fmt(pct)) + ' = ' + r.value + '</code>';
      const noteEl = $('result-reverse-note');
      if (r.clamped) {
        noteEl.textContent = `The formula gives ${r.raw}, which is outside 0–10, so it is shown clamped.`;
        noteEl.hidden = false;
      } else {
        noteEl.hidden = true;
      }
      $('result-reverse').hidden = false;
      $('copy-reverse').dataset.text = `${fmt(pct)}% (${preset.label}) = ${r.value} CGPA`;
    });

    $('reset-reverse').addEventListener('click', () => {
      $('form-reverse').reset();
      $('custom-reverse-wrap').hidden = true;
      $('result-reverse').hidden = true;
      setError($('pct-in'), $('reverse-err'), '');
      syncNote(uniReverse, $('uni-reverse-note'), 'custom-mult-r', 'custom-off-r');
    });

    /* ---------- Copy buttons ---------- */
    async function copyText(btn) {
      const text = btn.dataset.text || '';
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = old; }, 1500);
    }
    $('copy-convert').addEventListener('click', e => copyText(e.currentTarget));
    $('copy-reverse').addEventListener('click', e => copyText(e.currentTarget));

    /* ---------- SGPA -> CGPA ---------- */
    const rowsEl = $('sgpa-rows');
    let semCount = 0;

    function addSgpaRow(sgpa = '', credits = '') {
      semCount += 1;
      const n = semCount;
      const row = document.createElement('div');
      row.className = 'sgpa-row';
      row.innerHTML =
        '<p class="row-title">Semester ' + n + '</p>' +
        '<div><label for="sgpa-' + n + '">SGPA (0–10)</label>' +
        '<input type="number" id="sgpa-' + n + '" inputmode="decimal" step="any" min="0" max="10" placeholder="e.g. 8.2" value="' + sgpa + '"></div>' +
        '<div><label for="cred-' + n + '">Credits</label>' +
        '<input type="number" id="cred-' + n + '" inputmode="numeric" step="1" min="1" placeholder="e.g. 24" value="' + credits + '"></div>' +
        '<button type="button" class="btn small" data-remove aria-label="Remove semester ' + n + '">Remove</button>';
      row.querySelector('[data-remove]').addEventListener('click', () => {
        row.remove();
        renumberRows();
      });
      rowsEl.appendChild(row);
    }

    function renumberRows() {
      Array.from(rowsEl.children).forEach((row, i) => {
        row.querySelector('.row-title').textContent = 'Semester ' + (i + 1);
      });
    }

    addSgpaRow();
    addSgpaRow();
    $('sgpa-add').addEventListener('click', () => addSgpaRow());

    $('form-sgpa').addEventListener('submit', e => {
      e.preventDefault();
      const rows = [];
      let ok = true;
      Array.from(rowsEl.children).forEach((row, i) => {
        const sgpaIn = row.querySelector('input[id^="sgpa-"]');
        const credIn = row.querySelector('input[id^="cred-"]');
        const sgpa = parseBounded(sgpaIn, $('sgpa-err'), 0, 10, `SGPA for semester ${i + 1}`);
        const cred = parseBounded(credIn, $('sgpa-err'), 1, 1000, `credits for semester ${i + 1}`);
        if (sgpa === null || cred === null) { ok = false; return; }
        rows.push({ sgpa, credits: cred });
      });
      if (!ok || rows.length === 0) {
        if (rows.length === 0) setError(rowsEl, $('sgpa-err'), 'Add at least one semester.');
        $('result-sgpa').hidden = true;
        return;
      }
      setError(rowsEl, $('sgpa-err'), '');
      const cgpa = calcCGPA(rows);
      $('result-sgpa-value').textContent = cgpa;
      const total = rows.reduce((s, r) => s + r.credits, 0);
      $('result-sgpa-formula').innerHTML =
        'Formula: <code>Σ(SGPA × credits) ÷ Σ(credits) = ' + cgpa + '</code> <span class="hint">(' + total + ' total credits)</span>';
      $('result-sgpa').hidden = false;
      $('use-in-converter').dataset.cgpa = cgpa;
    });

    $('use-in-converter').addEventListener('click', e => {
      const cgpa = e.currentTarget.dataset.cgpa;
      selectTab($('tab-convert'));
      $('cgpa-in').value = cgpa;
      $('cgpa-in').focus();
    });

    $('reset-sgpa').addEventListener('click', () => {
      rowsEl.innerHTML = '';
      semCount = 0;
      addSgpaRow();
      addSgpaRow();
      $('result-sgpa').hidden = true;
      setError(rowsEl, $('sgpa-err'), '');
    });

    /* ---------- Formula reference table ---------- */
    const tbody = $('formula-tbody');
    PRESETS.forEach(p => {
      const tr = document.createElement('tr');
      const ex = convertToPercent(8.5, p);
      tr.innerHTML =
        '<td>' + p.label + '</td>' +
        '<td><code>' + p.tpl + '</code></td>' +
        '<td class="num">' + ex.value + '%</td>';
      tbody.appendChild(tr);
    });
  });
}
