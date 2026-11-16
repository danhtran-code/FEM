// BT07 — Ràng buộc giữ ngang lý tưởng, đủ năng lực (chỉ kiểm chứng biên).
// Hệ cọc chịu các lực ngoài (thành phần ngang của lực tiếp xúc nghiêng ở
// S1, ...). Ràng buộc cho phản lực dọc hướng đã định tại vị trí đã định.
// Giải cân bằng mặt phẳng: ΣFx = 0, ΣFy = 0, ΣM = 0.
// - Đúng 3 ràng buộc độc lập: giải duy nhất.
// - Ít hơn 3: nghiệm chuẩn tối thiểu (bình phương tối thiểu) + cờ underdetermined.
// - Nhiều hơn 3: bình phương tối thiểu + dư cân bằng (hệ siêu tĩnh — ràng buộc
//   lý tưởng không tự chia lực; cần khai báo độ cứng nếu muốn chia theo độ cứng).
// Ràng buộc KHÔNG được tự khóa mọi cọc và KHÔNG làm lệch lực tiếp xúc nghiêng:
// lực tiếp xúc là đầu vào, phản lực chỉ cân bằng phần dư của chúng.
// Không kiểm tra khả năng chịu tải của chèn/kho.
// Đơn vị SI: m, N, N·m. Gốc mô men: (0, 0) theo tọa độ người dùng truyền vào.

import { solveLinear } from '../../core/math_matrix.js';

/**
 * @param {Array<{Fx_N, Fy_N, x_m, y_m, pile?: string, label?: string}>} forces
 *   — lực ngoài tác dụng lên hệ (dương = chiều +x/+y); mô men tính quanh gốc.
 * @param {Array<{x_m, y_m, dx, dy, label?: string}>} restraints
 *   — hướng (dx, dy) phải là vectơ đơn vị.
 */
export function solveRestraints(forces, restraints) {
  if (!restraints.length) throw new Error('can it nhat mot rang buoc');
  for (const r of restraints) {
    const n = Math.hypot(r.dx, r.dy);
    if (Math.abs(n - 1) > 1e-9) throw new Error('huong rang buoc phai la vecto don vi');
  }
  // Vế phải: lực/mô men mà ràng buộc phải cân bằng = −(tổng lực ngoài).
  const bFx = -forces.reduce((s, f) => s + f.Fx_N, 0);
  const bFy = -forces.reduce((s, f) => s + f.Fy_N, 0);
  const bM = -forces.reduce((s, f) => s + (f.x_m * f.Fy_N - f.y_m * f.Fx_N), 0);
  const b = [bFx, bFy, bM];
  // Ma trận 3×n: hàng Fx, Fy, M; cột j: phản lực đơn vị của ràng buộc j.
  const A = [0, 1, 2].map(() => restraints.map(() => 0));
  restraints.forEach((r, j) => {
    A[0][j] = r.dx;
    A[1][j] = r.dy;
    A[2][j] = r.x_m * r.dy - r.y_m * r.dx; // mô men của phản lực đơn vị quanh gốc
  });
  const n = restraints.length;
  let reactions, method, residual = null;
  if (n === 3) {
    reactions = solveLinear(A, b);
    method = 'xac dinh (3 rang buoc)';
    residual = [0, 1, 2].map((i) => A[i].reduce((s, a, j) => s + a * reactions[j], 0) - b[i]);
  } else {
    // Bình phương tối thiểu qua phương trình chuẩn AᵀA·r = Aᵀb (n ≠ 3).
    const AtA = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => A[0][i] * A[0][j] + A[1][i] * A[1][j] + A[2][i] * A[2][j]));
    const Atb = Array.from({ length: n }, (_, i) => A[0][i] * b[0] + A[1][i] * b[1] + A[2][i] * b[2]);
    reactions = solveLinear(AtA, Atb);
    method = n < 3 ? 'thieu rang buoc — nghiem chuan toi thieu' : 'thua rang buoc — binh phuong toi thieu';
    residual = [0, 1, 2].map((i) => A[i].reduce((s, a, j) => s + a * reactions[j], 0) - b[i]);
  }
  const maxResidual = Math.max(...residual.map(Math.abs));
  const scale = Math.max(1, Math.abs(bFx), Math.abs(bFy), Math.abs(bM));
  // Lực ngang ròng trên từng cọc sau khi trừ phản lực ràng buộc tại cọc đó
  // (ràng buộc gắn vào cọc nào thì phản lực đó tác dụng lên cọc đó).
  const perPile = {};
  for (const f of forces) {
    const key = f.pile ?? 'he';
    perPile[key] = perPile[key] || { Fx_N: 0, Fy_N: 0 };
    perPile[key].Fx_N += f.Fx_N;
    perPile[key].Fy_N += f.Fy_N;
  }
  restraints.forEach((r, j) => {
    if (!r.pile) return;
    perPile[r.pile] = perPile[r.pile] || { Fx_N: 0, Fy_N: 0 };
    perPile[r.pile].Fx_N += reactions[j] * r.dx;
    perPile[r.pile].Fy_N += reactions[j] * r.dy;
  });
  return {
    reactions: restraints.map((r, j) => ({ label: r.label ?? `R${j + 1}`, R_N: reactions[j], x_m: r.x_m, y_m: r.y_m, dx: r.dx, dy: r.dy, pile: r.pile })),
    method,
    equilibrium: { residual_Fx_N: residual[0], residual_Fy_N: residual[1], residual_M_Nm: residual[2], ok: maxResidual < 1e-6 * scale },
    perPileNetForce: perPile,
  };
}

/**
 * Lực tiếp xúc nghiêng ở cụm S1 (cọc trên nằm giữa hai cọc dưới, tâm tạo
 * tam giác đều): pháp tuyến hợp 30° với phương đứng. Trả về hai lực tiếp
 * xúc (N) tác dụng lên cọc trên do trọng lượng W của nó.
 */
export function s1ContactForces(W_N) {
  // Mỗi tiếp xúc chịu W/2 theo phương đứng ⇒ độ lớn F = (W/2)/cos30°.
  const F = (W_N / 2) / Math.cos(Math.PI / 6);
  const s = Math.sin(Math.PI / 6), c = Math.cos(Math.PI / 6);
  return [
    { Fx_N: -F * s, Fy_N: F * c, label: 'tiep xuc trai' }, // lên trên-trái
    { Fx_N: F * s, Fy_N: F * c, label: 'tiep xuc phai' },
  ];
}
