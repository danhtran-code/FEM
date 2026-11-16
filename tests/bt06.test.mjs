// BT06 — Truyền lực qua thanh kê gỗ 100×100 tuyệt đối cứng.
// Đối chứng: độ cứng cọc từ BT01 (tải đơn vị); phân tải theo quy tắc đòn bẩy
// cho vật rắn; cân bằng lực + mô men; mất tiếp xúc và lật.
// Chạy: node --test tests/bt06.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import {
  pileStiffnessAt, solveRigidBearer, transferThroughBearer, RIGID_CONTACT_K_N_PER_M,
} from '../src/modules/xep-coc/rigid_bearer.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const b500 = () => findPile(specs, 'PHC-B500');
const K_MID = () => pileStiffnessAt(b500(), { L_m: 12, x1_m: 2.4, x2_m: 9.6, x_m: 6.0 });

test('Do cung coc B500 (L=12, goi 2,4/9,6): giua nhip ~13,8 MN/m; tai goi ~cung', () => {
  approx(K_MID(), 13.791e6, 0.01, 'k giua nhip');
  const k4 = pileStiffnessAt(b500(), { L_m: 12, x1_m: 2.4, x2_m: 9.6, x_m: 4.0 });
  assert.ok(k4 > K_MID(), 'gan goi cung hon giua nhip');
  assert.equal(pileStiffnessAt(b500(), { L_m: 12, x1_m: 2.4, x2_m: 9.6, x_m: 2.4 }),
    RIGID_CONTACT_K_N_PER_M);
  // Kiểm tra độc lập: võng giữa nhịp dầm đơn giản P·L³/48EI (nhịp 7,2 m).
  const EI = 42e9 * 2.554e-3;
  const vAnalytic = 1 * 7.2 ** 3 / (48 * EI);
  approx(1 / K_MID(), vAnalytic, 0.02, 'vong don vi giua nhip');
});

test('Phan tai doi xung: tai giua, 2 coc giong nhau => 50/50 (ket qua, khong phai mac dinh)', () => {
  const k = K_MID();
  const r = solveRigidBearer(
    [{ F_N: 34780, y_m: 0 }],
    [{ k_N_per_m: k, y_m: -0.5 }, { k_N_per_m: k, y_m: 0.5 }],
  );
  approx(r.reactions[0].R_N, 17390, 0.001, 'R_A');
  approx(r.reactions[1].R_N, 17390, 0.001, 'R_B');
  assert.ok(r.equilibrium.ok);
  assert.equal(r.dropped.length, 0);
});

test('Phan tai KHONG deu mac dinh: tai lech y=+0,25 => 8,70 / 26,09 kN', () => {
  const k = K_MID();
  const r = solveRigidBearer(
    [{ F_N: 34780, y_m: 0.25 }],
    [{ k_N_per_m: k, y_m: -0.5 }, { k_N_per_m: k, y_m: 0.5 }],
  );
  // Quy tắc đòn bẩy vật rắn: R_B = F·(0,25+0,5)/1,0 = 26,085 kN.
  approx(r.reactions[0].R_N, 8.695e3, 0.001, 'R_A');
  approx(r.reactions[1].R_N, 26.085e3, 0.001, 'R_B');
  assert.ok(r.equilibrium.ok);
});

test('Mat tiep xuc: tai lech, goi xa nhat bi nhac, giai lai van can bang', () => {
  const k = K_MID();
  const r = solveRigidBearer(
    [{ F_N: 34780, y_m: -0.4 }],
    [{ k_N_per_m: k, y_m: -0.5 }, { k_N_per_m: k, y_m: 0 }, { k_N_per_m: k, y_m: 0.5 }],
  );
  assert.equal(r.dropped.length, 1);
  assert.equal(r.reactions.length, 2);
  assert.ok(r.reactions.every((x) => x.R_N >= 0), 'phan luc con lai >= 0');
  approx(r.reactions[0].R_N, 27.82e3, 0.01, 'R con lai 1');
  approx(r.reactions[1].R_N, 6.96e3, 0.01, 'R con lai 2');
  assert.ok(r.equilibrium.ok);
});

test('Lat ke: tai nam ngoai pham vi goi => bao loi ro rang, khong gia so', () => {
  const k = K_MID();
  assert.throws(() => solveRigidBearer(
    [{ F_N: 34780, y_m: -0.9 }],
    [{ k_N_per_m: k, y_m: -0.5 }, { k_N_per_m: k, y_m: 0 }, { k_N_per_m: k, y_m: 0.5 }],
  ), /lat/);
});

test('transferThroughBearer: 2 coc duoi B500, tai 1 coc tren => bao toan tai', () => {
  const p = b500();
  const r = transferThroughBearer(
    [{ F_N: 34780, y_m: 0 }],
    [
      { pile: p, L_m: 12, x1_m: 2.4, x2_m: 9.6, x_m: 6.0, y_m: -0.5 },
      { pile: p, L_m: 12, x1_m: 2.4, x2_m: 9.6, x_m: 6.0, y_m: 0.5 },
    ],
  );
  approx(r.reactions[0].R_N + r.reactions[1].R_N, 34780, 1e-9, 'bao toan tong tai');
  assert.ok(r.equilibrium.ok);
});
