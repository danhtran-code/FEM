// Test lõi giải hệ tuyến tính — chạy: node --test tests/math_matrix.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { solveLinear } from '../src/core/math_matrix.js';

test('solveLinear: he 2x2 va 3x3 co nghiem dung', () => {
  const x2 = solveLinear([[2, 1], [1, 3]], [5, 10]);
  assert.ok(Math.abs(x2[0] - 1) < 1e-12);
  assert.ok(Math.abs(x2[1] - 3) < 1e-12);

  // Nghiệm x = [1, 2, 3]: 4+2+6 = 12; 1+10+3 = 14; 2+2+18 = 22.
  const x3 = solveLinear(
    [[4, 1, 2], [1, 5, 1], [2, 1, 6]],
    [12, 14, 22],
  );
  assert.ok(Math.abs(x3[0] - 1) < 1e-12 && Math.abs(x3[1] - 2) < 1e-12 && Math.abs(x3[2] - 3) < 1e-12);
});

test('solveLinear: can chon tru chinh (so 0 tren duong cheo)', () => {
  const x = solveLinear([[0, 1], [1, 0]], [7, 5]);
  assert.ok(Math.abs(x[0] - 5) < 1e-12);
  assert.ok(Math.abs(x[1] - 7) < 1e-12);
});

test('solveLinear: ma tran suy bien va khong vuong thi bao loi', () => {
  assert.throws(() => solveLinear([[1, 2], [2, 4]], [1, 2]), /suy bien/);
  assert.throws(() => solveLinear([[1, 2, 3], [4, 5, 6]], [1, 2]));
});

test('solveLinear: khong sua doi dau vao', () => {
  const A = [[3, 1], [1, 2]];
  const b = [7, 5];
  solveLinear(A, b);
  assert.deepEqual(A, [[3, 1], [1, 2]]);
  assert.deepEqual(b, [7, 5]);
});
