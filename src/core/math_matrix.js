// Lõi toán dùng chung — đơn vị SI. Không phụ thuộc thư viện ngoài để
// `node --test` chạy được offline; mathjs (CDN) chỉ dùng ở giao diện khi cần.

/**
 * Giải hệ tuyến tính A·x = b bằng khử Gauss với chọn trụ chính từng phần.
 * @param {number[][]} A ma trận vuông n×n (không bị thay đổi).
 * @param {number[]} b vế phải dài n.
 * @returns {number[]} nghiệm x.
 * @throws khi ma trận suy biến (trụ chính ~0 so với thang của ma trận).
 */
export function solveLinear(A, b) {
  const n = b.length;
  if (!Array.isArray(A) || A.length !== n || A.some((row) => !Array.isArray(row) || row.length !== n)) {
    throw new Error(`solveLinear: A phai la ma tran vuong ${n}x${n}`);
  }
  // Sao chép để không sửa đầu vào.
  const M = A.map((row) => [...row]);
  const x = [...b];
  // Thang để đánh giá suy biến tương đối.
  const scale = Math.max(1e-300, ...M.flat().map((v) => Math.abs(v)));

  for (let k = 0; k < n; k++) {
    // Chọn trụ chính: hàng có |M[i][k]| lớn nhất từ k trở xuống.
    let pivotRow = k;
    let pivotVal = Math.abs(M[k][k]);
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i][k]);
      if (v > pivotVal) { pivotVal = v; pivotRow = i; }
    }
    if (pivotVal <= 1e-12 * scale) {
      throw new Error(`solveLinear: ma tran suy bien (tru chinh ${pivotVal} o cot ${k})`);
    }
    if (pivotRow !== k) {
      [M[k], M[pivotRow]] = [M[pivotRow], M[k]];
      [x[k], x[pivotRow]] = [x[pivotRow], x[k]];
    }
    // Khử các hàng dưới.
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / M[k][k];
      if (factor === 0) continue;
      for (let j = k; j < n; j++) M[i][j] -= factor * M[k][j];
      x[i] -= factor * x[k];
    }
  }
  // Thế ngược.
  const out = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * out[j];
    out[i] = s / M[i][i];
  }
  return out;
}
