// BT00 tests — chạy: node --test tests/bt00.test.mjs
// Ngưỡng: hình học khớp giá trị tính tay trong 0,1%; mọi bản ghi phải validate ok.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  sectionGeometry, pcSteelArea, gcSteelArea, sectionAt,
  selfWeightPerMetre, dataStatus, validatePile, findPile, MISSING,
} from '../src/modules/xep-coc/pile_specs.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));

test('BT00: du 33 ma coc, khong trung lap, co du truong bat buoc', () => {
  assert.equal(specs.piles.length, 33);
  assert.equal(new Set(specs.piles.map((p) => p.code)).size, 33);
  for (const p of specs.piles) {
    assert.ok(p.Do_mm && p.Dp_mm && p.Di_mm && p.t_mm);
    assert.ok(p.pc_bar.d_mm && p.pc_bar.N1 > 0);
    assert.ok(p.Mcr_kNm > 0 && p.Mu_kNm > p.Mcr_kNm);
    assert.ok(p.install_load_T > 0);
    assert.ok(p.drawing_no);
  }
});

test('BT00: hinh hoc khop gia tri tinh tay (A, I, W)', () => {
  // Tinh tay doc lap: A=pi/4*(Do^2-Di^2), I=pi/64*(Do^4-Di^4), W=I/(Do/2)
  const cases = [
    { code: 'PHC-A300', A: 45238.9, I: 3.461e8, W: 2.307e6 },
    { code: 'PHC-A500', A: 115924.8, I: 2.553e9, W: 1.021e7 },
    { code: 'PHC-A1000', A: 378247.8, I: 3.590e10, W: 7.179e7 },
  ];
  for (const c of cases) {
    const g = sectionGeometry(findPile(specs, c.code));
    assert.ok(Math.abs(g.A_mm2 - c.A) / c.A < 0.001, `${c.code} A`);
    assert.ok(Math.abs(g.I_mm4 - c.I) / c.I < 0.001, `${c.code} I`);
    assert.ok(Math.abs(g.W_mm3 - c.W) / c.W < 0.001, `${c.code} W`);
    assert.ok(Math.abs(g.t_mm - (findPile(specs, c.code).Do_mm - findPile(specs, c.code).Di_mm) / 2) < 1e-9);
  }
});

test('BT00: thep PC va GC', () => {
  const a300 = findPile(specs, 'PHC-A300');
  assert.ok(Math.abs(pcSteelArea(a300) - 6 * Math.PI / 4 * 7.1 ** 2) < 1e-9);
  assert.equal(gcSteelArea(a300), 0);
  const a600 = findPile(specs, 'PHC-A600');
  assert.ok(Math.abs(gcSteelArea(a600) - 5 * Math.PI / 4 * 14 ** 2) < 1e-9);
  // Chi Do>=600 moi co GC
  for (const p of specs.piles) {
    assert.equal(!!p.gc_bar, p.Do_mm >= 600, p.code);
  }
});

test('BT00: section(x) — vung dau 2Do, buoc 50/2 lop; than giua buoc 100/1 lop', () => {
  const a500 = findPile(specs, 'PHC-A500'); // Do=500, L_end=1000
  const L = 12000;
  const head = sectionAt(a500, 500, L);
  assert.equal(head.zone, 'dau_coc');
  assert.equal(head.spiral_pitch_mm, 50);
  assert.equal(head.spiral_layers, 2);
  const mid = sectionAt(a500, 6000, L);
  assert.equal(mid.zone, 'than_giua');
  assert.equal(mid.spiral_pitch_mm, 100);
  assert.equal(mid.spiral_layers, 1);
  // Vi tri goi ke thuong roi vao than giua neu x1,x2 nam giua: kiem tra bien
  assert.equal(sectionAt(a500, 1000, L).zone, 'than_giua'); // dung tai bien L_end
  assert.throws(() => sectionAt(a500, -1, L));
  assert.throws(() => sectionAt(a500, L + 1, L));
  // GC chi co trong L2=1000 tu moi dau (Do>=600)
  const a600 = findPile(specs, 'PHC-A600');
  assert.equal(sectionAt(a600, 500, L).has_gc, true);
  assert.equal(sectionAt(a600, 6000, L).has_gc, false);
});

test('BT00: tu trong — gamma_c tieu chuan 25 kN/m3, co the ghi de', () => {
  const a300 = findPile(specs, 'PHC-A300');
  const w = selfWeightPerMetre(a300);
  assert.equal(w.status, 'standard_25kN_m3');
  assert.equal(w.gamma_kN_m3, 25);
  // A = 0,0452389 m2 * 25 = 1,131 kN/m
  assert.ok(Math.abs(w.w_kN_per_m - 1.131) < 0.001);
  const withGamma = selfWeightPerMetre(a300, 26);
  assert.ok(Math.abs(withGamma.w_kN_per_m - 0.0452389 * 26) < 1e-6);
});

test('BT00: validate tat ca ban ghi; Mu/Mcr trong khoang hop ly', () => {
  for (const p of specs.piles) {
    const v = validatePile(p);
    assert.equal(v.ok, true, `${p.code}: ${v.errors.join(', ')}`);
    assert.ok(v.Mu_over_Mcr > 1 && v.Mu_over_Mcr < 2.5, `${p.code} Mu/Mcr=${v.Mu_over_Mcr}`);
  }
});

test('BT00: trang thai du lieu — mac thep GC/dai va L van la thieu; sigma_pc/Eb/Ep/gamma da xac dinh theo tieu chuan', () => {
  for (const p of specs.piles) {
    const s = dataStatus(p);
    const missing = s.thieu.map((x) => x.field);
    for (const f of ['GC bar grade', 'spiral steel grade', 'L']) assert.ok(missing.includes(f), `${p.code} thieu ${f}`);
    assert.ok(!missing.includes('sigma_pc'), `${p.code}: sigma_pc da xac dinh theo TCVN 7888 §6.5`);
    assert.equal(s.back_check_available, true); // co Mcr/Mu de doi chieu o BT03
  }
});
