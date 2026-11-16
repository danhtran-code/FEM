// Test nhập liệu giao diện — chạy: node --test tests/ui_inputs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInputs, fmt } from '../src/ui/inputs.js';

const BASE = { pileCode: 'PHC-B500', L_m: 12, x1_m: 2.4, x2_m: 9.6, E_MPa: 42000, gamma_kN_m3: 25, loadRows: [] };

test('parseInputs: BT01 hop le — doi sang SI', () => {
  const r = parseInputs(BASE);
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.equal(r.opts.E_Pa, 42e9);
  assert.equal(r.opts.gamma_kN_m3, 25);
  assert.deepEqual(r.opts.loads, []);
});

test('parseInputs: BT02 — tai diem va vet doi sang SI', () => {
  const r = parseInputs({
    ...BASE,
    loadRows: [
      { kind: 'point', P_kN: 20, x_m: 3.4 },
      { kind: 'patch', P_kN: 15, x_m: 6, length_m: 1.0 },
    ],
  });
  assert.equal(r.ok, true, r.errors.join('; '));
  assert.equal(r.opts.loads.length, 2);
  assert.equal(r.opts.loads[0].P_N, 20000);
  assert.equal(r.opts.loads[0].length_m, 0);
  assert.equal(r.opts.loads[1].P_N, 15000);
  assert.equal(r.opts.loads[1].length_m, 1.0);
});

test('parseInputs: loi hinh hoc va tai', () => {
  assert.equal(parseInputs({ ...BASE, pileCode: '' }).ok, false);
  assert.equal(parseInputs({ ...BASE, L_m: 0 }).ok, false);
  assert.equal(parseInputs({ ...BASE, x1_m: 5, x2_m: 5 }).ok, false);
  assert.equal(parseInputs({ ...BASE, x1_m: 2, x2_m: 13 }).ok, false);
  assert.equal(parseInputs({ ...BASE, E_MPa: -1 }).ok, false);
  assert.equal(parseInputs({ ...BASE, loadRows: [{ kind: 'point', P_kN: 0, x_m: 6 }] }).ok, false);
  assert.equal(parseInputs({ ...BASE, loadRows: [{ kind: 'point', P_kN: 10, x_m: 13 }] }).ok, false);
  assert.equal(parseInputs({ ...BASE, loadRows: [{ kind: 'patch', P_kN: 10, x_m: 0.4, length_m: 1 }] }).ok, false);
  assert.equal(parseInputs({ ...BASE, loadRows: [{ kind: 'patch', P_kN: 10, x_m: 6, length_m: 0 }] }).ok, false);
  // Lỗi phải nêu rõ trường.
  const r = parseInputs({ ...BASE, L_m: 12, x1_m: 9, x2_m: 2.4 });
  assert.ok(r.errors.some((e) => e.includes('Gối không hợp lệ')));
});

test('fmt: dinh dang vi-VN', () => {
  assert.equal(fmt(1000, 0), '1.000');
  assert.ok(fmt(17.389, 2).includes('17,39'));
  assert.equal(fmt(null), '—');
});
