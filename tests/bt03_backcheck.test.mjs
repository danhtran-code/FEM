// BT03 (phần đối chiếu sigma_pc) — chạy: node --test tests/bt03_backcheck.test.mjs
// Nguồn: TCVN 7888:2014 §6.5/§6.6 + Bảng 1, JIS A 5337 / Phụ lục A.
// Ngưỡng: Mcr đối chiếu |sai số| trung bình < 3%, tối đa < 10%;
// Mu = kr*Mcr khớp trong 0,5%; sigma_pe suy ra 600-950 MPa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  sigmaCeNominal, sigmaPeFromNominal, mcrBackcheck, muCheck,
  prestressForwardJIS, SIGMA_CE_BY_CLASS, KR_BY_CLASS,
} from '../src/modules/xep-coc/prestress.js';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));

test('sigma_ce danh nghia theo cap tai: A 4, AB 6, B 8, C 10 MPa (TCVN 7888 §6.5)', () => {
  assert.deepEqual(SIGMA_CE_BY_CLASS, { A: 4, AB: 6, B: 8, C: 10 });
  for (const p of specs.piles) {
    assert.equal(sigmaCeNominal(p), SIGMA_CE_BY_CLASS[p.class]);
    assert.equal(p.prestress.sigma_ce_MPa, SIGMA_CE_BY_CLASS[p.class]);
  }
});

test('sigma_pe suy tu sigma_ce: 600-950 MPa, khop phuong phap thuan JIS trong ~15%', () => {
  for (const p of specs.piles) {
    const spe = sigmaPeFromNominal(p);
    assert.ok(spe > 600 && spe < 950, `${p.code} sigma_pe=${spe}`);
    assert.ok(Math.abs(spe - p.prestress.sigma_pe_MPa) < 1, p.code);
    const fwd = prestressForwardJIS(p);
    // sigma_ce thuan JIS (4-11 MPa) phai cung bac do voi sigma_ce danh nghia
    assert.ok(Math.abs(fwd.sig_ce_forward_MPa - sigmaCeNominal(p)) < 2.5,
      `${p.code} forward ${fwd.sig_ce_forward_MPa} vs nominal ${sigmaCeNominal(p)}`);
    assert.ok(fwd.sig_pe_MPa > 700 && fwd.sig_pe_MPa < 900, `${p.code} fwd sigma_pe`);
  }
});

test('Mcr doi chieu: Mcr = W*(fr + sigma_ce), fr=6,3 MPa — sai so TB <3%, max <10%', () => {
  const errs = [];
  for (const p of specs.piles) {
    const bc = mcrBackcheck(p);
    errs.push(Math.abs(bc.rel_err));
    assert.ok(Math.abs(bc.rel_err) < 0.10, `${p.code} Mcr err ${bc.rel_err}`);
    assert.ok(bc.fr_implied_MPa > 5 && bc.fr_implied_MPa < 7.5, `${p.code} fr_implied`);
  }
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
  assert.ok(mean < 0.03, `mean |Mcr err| = ${mean}`);
});

test('Mu = kr*Mcr (TCVN 7888 §6.6) khop Mu cong bo trong 0,5% cho 33/33 ma', () => {
  assert.deepEqual(KR_BY_CLASS, { A: 1.5, AB: 1.65, B: 1.8, C: 2.0 });
  for (const p of specs.piles) {
    const c = muCheck(p);
    assert.ok(Math.abs(c.rel_err) < 0.005, `${p.code} Mu err ${c.rel_err}`);
  }
});

test('Vat lieu theo tieu chuan: Eb 42000, Ep 200000, gamma 25; L co khoang theo Do', () => {
  assert.equal(specs.common.materials_determined_by_standard.concrete_80MPa_cyl.Eb_MPa, 42000);
  assert.equal(specs.common.materials_determined_by_standard.pc_steel.Ep_MPa, 200000);
  assert.equal(specs.common.materials_determined_by_standard.gamma_c_kN_m3, 25);
  for (const p of specs.piles) {
    assert.ok(Array.isArray(p.length_range_m) && p.length_range_m[0] === 6);
    assert.ok(p.self_weight.w_kN_per_m > 0);
    if (p.code === 'PHC-AB600') assert.equal(p.shear_capacity_kN_TCVN7888, null); // Bang 1 khong liet ke V cho AB600
    else assert.ok(p.shear_capacity_kN_TCVN7888 > 0, `${p.code} thieu V TCVN`);
  }
  // Vi du: D300 w = 1,131 kN/m; D1000 w = 9,456 kN/m (gamma 25)
  assert.ok(Math.abs(findPile(specs, 'PHC-A300').self_weight.w_kN_per_m - 1.131) < 0.001);
  assert.ok(Math.abs(findPile(specs, 'PHC-C1000').self_weight.w_kN_per_m - 9.456) < 0.001);
});
