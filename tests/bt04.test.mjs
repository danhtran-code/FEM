// BT04 — Nén tại vùng tiếp xúc cọc–kê / cọc–cọc (Hertz + TCVN 5574 §8.1.5).
// Đối chứng: tích phân số áp lực Hertz = lực đặt; quy luật tỉ lệ Hertz;
// diện tích tiếp xúc ≪ tiết diện cọc và ≪ tiết diện gỗ (không lấy bằng).
// Chạy: node --test tests/bt04.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile, sectionGeometry } from '../src/modules/xep-coc/pile_specs.js';
import {
  hertzCylinderContact, localBearingCheck, pileBearerContact, pilePileContact,
} from '../src/modules/xep-coc/contact.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const b500 = () => findPile(specs, 'PHC-B500');

test('Hertz: tich phan ap luc tren vet tiep xuc = luc dat', () => {
  const h = hertzCylinderContact({
    F_N: 17389, R1_m: 0.25, R2_m: Infinity,
    E1_Pa: 42e9, nu1: 0.2, E2_Pa: Infinity, nu2: 0, Lc_m: 0.1,
  });
  // Tích phân số p(s) trên [-a, a] × Lc (Simpson, 2001 điểm).
  const N = 2000;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const s = -h.a_m + (2 * h.a_m * i) / N;
    const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * h.pressureAt(s);
  }
  const F_int = (sum * (2 * h.a_m / N) / 3) * 0.1;
  approx(F_int, 17389, 0.001, 'tich phan ap luc');
  assert.equal(h.pressureAt(h.a_m * 1.01), 0);
});

test('Hertz: F x4 => a x2, p0 x2; p_mean = (pi/4)·p0', () => {
  const base = { R1_m: 0.25, R2_m: Infinity, E1_Pa: 42e9, nu1: 0.2, E2_Pa: Infinity, nu2: 0, Lc_m: 0.1 };
  const h1 = hertzCylinderContact({ ...base, F_N: 10000 });
  const h4 = hertzCylinderContact({ ...base, F_N: 40000 });
  approx(h4.a_m, 2 * h1.a_m, 1e-9, 'a ~ sqrt(F)');
  approx(h4.p0_Pa, 2 * h1.p0_Pa, 1e-9, 'p0 ~ sqrt(F)');
  approx(h1.p_mean_Pa, (Math.PI / 4) * h1.p0_Pa, 1e-9, 'p_mean = pi/4 p0');
});

test('Coc-ke B500 (phan luc BT01 17,389 kN, ke 100 mm): a ~1,13 mm, p0 ~98 MPa', () => {
  const c = pileBearerContact(b500(), 17.389e3, {});
  approx(c.a_m * 1000, 1.125, 0.01, 'a mm');
  approx(c.p0_Pa / 1e6, 98.4, 0.01, 'p0 MPa');
  approx(c.p_mean_Pa / 1e6, 77.3, 0.01, 'p_mean MPa');
  approx(c.area_m2, 2.25e-4, 0.01, 'dien tich tiep xuc');
  // Diện tích tiếp xúc ≪ tiết diện cọc (0,1159 m²) và ≪ tiết diện gỗ (0,01 m²).
  const { A_m2 } = sectionGeometry(b500());
  assert.ok(c.area_m2 < 0.01 * A_m2, 'A_tx << A_coc');
  assert.ok(c.area_m2 < 0.05 * 0.01, 'A_tx << A_go');
  // φb = 0,8·√9 = 2,4 (chưa chạm trần 2,5); Rb,loc = 98,4 MPa.
  approx(c.bearing.phi_b, 2.4, 0.001, 'phi_b');
  approx(c.bearing.Rb_loc_Pa / 1e6, 98.4, 0.001, 'Rb,loc');
  // (116): N_allow = 0,75·98,4·2,25e-4 ≈ 16,6 kN ⇒ U ≈ 1,05 — vượt nhẹ
  // giới hạn lý tưởng (xem thuyết minh: mô hình cứng là thiên về an toàn).
  approx(c.bearing.N_allow_N / 1e3, 16.6, 0.01, 'N_allow');
  approx(c.bearing.utilization, 1.047, 0.01, 'U bearing');
  assert.equal(c.bearing.ok, false);
});

test('Coc-ke: ke rong gap doi (Lc 0,2 m) thi U giam theo 1/sqrt(Lc)', () => {
  const c1 = pileBearerContact(b500(), 17.389e3, { Lc_m: 0.1 });
  const c2 = pileBearerContact(b500(), 17.389e3, { Lc_m: 0.2 });
  approx(c2.bearing.utilization, c1.bearing.utilization / Math.SQRT2, 0.01, 'U ~ 1/sqrt(Lc)');
  assert.ok(c2.bearing.ok, 'ke doi thi dat');
});

test('Coc-coc B500: F = 20 kN tren Lc = 12 m, p0 ~9,7 MPa, U ~0,10', () => {
  const c = pilePileContact(b500(), 20.08e3, { Lc_m: 12 });
  approx(c.a_m * 1000, 0.11, 0.02, 'a mm');
  approx(c.p0_Pa / 1e6, 9.65, 0.02, 'p0 MPa');
  approx(c.bearing.utilization, 0.103, 0.02, 'U bearing');
  assert.ok(c.bearing.ok);
  // Lc là bắt buộc (không mặc định bằng L cọc khi chưa xác lập).
  assert.throws(() => pilePileContact(b500(), 20e3, {}), /bat buoc/);
});

test('Nen cuc bo (116)-(118): phi_b kep trong [1,0; 2,5]', () => {
  // Ab,max/Ab,loc rất lớn ⇒ φb chạm trần 2,5.
  const chk = localBearingCheck({ F_N: 1000, width_m: 0.001, Lc_m: 0.1, Ab_max_m2: 1 });
  assert.equal(chk.phi_b, 2.5);
  // Ab,max = Ab,loc ⇒ φb = 0,8 → kẹp lên 1,0.
  const chk2 = localBearingCheck({ F_N: 1000, width_m: 0.01, Lc_m: 0.1, Ab_max_m2: 0.001 });
  assert.equal(chk2.phi_b, 1.0);
});
