// BT08 — Hai tuyến kê đáy trên nền cứng lý tưởng, không lún.
// Đối chứng: tổng phản lực = tổng tải; đối xứng ⇒ R1 = R2; thêm tải tập trung
// vẫn cân bằng; API không nhận thông số nền (thiếu dữ liệu nền không tạo
// trạng thái thiếu dữ liệu).
// Chạy: node --test tests/bt08.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPile } from '../src/modules/xep-coc/pile_specs.js';
import { bottomReactions } from '../src/modules/xep-coc/bottom_bearers.js';

const specs = JSON.parse(readFileSync(new URL('../data_in/pile_specs.json', import.meta.url), 'utf-8'));
const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};
const b500 = () => findPile(specs, 'PHC-B500');

test('1 coc B500 (L=12, goi 2,4/9,6): R1 = R2 = 17,389 kN (moc BT01)', () => {
  const r = bottomReactions([{ pile: b500(), L_m: 12, x1_m: 2.4, x2_m: 9.6 }]);
  approx(r.perPile[0].R1_N, 17.389e3, 0.001, 'R1');
  approx(r.perPile[0].R2_N, 17.389e3, 0.001, 'R2');
  approx(r.totalReaction_N, 34.778e3, 0.001, 'tong phan luc');
  approx(r.totalLoad_N, 34.778e3, 0.001, 'tong tai');
  assert.ok(r.equilibrium_ok);
  assert.equal(r.symmetric, true);
});

test('3 coc giong nhau: tong phan luc = 3x tai 1 coc; doi xung', () => {
  const r = bottomReactions([0, 1, 2].map(() => ({ pile: b500(), L_m: 12, x1_m: 2.4, x2_m: 9.6 })));
  approx(r.totalReaction_N, 3 * 34.778e3, 0.001, 'tong 3 coc');
  assert.ok(r.equilibrium_ok && r.symmetric);
});

test('Tai tap trung tren coc: van can bang; goi gan tai hon chiu nhieu hon', () => {
  const r = bottomReactions([{
    pile: b500(), L_m: 12, x1_m: 2.4, x2_m: 9.6,
    pointLoads: [{ x_m: 3.0, P_N: 10e3 }],
  }]);
  const p = r.perPile[0];
  assert.ok(r.equilibrium_ok);
  approx(p.totalLoad_N, 34.778e3 + 10e3, 0.001, 'tong tai');
  assert.ok(p.R1_N > p.R2_N, 'goi gan tai chiu nhieu hon');
  assert.equal(r.symmetric, false);
});

test('Go lech: tong phan luc van = tong tai', () => {
  const r = bottomReactions([{ pile: b500(), L_m: 12, x1_m: 1.0, x2_m: 11.0 }]);
  assert.ok(r.equilibrium_ok);
  approx(r.totalReaction_N, 34.778e3, 0.001, 'tong phan luc');
});
