// Giao diện module xếp cọc — BT01/BT02 (mốc M1 + giao diện đầu tiên).
// Chạy trên trình duyệt qua HTTP (GitHub Pages / web server nội bộ /
// python3 -m http.server); ES Modules nên không mở trực tiếp bằng file://.
import { findPile } from '../modules/xep-coc/pile_specs.js';
import { analyseSinglePile } from '../modules/xep-coc/bt01.js';
import { analyseSinglePileWithLoads } from '../modules/xep-coc/bt02.js';
import { parseInputs, fmt } from './inputs.js';
import { buildDiagramSeries, buildStationTable, schematicSvg } from './diagrams.js';

let SPECS = null;

function $(id) {
  return document.getElementById(id);
}

function showErrors(errors) {
  const box = $('form-errors');
  if (!errors || errors.length === 0) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }
  box.classList.remove('hidden');
  box.innerHTML = '<strong>Chưa tính được:</strong><ul class="list-disc pl-5 mt-1">'
    + errors.map((e) => `<li>${e}</li>`).join('') + '</ul>';
}

function loadRow(kind = 'point', P_kN = '', x_m = '', length_m = '') {
  const tr = document.createElement('tr');
  tr.className = 'load-row border-t';
  tr.innerHTML = `
    <td class="py-1 pr-2"><select class="load-kind w-full border rounded px-1 py-1 text-sm">
      <option value="point"${kind === 'point' ? ' selected' : ''}>Tải điểm</option>
      <option value="patch"${kind === 'patch' ? ' selected' : ''}>Tải vệt</option>
    </select></td>
    <td class="py-1 pr-2"><input type="number" step="any" min="0" class="load-P w-full border rounded px-2 py-1 text-sm" placeholder="kN" value="${P_kN}"></td>
    <td class="py-1 pr-2"><input type="number" step="any" min="0" class="load-x w-full border rounded px-2 py-1 text-sm" placeholder="m" value="${x_m}"></td>
    <td class="py-1 pr-2"><input type="number" step="any" min="0" class="load-len w-full border rounded px-2 py-1 text-sm" placeholder="m" value="${length_m}"${kind === 'patch' ? '' : ' disabled'}></td>
    <td class="py-1"><button type="button" class="load-del text-red-600 text-sm">Xóa</button></td>`;
  tr.querySelector('.load-kind').addEventListener('change', (ev) => {
    tr.querySelector('.load-len').disabled = ev.target.value !== 'patch';
  });
  tr.querySelector('.load-del').addEventListener('click', () => tr.remove());
  return tr;
}

function readLoadRows() {
  return [...document.querySelectorAll('.load-row')].map((tr) => ({
    kind: tr.querySelector('.load-kind').value,
    P_kN: tr.querySelector('.load-P').value,
    x_m: tr.querySelector('.load-x').value,
    length_m: tr.querySelector('.load-len').value,
  }));
}

function renderReference(pile) {
  const pc = pile.pc_bar;
  $('ref-panel').innerHTML = `
    <dl class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt class="text-slate-500">Mã cọc</dt><dd class="font-medium">${pile.code} — cấp ${pile.class}</dd>
      <dt class="text-slate-500">Bản vẽ</dt><dd>Phan Vũ v${pile.drawing_version} (${pile.drawing_no})</dd>
      <dt class="text-slate-500">Do / Dp / Di</dt><dd>${pile.Do_mm} / ${pile.Dp_mm} / ${pile.Di_mm} mm</dd>
      <dt class="text-slate-500">Chiều dày t</dt><dd>${pile.t_mm} mm</dd>
      <dt class="text-slate-500">Thép DƯL</dt><dd>${pc.N1}⌀${pc.d_mm} mm, f<sub>pu</sub> = ${pc.fpu_MPa} MPa</dd>
      <dt class="text-slate-500">M<sub>cr</sub> / M<sub>u</sub> (công bố)</dt><dd>${pile.Mcr_kNm} / ${pile.Mu_kNm} kN·m</dd>
      <dt class="text-slate-500">Tải thi công (công bố)</dt><dd>${pile.install_load_T} T</dd>
    </dl>
    <p class="text-xs text-slate-500 mt-2">Số liệu công bố chỉ để tham khảo — không dùng làm ngưỡng tính (Plan v0.5.0 §6).</p>`;
}

function supportLines(beam) {
  return beam.supports_m.map((x) => ({
    type: 'line', x0: x, x1: x, y0: 0, y1: 1, yref: 'paper',
    line: { color: '#94a3b8', width: 1, dash: 'dot' },
  }));
}

function plotChart(id, series, yLabel, color) {
  const Plotly = globalThis.Plotly;
  const el = $(id);
  if (!Plotly) {
    el.innerHTML = '<p class="text-sm text-red-600">Không tải được Plotly (cần mạng để lấy CDN).</p>';
    return;
  }
  Plotly.newPlot(el, [{
    x: series.x_m, y: series.y, mode: 'lines', line: { color, width: 2 }, name: yLabel,
  }], {
    margin: { l: 60, r: 20, t: 10, b: 45 },
    xaxis: { title: 'x dọc cọc (m)' },
    yaxis: { title: yLabel, zeroline: true, zerolinecolor: '#cbd5e1' },
    shapes: supportLines(series.beam),
    showlegend: false,
  }, { responsive: true, displaylogo: false });
}

function renderResults(result, isBT02) {
  const { beam, display } = result;
  $('bt-label').textContent = isBT02 ? 'BT02 — có tải tầng trên' : 'BT01 — chỉ tự trọng';
  $('res-R1').textContent = `${fmt(display.R1_kN)} kN`;
  $('res-R2').textContent = `${fmt(display.R2_kN)} kN`;
  $('res-Mmax').textContent = `${fmt(display.M_max_kNm)} kN·m @ x = ${fmt(display.M_max_x_m, 2)} m`;
  $('res-Mmin').textContent = `${fmt(display.M_min_kNm)} kN·m @ x = ${fmt(display.M_min_x_m, 2)} m`;
  const qMax = Math.max(Math.abs(beam.extrema.Q_max_N.value), Math.abs(beam.extrema.Q_min_N.value)) / 1000;
  $('res-Qmax').textContent = `${fmt(qMax)} kN`;
  const vMax = beam.extrema.deflection_down_max_m;
  $('res-vmax').textContent = `${fmt(vMax.value * 1000)} mm xuống @ x = ${fmt(vMax.x_m, 2)} m`;
  const eq = result.equilibrium;
  $('res-equilibrium').textContent = `ΣF = ${eq.sumF_N.toExponential(1)} N · ΣM = ${eq.sumM_Nm.toExponential(1)} N·m (phải ≈ 0)`;

  $('schematic').innerHTML = schematicSvg({
    pile_code: result.pile_code,
    L_m: result.inputs.L_m,
    x1_m: result.inputs.x1_m,
    x2_m: result.inputs.x2_m,
    loads: result.inputs.loads || [],
    reactions: result.reactions,
    w_kN_per_m: result.inputs.w_N_per_m / 1000,
  });

  const series = buildDiagramSeries(beam);
  plotChart('chart-M', { x_m: series.x_m, y: series.M_kNm, beam }, 'M (kN·m)', '#1d4ed8');
  plotChart('chart-Q', { x_m: series.x_m, y: series.Q_kN, beam }, 'Q (kN)', '#047857');
  plotChart('chart-v', { x_m: series.x_m, y: series.vDown_mm, beam }, 'Chuyển vị (mm, + xuống)', '#b45309');

  $('station-table').innerHTML = buildStationTable(beam).map((s) => `
    <tr class="border-t">
      <td class="py-1 pr-2">${s.label}</td>
      <td class="py-1 pr-2 text-right">${fmt(s.x_m)}</td>
      <td class="py-1 pr-2 text-right">${fmt(s.M_kNm)}</td>
      <td class="py-1 pr-2 text-right">${fmt(s.Q_kN)}</td>
      <td class="py-1 text-right">${fmt(s.vDown_mm)}</td>
    </tr>`).join('');

  $('results').classList.remove('hidden');
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function run() {
  const parsed = parseInputs({
    pileCode: $('pile-select').value,
    L_m: $('input-L').value,
    x1_m: $('input-x1').value,
    x2_m: $('input-x2').value,
    E_MPa: $('input-Eb').value,
    gamma_kN_m3: $('input-gamma').value,
    loadRows: readLoadRows(),
  });
  if (!parsed.ok) {
    showErrors(parsed.errors);
    return;
  }
  showErrors([]);
  const pile = findPile(SPECS, $('pile-select').value);
  try {
    const result = parsed.opts.loads.length === 0
      ? analyseSinglePile(pile, parsed.opts)
      : analyseSinglePileWithLoads(pile, parsed.opts);
    renderResults(result, parsed.opts.loads.length > 0);
  } catch (err) {
    showErrors([`Lỗi tính toán: ${err.message}`]);
  }
}

async function init() {
  const res = await fetch('../../data_in/pile_specs.json');
  SPECS = await res.json();
  const sel = $('pile-select');
  for (const p of SPECS.piles) {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = `${p.code} — D${p.Do_mm} cấp ${p.class}`;
    sel.appendChild(opt);
  }
  sel.value = 'PHC-B500';
  renderReference(findPile(SPECS, 'PHC-B500'));
  sel.addEventListener('change', () => renderReference(findPile(SPECS, sel.value)));
  $('btn-add-load').addEventListener('click', () => $('loads-body').appendChild(loadRow()));
  $('btn-run').addEventListener('click', run);
  // Tính ngay trường hợp mốc để mở trang đã có hình.
  await run();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch((err) => showErrors([`Không tải được dữ liệu cọc: ${err.message}`]));
  });
}
