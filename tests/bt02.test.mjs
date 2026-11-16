// BT02 tests — chạy: node --test tests/bt02.test.mjs
// Đối chứng: tĩnh học + chồng chất tuyến tính (BT02 = BT01 + từng tải riêng).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { analyseSinglePileWithLoads } from '../src/modules/xep-coc/bt02.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const pile = findPile(specs, 'PHC-B500');
const BASE = { L_m: 12, x1_m: 2.4, x2_m: 9.6 }; // mốc BT01: R = 17,389 kN

const REL_TOL = 0.005;
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};

// Độ lệch lớn nhất của M(x) giữa hai kết quả trên lưới mẫu.
function maxMDiff(a, b, n = 49) {
  let d = 0;
  for (let i = 0; i <= n; i++) {
    const x = (12 * i) / n;
    d = Math.max(d, Math.abs(a.beam.bendingMoment(x) - b.beam.bendingMoment(x)));
  }
  return d;
}

test('BT02: tai dung goi — chi tang phan luc tuong ung, noi luc khong doi', () => {
  const P = 20000; // 20 kN
  const r = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 2.4 }] });
  approx(r.display.dR1_kN, 20, REL_TOL, 'dR1 tai dung goi 1');
  assert.ok(Math.abs(r.display.dR2_kN) < 1e-9, 'dR2 tai dung goi 1 ~ 0');
  // M(x) không đổi trên toàn cọc (sai lệch < 1 N·m trên thang 10⁴ N·m).
  assert.ok(maxMDiff(r, r) === 0);
  const base = analyseSinglePileWithLoads(pile, { ...BASE, loads: [] });
  assert.ok(maxMDiff(r, base) < 1, `M(x) doi khi tai dung goi: ${maxMDiff(r, base)} N·m`);
  assert.ok(Math.abs(r.display.dM_max_kNm) < 1e-9, 'dMmax tai dung goi ~ 0');
  assert.ok(Math.abs(r.equilibrium.sumF_N) < 1e-6 * r.equilibrium.totalDown_N);

  const r2 = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 9.6 }] });
  approx(r2.display.dR2_kN, 20, REL_TOL, 'dR2 tai dung goi 2');
  assert.ok(Math.abs(r2.display.dR1_kN) < 1e-9, 'dR1 tai dung goi 2 ~ 0');
  assert.ok(maxMDiff(r2, base) < 1, 'M(x) doi khi tai dung goi 2');
});

test('BT02: tai lech goi — phan luc va mo-men tang theo tinh hoc', () => {
  const P = 20000;
  const e = 1.0; // lệch 1,0 m vào trong nhịp từ gối 1
  const s = 9.6 - 2.4;
  const r = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 2.4 + e }] });
  // Tĩnh học: dR1 = P·(s−e)/s; dR2 = P·e/s.
  approx(r.display.dR1_kN, 20 * (s - e) / s, REL_TOL, 'dR1 lech goi');
  approx(r.display.dR2_kN, 20 * e / s, REL_TOL, 'dR2 lech goi');
  // Mômen tăng thêm tại vị trí tải = dR1·e (đo từ nền BT01).
  const dMAtLoad = (r.beam.bendingMoment(3.4) - r.baselineBeam.bendingMoment(3.4)) / 1000;
  approx(dMAtLoad, (20 * (s - e) / s) * e, REL_TOL, 'dM tai vi tri tai');
  // Lực cắt nhảy đúng P tại vị trí tải (so hai phía).
  const qLeft = r.beam.shearForce(3.4 - 1e-6) / 1000;
  const qRight = r.beam.shearForce(3.4 + 1e-6) / 1000;
  approx(qLeft - qRight, 20, REL_TOL, 'nhay Q tai tai tap trung');
  // Lệch bằng 0 quy về trường hợp đúng gối.
  const r0 = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 2.4 }] });
  approx(r0.display.dR1_kN, 20, REL_TOL, 'lech 0 -> dung goi (dR1)');
  assert.ok(Math.abs(r0.display.dM_max_kNm) < 1e-9, 'lech 0 -> dung goi (dMmax ~ 0)');
});

test('BT02: hai tuyen ke doc lap — chong chat tuyen tinh', () => {
  const loadA = { P_N: 20000, x_m: 3.4 }; // lệch gối 1
  const loadB = { P_N: 15000, x_m: 8.6 }; // lệch gối 2
  const both = analyseSinglePileWithLoads(pile, { ...BASE, loads: [loadA, loadB] });
  const onlyA = analyseSinglePileWithLoads(pile, { ...BASE, loads: [loadA] });
  const onlyB = analyseSinglePileWithLoads(pile, { ...BASE, loads: [loadB] });
  const base = analyseSinglePileWithLoads(pile, { ...BASE, loads: [] });
  approx(both.display.R1_kN,
    base.display.R1_kN + (onlyA.display.R1_kN - base.display.R1_kN) + (onlyB.display.R1_kN - base.display.R1_kN),
    1e-9, 'R1 chong chat');
  approx(both.display.R2_kN,
    base.display.R2_kN + (onlyA.display.R2_kN - base.display.R2_kN) + (onlyB.display.R2_kN - base.display.R2_kN),
    1e-9, 'R2 chong chat');
  // M(x) và v(x) cũng chồng chất.
  for (const x of [0, 2.4, 3.4, 6, 8.6, 9.6, 12]) {
    const mBoth = both.beam.bendingMoment(x);
    const mSum = base.beam.bendingMoment(x)
      + (onlyA.beam.bendingMoment(x) - base.beam.bendingMoment(x))
      + (onlyB.beam.bendingMoment(x) - base.beam.bendingMoment(x));
    // Dung sai tuyệt đối 10⁻⁴ N·m: M(0)/M(L) là phần dư triệt tiêu số học
    // (~10⁻⁶ N·m) trên thang tín hiệu 10⁴ N·m.
    assert.ok(Math.abs(mBoth - mSum) < 1e-4, `M(${x}) chong chat: ${mBoth} vs ${mSum}`);
    const vBoth = both.beam.deflection(x);
    const vSum = base.beam.deflection(x)
      + (onlyA.beam.deflection(x) - base.beam.deflection(x))
      + (onlyB.beam.deflection(x) - base.beam.deflection(x));
    assert.ok(Math.abs(vBoth - vSum) < 1e-9, `v(${x}) chong chat`);
  }
});

test('BT02: tai vet — tong phan luc dung P, mo-men nho hon tai diem cung vi tri', () => {
  const P = 20000;
  const patchMid = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 6, length_m: 1.0 }] });
  approx(patchMid.display.dR1_kN, 10, REL_TOL, 'dR1 vet giua nhip');
  approx(patchMid.display.dR2_kN, 10, REL_TOL, 'dR2 vet giua nhip');
  const pointMid = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 6 }] });
  // Vệt tải trải đều nên mômen tăng thêm nhỏ hơn tải điểm cùng tổng lực.
  assert.ok(patchMid.display.dM_max_kNm < pointMid.display.dM_max_kNm, 'vet < diem ve dMmax');
  assert.ok(patchMid.display.dM_max_kNm > 0.8 * pointMid.display.dM_max_kNm, 'vet gan diem khi vet ngan');
  // Vệt càng dài, mômen tăng thêm càng nhỏ (giới hạn về tải đều).
  const patchLong = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 6, length_m: 4.0 }] });
  assert.ok(patchLong.display.dM_max_kNm < patchMid.display.dM_max_kNm, 'vet dai -> dMmax nho hon');
  assert.ok(Math.abs(patchLong.equilibrium.sumF_N) < 1e-6 * patchLong.equilibrium.totalDown_N);
});

test('BT02: vet tai tam goi — hau nhu chi tang phan luc', () => {
  const P = 20000;
  const r = analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: P, x_m: 2.4, length_m: 1.0 }] });
  approx(r.display.dR1_kN + r.display.dR2_kN, 20, REL_TOL, 'tong dR = P');
  approx(r.display.dR1_kN, 20, 0.01, 'dR1 vet tam goi ~ P');
  // Mômen tăng thêm nhỏ (bậc hai theo nửa chiều dài vệt), dưới 1 kN·m với P = 20 kN.
  assert.ok(Math.abs(r.display.dM_max_kNm) < 1, `dMmax vet tam goi: ${r.display.dM_max_kNm}`);
});

test('BT02: dau vao khong hop le thi bao loi', () => {
  assert.throws(() => analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: 0, x_m: 6 }] }), /P_N/);
  assert.throws(() => analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: 1000, x_m: -1 }] }), /x_m/);
  assert.throws(() => analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: 1000, x_m: 13 }] }), /x_m/);
  assert.throws(() => analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: 1000, x_m: 0.4, length_m: 1.0 }] }), /vet tai/);
  assert.throws(() => analyseSinglePileWithLoads(pile, { ...BASE, loads: [{ P_N: 1000, x_m: 6, length_m: -2 }] }), /length_m/);
});
