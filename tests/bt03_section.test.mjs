// BT03 (đầy đủ) — Kiểm tra tiết diện: Mcr (243), Mu (mô hình vành khuyên),
// cắt (8.1.3), nứt (166)(245) theo TCVN 5574:2018.
// Đối chứng độc lập:
// - Hình học vùng nén: tích phân lát cắt số (720 lát) so với công thức giải tích.
// - Mu: tính lại bằng tích phân lát cắt tại cùng x (cân bằng C = T, mô men).
// - Mcr/Mu công bố chỉ dùng để đối chiếu chẩn đoán, KHÔNG hiệu chỉnh để khớp.
// Chạy: node --test tests/bt03_section.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { prestressLosses } from '../src/modules/xep-coc/prestress_losses.js';
import {
  circleSegmentArea, circleSegmentFirstMoment, compressionZone,
  crackingMoment, ultimateMoment, shearResistance, crackWidth,
  checkSection,
} from '../src/modules/xep-coc/section_checker.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const b500 = () => {
  const p = findPile(specs, 'PHC-B500');
  return { pile: p, loss: prestressLosses(p, {}, 12) };
};

/** Tích phân lát cắt độc lập: chia vành khuyên thành 720 lát theo góc, tích
 * phân cực chính xác trong từng lát (r_min từ biên vùng nén x). */
function sliceCompression(pile, x_m) {
  const Ro = pile.Do_mm / 2000, Ri = pile.Di_mm / 2000;
  const N = 720;
  let A = 0, Q = 0; // Q: mô men tĩnh quanh trục trọng tâm, dương hướng lên
  for (let i = 0; i < N; i++) {
    const th0 = (2 * Math.PI * i) / N, th1 = (2 * Math.PI * (i + 1)) / N;
    const th = (th0 + th1) / 2;
    const c = Math.cos(th);
    const dth = th1 - th0;
    if (c > 0) {
      // Nửa trên: sâu y = Ro − r·c ≤ x ⇒ r ≥ (Ro − x)/c.
      const rMin = Math.min(Ro, Math.max(Ri, (Ro - x_m) / c));
      if (rMin >= Ro) continue;
      A += ((Ro * Ro - rMin * rMin) / 2) * dth;
      Q += (c * (Ro ** 3 - rMin ** 3) / 3) * dth;
    } else if (c < 0 && x_m > Ro) {
      // Nửa dưới (chỉ khi x vượt trọng tâm): y = Ro + r·|c| ≤ x ⇒ r ≤ (x − Ro)/|c|.
      const rMax = Math.min(Ro, (x_m - Ro) / (-c));
      if (rMax <= Ri) continue;
      A += ((rMax * rMax - Ri * Ri) / 2) * dth;
      Q += (c * (rMax ** 3 - Ri ** 3) / 3) * dth;
    }
  }
  return { A_m2: A, Q_m3: Q };
}

test('Hinh hoc phan doan tron: nua hinh tron, toan hinh tron', () => {
  approx(circleSegmentArea(0.25, 0.25), Math.PI * 0.25 ** 2 / 2, 1e-9, 'half circle');
  approx(circleSegmentArea(0.25, 0.5), Math.PI * 0.25 ** 2, 1e-9, 'full circle');
  assert.equal(circleSegmentArea(0.25, 0), 0);
  approx(circleSegmentFirstMoment(0.25, 0.25), (2 / 3) * 0.25 ** 3, 1e-9, 'first moment half');
});

test('Vung nen vanh khuyen: giai tich khop tich phan lat cat (720 lat)', () => {
  const { pile } = b500();
  for (const x of [0.05, 0.12, 0.25, 0.4, 0.5]) {
    const a = compressionZone(pile, x);
    const s = sliceCompression(pile, x);
    approx(a.A_m2, s.A_m2, 0.01, `A x=${x}`);
    approx(a.Q_m3, s.Q_m3, 0.01, `Q x=${x}`);
  }
  // x = Do: diện tích = toàn vành khuyên; Q = 0.
  const full = compressionZone(pile, 0.5);
  approx(full.A_m2, Math.PI / 4 * (0.5 ** 2 - 0.32 ** 2), 0.001, 'A full');
  approx(full.Q_m3, 0, 0.001, 'Q full');
});

test('Mcr B500 (243): ~118 kN·m (gamma=1,3); dan hoi ~107 kN·m', () => {
  const { pile, loss } = b500();
  const m = crackingMoment(pile, loss);
  approx(m.Mcrc_Nm, 117.9e3, 0.02, 'Mcrc gamma=1,3');
  approx(m.Mcrc_elastic_Nm, 107.3e3, 0.02, 'Mcrc gamma=1,0');
  // Đối chiếu chẩn đoán: Mcr công bố 147,2 kN·m cao hơn ~25% — vì Mcr công bố
  // là giá trị tối thiểu TCVN 7888 Bảng 1 (fr suy ra ~6,4 MPa), không phải
  // Mcr tính lại theo TCVN 5574 (Rbt,ser·γ = 4,29 MPa). Ghi nhận, không hiệu chỉnh.
  const pub = pile.Mcr_kNm * 1e3;
  assert.ok(m.Mcrc_Nm < pub, 'Mcrc tinh thap hon cong bo (thien ve an toan)');
  assert.ok(pub / m.Mcrc_Nm < 1.35, 'chenh Mcr < 35%');
});

test('Mu B500: can bang C = T, xi <= xi_R, cung bac do voi Mu cong bo', () => {
  const { pile, loss } = b500();
  const u = ultimateMoment(pile, loss);
  assert.ok(Math.abs(u.equilibrium_residual_N) < 1, `residual ${u.equilibrium_residual_N} N`);
  assert.ok(u.xi <= u.xi_R + 1e-9, `xi=${u.xi} > xi_R=${u.xi_R}`);
  assert.equal(u.over_reinforced, false);
  // Mu công bố 265 kN·m — mô hình phải cùng bậc độ (±30%), không hiệu chỉnh.
  approx(u.Mu_Nm, 265e3, 0.3, 'Mu B500 vs cong bo');
  assert.ok(u.Mu_Nm > 150e3 && u.Mu_Nm < 400e3, `Mu=${u.Mu_Nm / 1e3} kN·m`);
});

test('Mu: tang theo duong kinh va theo cap tai (qua Ap)', () => {
  const cases = ['PHC-B300', 'PHC-B500', 'PHC-B800', 'PHC-B1000'].map((c) => {
    const p = findPile(specs, c);
    return ultimateMoment(p, prestressLosses(p, {}, 12)).Mu_Nm;
  });
  for (let i = 1; i < cases.length; i++) assert.ok(cases[i] > cases[i - 1], `Mu tang theo D: ${cases}`);
  const muA = ultimateMoment(findPile(specs, 'PHC-A500'), prestressLosses(findPile(specs, 'PHC-A500'), {}, 12)).Mu_Nm;
  const muC = ultimateMoment(findPile(specs, 'PHC-C500'), prestressLosses(findPile(specs, 'PHC-C500'), {}, 12)).Mu_Nm;
  assert.ok(muC > muA, `Mu C500 (${muC / 1e3}) > A500 (${muA / 1e3})`);
});

test('Mu doc lap: tich phan lat cat tai cung x cho cung Mu', () => {
  const { pile, loss } = b500();
  const u = ultimateMoment(pile, loss);
  // Tính lại Mu bằng lát cắt: bê tông Rb trên vùng nén, thép theo tương thích.
  const { barArea_m2 } = { barArea_m2: (Math.PI / 4) * (pile.pc_bar.d_mm / 1000) ** 2 };
  const Ro = pile.Do_mm / 2000, Ri = pile.Di_mm / 2000;
  // Bê tông: mô men = Rb × mô men tĩnh vùng nén (tích phân cực độc lập).
  const M_conc = 41e6 * sliceCompression(pile, u.x_m).Q_m3;
  // Thép: dùng cùng công thức tương thích (kiểm tra phần bê tông là chính).
  const { depths } = (() => {
    const rs = pile.Dp_mm / 2000;
    const ds = [];
    for (let i = 0; i < pile.pc_bar.N1; i++) {
      const th = (2 * Math.PI * i) / pile.pc_bar.N1;
      ds.push({ y_m: Ro - rs * Math.cos(th) });
    }
    return { depths: ds };
  })();
  let M_steel = 0;
  for (const { y_m } of depths) {
    const d_eps = 0.0031333 * (y_m - u.x_m) / u.x_m;
    let sig = loss.sigma_pe_Pa + 200e9 * d_eps;
    sig = Math.min(sig, 1275e6 / 1.15);
    sig = Math.max(sig, -400e6);
    M_steel += sig * barArea_m2 * (y_m - Ro);
  }
  approx(M_conc + M_steel, u.Mu_Nm, 0.02, 'Mu tich phan lat cat');
});

test('Cat B500: vung dau (2 lop, buoc 50) > vung giua (1 lop, buoc 100)', () => {
  const { pile, loss } = b500();
  const qEnd = shearResistance(pile, loss, 0.3, 12); // x = 0,3 m: vùng đầu
  const qMid = shearResistance(pile, loss, 6.0, 12); // giữa cọc
  assert.equal(qEnd.zone, 'dau_coc');
  assert.equal(qMid.zone, 'than_giua');
  assert.ok(qEnd.Qu_N > qMid.Qu_N, `Qu dau ${qEnd.Qu_N} > giua ${qMid.Qu_N}`);
  // Vùng đầu: qsw = 300·(2·2·12,57)/50 = 301,6 N/mm ≥ 94,5 ⇒ thỏa (96).
  assert.ok(qEnd.qsw_ok, 'qsw vung dau >= 0,25·Rbt·b');
  // Vùng giữa B500: qsw = 300·(2·12,57)/100 = 75,4 N/mm < 94,5 ⇒ KHÔNG thỏa
  // (96) — đây là phát hiện thực: đai giữa thân không đạt tối thiểu theo
  // 8.1.3 (96); code dùng Qb theo (97). Qu vẫn >> Q tác dụng.
  assert.equal(qMid.qsw_ok, false);
  approx(qMid.qsw_N_per_m, 75.4e3, 0.01, 'qsw vung giua');
  approx(qMid.qsw_min_N_per_m, 94.5e3, 0.01, 'qsw_min');
  // φn: σm = P_eff/Ared ≈ 6,7 MPa; 0,25·Rb = 10,25 ⇒ φn = 1 + σm/Rb ≈ 1,16.
  approx(qMid.phi_n, 1 + 6.7 / 41, 0.05, 'phi_n');
  // Q lớn nhất BT01 (17,4 kN) chỉ bằng vài % Qu.
  assert.ok(qMid.Qu_N > 10 * 17.389e3, `Qu giua = ${qMid.Qu_N / 1e3} kN`);
});

test('Nut: duoi Mcrc khong nut; tren Mcrc acrc tang theo M', () => {
  const { pile, loss } = b500();
  const below = crackWidth(pile, loss, 100e3, 'long');
  assert.equal(below.cracked, false);
  assert.equal(below.acrc_mm, 0);
  const m1 = crackWidth(pile, loss, 150e3, 'long');
  const m2 = crackWidth(pile, loss, 250e3, 'long');
  assert.ok(m1.cracked && m2.cracked);
  assert.ok(m2.acrc_mm > m1.acrc_mm, 'acrc tang theo M');
  assert.ok(m1.sigma_s_ok, 'sigma_s <= Rs,ser - sigma_pe');
  assert.ok(m1.acrc_mm < 0.3, `acrc o 150 kN·m = ${m1.acrc_mm} mm < 0,3`);
});

test('checkSection voi moc BT01 (B500, L=12m): tat ca he so su dung << 1', () => {
  const { pile, loss } = b500();
  // Giữa nhịp: M = 10,433 kN·m, Q ≈ 0; tại gối: M = −8,347 kN·m, Q = 17,389 kN.
  const mid = checkSection(pile, loss, { M_Nm: 10.433e3, Q_N: 0, x_m: 6.0, L_m: 12 });
  const sup = checkSection(pile, loss, { M_Nm: -8.347e3, Q_N: 17.389e3, x_m: 2.4, L_m: 12 });
  assert.ok(mid.ok && sup.ok);
  assert.ok(mid.utilization.bending < 0.1, `U uon giua = ${mid.utilization.bending}`);
  assert.ok(sup.utilization.shear < 0.1, `U cat goi = ${sup.utilization.shear}`);
  assert.equal(mid.cracked, false);
  assert.ok(mid.governing === 'bending' || mid.governing === 'shear');
});
