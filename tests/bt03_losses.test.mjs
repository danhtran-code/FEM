// BT03 (đầy đủ) — Tổn hao theo TCVN 5574:2018 §9.1.
// Đối chứng: từng khoản tổn hao kiểm tra bằng tính tay độc lập (xem chú thích
// từng test); tổng tổn hao ≥ 100 MPa (9.1.10); σpe/σpc cùng bậc độ với đối
// chiếu chẩn đoán BT03 phần 1 (σpe danh nghĩa 678–878 MPa) nhưng KHÔNG hiệu
// chỉnh để khớp — chênh lệch do ΔT mặc định 65 °C (81 MPa) được ghi rõ.
// Chạy: node --test tests/bt03_losses.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import {
  prestressLosses, transferCheck, transformedSection,
} from '../src/modules/xep-coc/prestress_losses.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const MPA = 1e6;

test('B500: tung khoan ton hao khop tinh tay (207)(211)(212)(213)', () => {
  const p = findPile(specs, 'PHC-B500');
  const r = prestressLosses(p, {}, 12);
  // σsp = min(0,8·1275, 0,7·1420) = 994 MPa (sai số làm tròn nhị phân).
  approx(r.sigma_sp_Pa, 994 * MPA, 1e-9, 'sigma_sp');
  // (207): 0,1·994 − 20 = 79,4 MPa.
  approx(r.losses.d_sp1_Pa, 79.4 * MPA, 0.001, 'd_sp1');
  // (211): 1,25·65 = 81,25 MPa.
  approx(r.losses.d_sp2_Pa, 81.25 * MPA, 0.001, 'd_sp2');
  // (212) mac dinh: 30 MPa.
  assert.equal(r.losses.d_sp3_Pa, 30 * MPA);
  // (213): (2 mm/12 m)·200.000 = 33,33 MPa.
  approx(r.losses.d_sp4_Pa, (0.002 / 12) * 200e9, 0.001, 'd_sp4');
  // Thứ nhất: 224,0 MPa; σsp(1) = 770,0 MPa.
  approx(r.losses.first_Pa, 223.98 * MPA, 0.002, 'first losses');
  approx(r.losses.sigma_sp1_Pa, 770.02 * MPA, 0.002, 'sigma_sp1');
  // P(1) = Ap·σsp(1): Ap = 14·π/4·10,7² = 1258,9 mm² ⇒ 969,4 kN.
  approx(r.losses.P1_N, 969.4e3, 0.005, 'P(1)');
});

test('B500: co ngot/tu bien (215)(216) va sigma_pe/sigma_pc', () => {
  const p = findPile(specs, 'PHC-B500');
  const r = prestressLosses(p, {}, 12);
  // Co ngan dan hoi: σsp(1)/(1+α·Ap/Ared); α = 200/42 = 4,7619.
  // Ared ≈ 121.919 mm² ⇒ σsp,el ≈ 733,9 MPa.
  approx(r.losses.sigma_sp_after_elastic_Pa, 733.9 * MPA, 0.005, 'sigma_sp after elastic');
  // σbpj = P_el/Ared ≈ 7,58 MPa.
  approx(r.losses.sigma_bpj_Pa, 7.58 * MPA, 0.01, 'sigma_bpj');
  // (215): 0,0003·200.000·0,85 = 51,0 MPa.
  approx(r.losses.d_sp5_Pa, 51.0 * MPA, 0.001, 'd_sp5');
  // (216): 0,8·α·φ·σbpj/[1+α·μ·(1+0,8φ)]·0,85 ≈ 31,1 MPa (φ = 1,4).
  approx(r.losses.d_sp6_Pa, 31.1 * MPA, 0.01, 'd_sp6');
  // Tổng (1..6) ≈ 306 MPa ≥ 100 MPa (9.1.10); σpe ≈ 652 MPa.
  assert.ok(r.losses.total_ok_100MPa);
  approx(r.losses.total_19_Pa, 306.1 * MPA, 0.01, 'total losses 1..6');
  approx(r.sigma_pe_Pa, 651.8 * MPA, 0.01, 'sigma_pe');
  // P_eff ≈ 820 kN; σpc = P_eff/A0 ≈ 7,16 MPa (A0 = Ac − Ap).
  approx(r.P_eff_N, 820.5e3, 0.01, 'P_eff');
  approx(r.sigma_pc_Pa, 7.16 * MPA, 0.02, 'sigma_pc');
});

test('Delta_t = 0 (khai bao tuong minh) lam sigma_pe tang ~74 MPa', () => {
  const p = findPile(specs, 'PHC-B500');
  const r0 = prestressLosses(p, { delta_t_C: 0 }, 12);
  const r65 = prestressLosses(p, {}, 12);
  assert.equal(r0.losses.d_sp2_Pa, 0);
  // Khoản thứ nhất chênh đúng 81,25 MPa...
  approx(r0.losses.first_Pa, r65.losses.first_Pa - 81.25 * MPA, 1e-9, 'first losses diff');
  // ...nhưng σpe chỉ tăng ~74,2 MPa vì σsp(1) cao hơn ⇒ co ngắn đàn hồi
  // và từ biến cũng tăng theo (phản hồi tương thích, không phải sai số).
  approx(r0.sigma_pe_Pa - r65.sigma_pe_Pa, 74.16 * MPA, 0.02, 'delta sigma_pe khi Delta_t=0');
});

test('Chieu dai truyen luc Lp (222) va sigma_pc(x)', () => {
  const p = findPile(specs, 'PHC-B500');
  const r = prestressLosses(p, {}, 12);
  // Rbond = 2,5·1,0·2,1 = 5,25 MPa; us = 14·π·10,7 mm; Lp ≈ 0,55 m.
  approx(r.Rbond_Pa, 5.25 * MPA, 0.001, 'Rbond');
  assert.ok(r.transfer_length_Lp_m >= 0.2, 'Lp >= 200 mm');
  assert.ok(r.transfer_length_Lp_m < 2, `Lp = ${r.transfer_length_Lp_m}`);
  assert.equal(r.sigmaPcAt(0), 0);
  approx(r.sigmaPcAt(6), r.sigma_pc_Pa, 1e-9, 'sigma_pc giua coc');
  approx(r.sigmaPcAt(r.transfer_length_Lp_m), r.sigma_pc_Pa, 1e-9, 'sigma_pc tai Lp');
  approx(r.sigmaPcAt(r.transfer_length_Lp_m / 2), r.sigma_pc_Pa / 2, 1e-9, 'sigma_pc tang tuyen tinh trong Lp');
});

test('Kiem tra truyen luc (221): ung suat dinh << 0,9·Rbp', () => {
  const p = findPile(specs, 'PHC-B500');
  const r = prestressLosses(p, {}, 12);
  // M giữa nhịp do tự trọng (BT01): 10.433 kN·m.
  const chk = transferCheck(r, 10.433e3);
  approx(chk.sigma_top_Pa, 8.93 * MPA, 0.02, 'sigma_top transfer');
  assert.ok(chk.ok_top);
  assert.ok(chk.utilization_top < 0.3);
  // M_transfer là bắt buộc — không mặc định 0.
  assert.throws(() => transferCheck(r, undefined), /bat buoc/);
});

test('33/33 ma: sigma_pe, sigma_pc trong khoang hop ly; ton hao >= 100 MPa', () => {
  for (const p of specs.piles) {
    const r = prestressLosses(p, {}, 12);
    assert.ok(r.sigma_pe_Pa > 500 * MPA && r.sigma_pe_Pa < 950 * MPA,
      `${p.code} sigma_pe=${(r.sigma_pe_Pa / MPA).toFixed(0)}`);
    assert.ok(r.sigma_pc_Pa > 3 * MPA && r.sigma_pc_Pa < 12 * MPA,
      `${p.code} sigma_pc=${(r.sigma_pc_Pa / MPA).toFixed(2)}`);
    assert.ok(r.losses.total_ok_100MPa, `${p.code} tong ton hao < 100 MPa`);
    assert.ok(r.transfer_length_Lp_m >= 0.2 && r.transfer_length_Lp_m < 3, p.code);
    // Mọi giả thiết mặc định đều được liệt kê.
    assert.ok(r.assumptions.length >= 7, p.code);
  }
});

test('Tiet dien quy doi (162)(163): Ared/Ired khop tinh tay B500', () => {
  const p = findPile(specs, 'PHC-B500');
  const ts = transformedSection(p, { Eb_Pa: 42e9, Es_Pa: 200e9 });
  // Ac = π/4·(500²−320²) = 115.924 mm²; Ap = 1258,9 mm².
  approx(ts.Ac_m2, 115924e-6, 0.001, 'Ac');
  approx(ts.Ap_m2, 1258.9e-6, 0.002, 'Ap');
  // Ared = Ac + α·Ap ≈ 121.919 mm².
  approx(ts.Ared_m2, 121919e-6, 0.002, 'Ared');
  // I = π/64·(500⁴−320⁴) = 2,554e9 mm⁴; Ip = Ap·200²/2 = 25,18e6 mm⁴.
  approx(ts.Ired_m4, 2.674e-3, 0.002, 'Ired');
});
