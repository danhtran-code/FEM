// BT05 — Ép ngang, uốn vòng và nứt thành cọc rỗng (mô hình vành đàn hồi).
// Đối chứng: nghiệm M(θ) suy ra lại bằng Castigliano (góc xoay tại điểm đặt
// tải = 0) qua tích phân số; kiểm tra cân bằng tại hông (Q = 0, N = −P/2);
// số liệu B500 tính tay.
// Chạy: node --test tests/bt05.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { ringDiametral, ringCheck } from '../src/modules/xep-coc/ring.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const b500 = () => findPile(specs, 'PHC-B500');

test('M(theta): 0,3183·P·R tai diem dat tai; -0,1817·P·R tai hong', () => {
  const r = ringDiametral(100e3, 0.205);
  approx(r.M_load_Nm_per_m, 100e3 * 0.205 / Math.PI, 1e-9, 'M load');
  approx(r.M_side_Nm_per_m, 100e3 * 0.205 * (1 / Math.PI - 0.5), 1e-9, 'M side');
  approx(r.M_at(0), r.M_load_Nm_per_m, 1e-9, 'M(0)');
  approx(r.M_at(Math.PI / 2), r.M_side_Nm_per_m, 1e-9, 'M(pi/2)');
  approx(r.M_at(Math.PI), r.M_load_Nm_per_m, 1e-9, 'M(pi) doi xung');
  approx(r.N_side_N_per_m, -50e3, 1e-9, 'N hong = -P/2');
  approx(r.N_at(0), 0, 1e-9, 'N tai diem dat tai = 0');
});

test('Castigliano doc lap: goc xoay tai diem dat tai = 0', () => {
  // Góc xoay tương đối giữa hai điểm đặt tải = (R/EI)·∫₀^π M(θ)dθ phải = 0
  // (cả hai điểm đều có góc xoay = 0 do đối xứng).
  const P = 173.89e3, R = 0.205;
  const r = ringDiametral(P, R);
  const N = 20000;
  let sum = 0;
  for (let i = 0; i <= N; i++) {
    const th = (Math.PI * i) / N;
    const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * r.M_at(th);
  }
  const integral = (sum * (Math.PI / N) / 3) * R; // ∫M·R·dθ (bỏ hệ số 1/EI)
  assert.ok(Math.abs(integral) < 1e-6 * P * R * R, `tich phan = ${integral}`);
});

test('Vanh B500 tai ke (F = 17,389 kN, Lc = 0,1 m): sigma ~8,4 MPa, nut theo mo hinh sang loc', () => {
  const chk = ringCheck(b500(), 17.389e3, 0.1, 2.4, 12);
  // P_line = 173,89 kN/m; rm = 0,205 m; W = 0,09²/6 = 0,00135 m³/m.
  approx(chk.P_line_N_per_m, 173.89e3, 0.001, 'P_line');
  approx(chk.M_load_Nm_per_m, 0.31831 * 173.89e3 * 0.205, 0.001, 'M_load');
  approx(chk.sigma_inner_load_Pa / 1e6, 8.40, 0.01, 'sigma tho trong');
  // Hông: |M|/W − P/(2t) = 4,80 − 0,97 = 3,83 MPa < 8,40.
  approx(chk.sigma_outer_side_Pa / 1e6, 3.83, 0.02, 'sigma hong');
  assert.equal(chk.crack_location, 'tho trong tai diem dat tai (dinh/day)');
  assert.equal(chk.cracked_elastic, true);
  approx(chk.utilization_crack, 8.40 / 3.3, 0.01, 'U nut');
  // Chiều dài trải tải cần để không nứt ≈ 0,255 m (> bề rộng kê 0,1 m).
  approx(chk.L_eff_required_m, 0.255, 0.01, 'L_eff_required');
  // Đai thực tế tại x = 2,4 m: gối nằm NGOÀI vùng đầu (L_end = 2·Do = 1,0 m)
  // ⇒ vùng thân giữa, 1 lớp, bước 100 — đúng cảnh báo của Plan (gối có thể
  // rơi vào vùng đai thưa).
  assert.equal(chk.spiral.zone, 'than_giua');
  assert.equal(chk.spiral.layers, 1);
});

test('Vanh B500 coc-coc (F = 20 kN, Lc = 12 m): ung suat khong dang ke', () => {
  const chk = ringCheck(b500(), 20.08e3, 12, 6.0, 12);
  assert.ok(chk.sigma_max_Pa < 0.2e6, `sigma = ${chk.sigma_max_Pa / 1e6} MPa`);
  assert.equal(chk.cracked_elastic, false);
  assert.ok(chk.utilization_crack < 0.1);
});

test('Vanh: ke rong gap doi thi sigma giam mot nua', () => {
  const c1 = ringCheck(b500(), 17.389e3, 0.1, 2.4, 12);
  const c2 = ringCheck(b500(), 17.389e3, 0.2, 2.4, 12);
  approx(c2.sigma_max_Pa, c1.sigma_max_Pa / 2, 0.01, 'sigma ~ 1/Lc');
});

test('Vanh: D lon hon thi sigma giam (W tang nhanh hon rm)', () => {
  const s300 = ringCheck(findPile(specs, 'PHC-B300'), 17.389e3, 0.1, 2.4, 12);
  const s1000 = ringCheck(findPile(specs, 'PHC-B1000'), 17.389e3, 0.1, 2.4, 12);
  assert.ok(s1000.sigma_max_Pa < s300.sigma_max_Pa,
    `D1000 ${s1000.sigma_max_Pa / 1e6} < D300 ${s300.sigma_max_Pa / 1e6} MPa`);
});
