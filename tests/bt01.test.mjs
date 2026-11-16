// BT01 tests — chạy: node --test tests/bt01.test.mjs
// Đối chứng: nghiệm giải tích dầm hai gối có đoạn hẫng chịu tải đều + công ảo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { analyseSinglePile } from '../src/modules/xep-coc/bt01.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));

// Ngưỡng: phản lực/nội lực khớp giải tích 0,5%; chuyển vị khớp 2%
// (mốc chuẩn nói "≈" nên chuyển vị lấy 2%).
const REL_TOL = 0.005;
const DEF_TOL = 0.02;
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};

// Trường hợp mốc BT01 (đã chuẩn bị từ trước, chỉ dùng làm đối chứng):
// PHC-B500, L = 12 m, gối cách mỗi đầu a = 2,4 m, chỉ tự trọng.
// w = 2,898 kN/m; EI = 107 226 kN·m² (I = 2,553×10⁹ mm⁴, Eb = 42 000 MPa).
// R = 17,39 kN; M tại gối = −8,35 kN·m; M giữa nhịp = 10,43 kN·m;
// Q tại gối = 10,43 kN; võng giữa nhịp ≈ 0,44 mm.
function benchmark() {
  const pile = findPile(specs, 'PHC-B500');
  return analyseSinglePile(pile, { L_m: 12, x1_m: 2.4, x2_m: 9.6 });
}

test('BT01: moc PHC-B500 — phan luc, mo-men, luc cat khop giai tich', () => {
  const r = benchmark();
  approx(r.display.w_kN_per_m, 2.898, REL_TOL, 'w');
  approx(r.display.EI_kNm2, 107226, REL_TOL, 'EI');
  approx(r.display.R1_kN, 17.39, REL_TOL, 'R1');
  approx(r.display.R2_kN, 17.39, REL_TOL, 'R2');
  approx(r.display.M_min_kNm, -8.35, REL_TOL, 'M tai goi');
  approx(r.display.M_min_x_m, 2.4, 0.001, 'x Mmin');
  approx(r.display.M_max_kNm, 10.43, REL_TOL, 'M giua nhip');
  approx(r.display.M_max_x_m, 6.0, 0.001, 'x Mmax');
  approx(r.beam.shearForce(2.4 + 1e-9) / 1000, 10.43, REL_TOL, 'Q phai goi 1');
  approx(r.beam.shearForce(9.6 - 1e-9) / 1000, -10.43, REL_TOL, 'Q trai goi 2');
  // Đầu hẫng tự do: mômen bằng 0.
  assert.ok(Math.abs(r.beam.bendingMoment(0)) < 1e-6);
  assert.ok(Math.abs(r.beam.bendingMoment(12)) < 1e-6);
  // Cân bằng toàn hệ.
  assert.ok(Math.abs(r.equilibrium.sumF_N) < 1e-6 * r.equilibrium.totalDown_N);
  assert.ok(Math.abs(r.equilibrium.sumM_Nm) < 1e-6 * r.equilibrium.totalDown_N * 12);
});

test('BT01: moc PHC-B500 — chuyen vi khop cong ao va doi xung', () => {
  const r = benchmark();
  // Võng giữa nhịp ≈ 0,44 mm (đã kiểm chứng độc lập bằng chồng chất).
  approx(-r.beam.deflection(6) * 1000, 0.44, DEF_TOL, 'vong giua nhip');
  // HIỆU CHÍNH mốc chuẩn: đầu hẫng võng LÊN 0,224 mm, không phải xuống 0,45 mm.
  // Góc xoay tại gối (−1,401×10⁻⁴ rad, chiều kim đồng hồ) nâng đầu hẫng lên
  // |θ|·a = 0,336 mm, trừ võng hẫng tương đối w·a⁴/8EI = 0,112 mm → lên 0,224 mm.
  // Đã kiểm chứng bằng công ảo phía dưới và tính tay chồng chất.
  approx(r.beam.deflection(0) * 1000, 0.224, DEF_TOL, 'dau hanh (len +)');
  approx(r.beam.deflection(12) * 1000, 0.224, DEF_TOL, 'dau hanh phai (doi xung)');
  // Đối xứng: góc xoay giữa nhịp ≈ 0.
  const midNode = r.beam.nodes.reduce((a, b) => (Math.abs(b.x_m - 6) < Math.abs(a.x_m - 6) ? b : a));
  assert.ok(Math.abs(midNode.theta_rad) < 1e-9);
});

// Công ảo độc lập: δ = ∫M·m/EI dx (Simpson) với m giải tích.
function virtualWorkDeflection(r, mFunc, L = 12, n = 12000) {
  const h = L / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const x = i * h;
    const wgt = i === 0 || i === n ? 1 : (i % 2 ? 4 : 2);
    s += wgt * r.beam.bendingMoment(x) * mFunc(x);
  }
  return (s * h) / 3 / r.inputs.EI_Nm2;
}

test('BT01: chuyen vi khop cong ao doc lap (Simpson, m giai tich)', () => {
  const r = benchmark();
  // Quy ước: công ảo δ dương theo chiều tải đơn vị (hướng xuống);
  // FEM v(x) dương hướng lên → δ = −v.
  // Đơn vị tải xuống tại giữa nhịp (gối 2,4–9,6): m = 0 ngoài nhịp;
  // trong nhịp: 0,5(x−2,4) (x<6); 4,8−0,5x (x>6); đỉnh 1,8 tại x=6.
  const mMid = (x) => (x < 2.4 || x > 9.6 ? 0 : (x <= 6 ? 0.5 * (x - 2.4) : 4.8 - 0.5 * x));
  const dMid = virtualWorkDeflection(r, mMid);
  approx(dMid * 1000, 0.44, DEF_TOL, 'cong ao vong giua nhip (xuong +)');
  approx(dMid, -r.beam.deflection(6), 0.01, 'cong ao vs FEM giua nhip');
  // Đơn vị tải xuống tại đầu hẫng x=0: m(x) = −x (x<2,4); x/3−3,2 (2,4–9,6); 0.
  const mTip = (x) => (x < 2.4 ? -x : (x <= 9.6 ? x / 3 - 3.2 : 0));
  const dTip = virtualWorkDeflection(r, mTip);
  approx(-dTip, r.beam.deflection(0), 0.01, 'cong ao vs FEM dau hanh');
  assert.ok(dTip < 0, 'dau hanh di len (cong ao am theo chieu xuong)');
});

test('BT01: khong co doan hang — cong thuc co dien 5wL^4/384EI', () => {
  const pile = findPile(specs, 'PHC-B500');
  const r = analyseSinglePile(pile, { L_m: 12, x1_m: 0, x2_m: 12 });
  const { w_N_per_m: w, EI_Nm2: EI } = r.inputs;
  approx(r.display.R1_kN, (w * 12) / 2 / 1000, REL_TOL, 'R khong hang');
  approx(r.beam.bendingMoment(6) / 1000, (w * 144) / 8 / 1000, REL_TOL, 'M giua nhip');
  const dClassic = (5 * w * 12 ** 4) / (384 * EI);
  approx(-r.beam.deflection(6), dClassic, 0.005, 'vong giua nhip co dien');
});

test('BT01: goi lech — phan luc theo tinh toan tinh hoc', () => {
  const pile = findPile(specs, 'PHC-A300');
  const L = 10;
  const x1 = 1.5;
  const x2 = 8.0;
  const r = analyseSinglePile(pile, { L_m: L, x1_m: x1, x2_m: x2 });
  const w = r.inputs.w_N_per_m;
  // Lấy mômen quanh x1: R2·(x2−x1) = wL·(L/2 − x1).
  const R2 = (w * L * (L / 2 - x1)) / (x2 - x1);
  const R1 = w * L - R2;
  approx(r.beam.reactions[0].R_N, R1, REL_TOL, 'R1 lech');
  approx(r.beam.reactions[1].R_N, R2, REL_TOL, 'R2 lech');
  // Mômen tại gối = −w·a²/2 với a là đoạn hẫng.
  approx(r.beam.bendingMoment(x1) / 1000, (-w * x1 * x1) / 2 / 1000, REL_TOL, 'M goi 1');
  approx(r.beam.bendingMoment(x2) / 1000, (-w * (L - x2) ** 2) / 2 / 1000, REL_TOL, 'M goi 2');
  assert.ok(Math.abs(r.equilibrium.sumF_N) < 1e-6 * r.equilibrium.totalDown_N);
});

test('BT01: hoi tu luoi — luoi tho va luoi min cho cung ket qua', () => {
  const pile = findPile(specs, 'PHC-B500');
  const coarse = analyseSinglePile(pile, { L_m: 12, x1_m: 2.4, x2_m: 9.6, elementsPerSegment: 2 });
  const fine = analyseSinglePile(pile, { L_m: 12, x1_m: 2.4, x2_m: 9.6, elementsPerSegment: 30 });
  approx(coarse.display.R1_kN, fine.display.R1_kN, 0.001, 'R hoi tu');
  approx(coarse.display.M_max_kNm, fine.display.M_max_kNm, 0.001, 'Mmax hoi tu');
  approx(coarse.beam.deflection(6), fine.beam.deflection(6), 0.002, 'vong hoi tu');
});

test('BT01: dau vao khong hop le thi bao loi', () => {
  const pile = findPile(specs, 'PHC-B500');
  assert.throws(() => analyseSinglePile(pile, { L_m: 0, x1_m: 1, x2_m: 2 }), /L_m/);
  assert.throws(() => analyseSinglePile(pile, { L_m: 12, x1_m: 5, x2_m: 5 }), /goi/);
  assert.throws(() => analyseSinglePile(pile, { L_m: 12, x1_m: 6, x2_m: 4 }), /goi/);
  assert.throws(() => analyseSinglePile(pile, { L_m: 12, x1_m: -1, x2_m: 9 }), /goi/);
  assert.throws(() => analyseSinglePile(pile, { L_m: 12, x1_m: 2, x2_m: 13 }), /goi/);
});
