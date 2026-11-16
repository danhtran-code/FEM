// Test dữ liệu biểu đồ + sơ đồ giao diện — chạy: node --test tests/ui_diagrams.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { analyseSinglePile } from '../src/modules/xep-coc/bt01.js';
import { buildDiagramSeries, buildStationTable, schematicSvg, momentChartYAxis } from '../src/ui/diagrams.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const pile = findPile(specs, 'PHC-B500');
const result = analyseSinglePile(pile, { L_m: 12, x1_m: 2.4, x2_m: 9.6 });
const { beam } = result;

test('buildDiagramSeries: 241 diem, gia tri khop moc BT01', () => {
  const s = buildDiagramSeries(beam);
  assert.equal(s.x_m.length, 241);
  assert.equal(s.x_m[0], 0);
  assert.equal(s.x_m[240], 12);
  const at = (arr, x) => arr[Math.round((x / 12) * 240)];
  assert.ok(Math.abs(at(s.M_kNm, 6) - 10.433) < 0.01, `M(6) = ${at(s.M_kNm, 6)}`);
  assert.ok(Math.abs(at(s.M_kNm, 0)) < 1e-9);
  assert.ok(Math.abs(at(s.Q_kN, 2.4) - 10.433) < 0.01, `Q phai goi 1 = ${at(s.Q_kN, 2.4)}`);
  assert.ok(Math.abs(at(s.vDown_mm, 6) - 0.441) < 0.01, `vong giua nhip = ${at(s.vDown_mm, 6)}`);
  // Đầu hẫng võng lên → vDown âm (hiệu chính mốc chuẩn).
  assert.ok(Math.abs(at(s.vDown_mm, 0) + 0.224) < 0.01, `vDown(0) = ${at(s.vDown_mm, 0)}`);
});

test('buildStationTable: 5 tram, M/Q tai goi khop', () => {
  const rows = buildStationTable(beam);
  assert.equal(rows.length, 5);
  assert.equal(rows[1].label, 'Gối 1');
  assert.ok(Math.abs(rows[1].M_kNm + 8.347) < 0.01);
  assert.ok(Math.abs(rows[1].Q_kN - 10.433) < 0.01);
  assert.ok(Math.abs(rows[2].M_kNm - 10.433) < 0.01, 'M giua nhip');
  assert.ok(Math.abs(rows[0].M_kNm) < 1e-9 && Math.abs(rows[4].M_kNm) < 1e-9);
});

test('momentChartYAxis: M duong ve xuong, M am ve len (dao truc y, giu gia tri)', () => {
  const axis = momentChartYAxis();
  assert.equal(axis.autorange, 'reversed');
  assert.ok(axis.title.includes('+ xuống'));
  // Giá trị M không bị đổi dấu ở tầng dữ liệu — chỉ trục y đảo chiều.
  const s = buildDiagramSeries(beam);
  assert.ok(Math.abs(s.M_kNm[Math.round((6 / 12) * 240)] - 10.433) < 0.01, 'M(6) van duong 10,433');
});

test('schematicSvg: co ma coc, phan luc, kich thuoc a1/nhip/a2', () => {
  const svg = schematicSvg({
    pile_code: 'PHC-B500',
    L_m: 12,
    x1_m: 2.4,
    x2_m: 9.6,
    loads: [{ P_N: 20000, x_m: 3.4, length_m: 0 }],
    reactions: beam.reactions,
    w_kN_per_m: 2.898,
  });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('PHC-B500'));
  assert.ok(svg.includes('R1 = 17.39 kN'));
  assert.ok(svg.includes('R2 = 17.39 kN'));
  assert.ok(svg.includes('a1 = 2.4 m'));
  assert.ok(svg.includes('nhịp 7.2 m'));
  assert.ok(svg.includes('a2 = 2.4 m'));
  assert.ok(svg.includes('P = 20.0 kN'));
  assert.ok(svg.includes('tự trọng w = 2.898 kN/m'));
});
