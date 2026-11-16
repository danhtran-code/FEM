// BT07 — Ràng buộc giữ ngang lý tưởng, đủ năng lực.
// Đối chứng: cụm S1 đối xứng ⇒ phản lực ngang = 0; cụm lệch ⇒ phản lực ≠ 0;
// cân bằng ΣFx/ΣFy/ΣM ≈ 0; ràng buộc không làm lệch lực tiếp xúc nghiêng.
// Chạy: node --test tests/bt07.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { solveRestraints, s1ContactForces } from '../src/modules/xep-coc/lateral_restraint.js';

const approx = (got, want, tol, label) => {
  assert.ok(Math.abs(got - want) <= tol * Math.max(Math.abs(want), 1e-12),
    `${label}: got ${got}, want ${want} (tol ${tol * 100}%)`);
};

test('S1 doi xung: 2 luc tiep xuc ±30° tu triet tieu ngang => khong can rang buoc', () => {
  const W = 34.78e3; // B500 L=12 m
  const contacts = s1ContactForces(W);
  // Độ lớn mỗi tiếp xúc: (W/2)/cos30° = 20,08 kN.
  approx(Math.hypot(contacts[0].Fx_N, contacts[0].Fy_N), 20.08e3, 0.001, '|F|');
  approx(contacts[0].Fx_N + contacts[1].Fx_N, 0, 1e-9, 'Fx triet tieu');
  approx(contacts[0].Fy_N + contacts[1].Fy_N, W, 1e-9, 'Fy = W');
  // Hệ chỉ còn lực đứng + tự trọng đã cân bằng bởi kê đáy ⇒ ràng buộc ngang = 0.
  // Bố trí ràng buộc: hai chèn ngang ở hai cao độ khác nhau (để hệ xác định),
  // một kê đáy đứng.
  const restraints = [
    { x_m: -0.5, y_m: 0, dx: 1, dy: 0, label: 'chen trai', pile: 'duoi-trai' },
    { x_m: 0.5, y_m: 0.43, dx: 1, dy: 0, label: 'chen phai', pile: 'duoi-phai' },
    { x_m: 0.3, y_m: -0.5, dx: 0, dy: 1, label: 'ke day' },
  ];
  const r = solveRestraints(
    [
      { Fx_N: contacts[0].Fx_N, Fy_N: 0, x_m: -0.25, y_m: 0.43, pile: 'tren' },
      { Fx_N: contacts[1].Fx_N, Fy_N: 0, x_m: 0.25, y_m: 0.43, pile: 'tren' },
    ],
    restraints,
  );
  approx(r.reactions[0].R_N, 0, 1e-6, 'R trai');
  approx(r.reactions[1].R_N, 0, 1e-6, 'R phai');
  assert.ok(r.equilibrium.ok);
});

test('Cum lech: chi con 1 tiep xuc nghieng => rang buoc phai chiu Fx', () => {
  // Cọc trên chỉ tựa một bên (lệch): tiếp xúc phải F = 20,08 kN hướng lên-phải.
  // Chỉ đưa thành phần ngang vào BT07 (thành phần đứng do kê đáy cân bằng — BT08).
  const F = 20.08e3, s = Math.sin(Math.PI / 6);
  const r = solveRestraints(
    [{ Fx_N: F * s, Fy_N: 0, x_m: 0.25, y_m: 0.43, pile: 'tren' }],
    [
      { x_m: -0.5, y_m: 0, dx: 1, dy: 0, label: 'chen trai', pile: 'duoi-trai' },
      { x_m: 0.5, y_m: 0.43, dx: 1, dy: 0, label: 'chen phai', pile: 'duoi-phai' },
      { x_m: 0.3, y_m: -0.5, dx: 0, dy: 1, label: 'ke day' },
    ],
  );
  assert.ok(r.equilibrium.ok);
  // Chèn phải (cùng phía với lực đẩy) chịu toàn bộ: R_phai = −10,04 kN
  // (hướng sang trái), chèn trái = 0, kê đáy đứng = 0.
  approx(r.reactions[0].R_N, 0, 1e-6, 'R trai');
  approx(r.reactions[1].R_N, -F * s, 1e-6, 'R phai');
  approx(r.reactions[2].R_N, 0, 1e-6, 'R ke day');
  // Phản lực không làm lệch lực tiếp xúc: lực tiếp xúc giữ nguyên trong đầu vào;
  // lực ròng trên cọc trên theo x = Fx_tiếp xúc + 0 (không có ràng buộc gắn vào nó).
  approx(r.perPileNetForce['tren'].Fx_N, F * s, 1e-9, 'luc ngang tren coc tren');
  // Lực ròng trên cọc dưới-phải theo x = phản lực chèn = −10,04 kN.
  approx(r.perPileNetForce['duoi-phai'].Fx_N, -F * s, 1e-9, 'luc ngang tren coc duoi-phai');
});

test('Rang buoc khong khoa tuy y moi coc: 1 rang buoc cho he 1 luc ngang', () => {
  const r = solveRestraints(
    [{ Fx_N: 5000, Fy_N: 0, x_m: 0, y_m: 1, pile: 'A' }],
    [{ x_m: 0, y_m: 0, dx: 1, dy: 0, label: 'chen', pile: 'A' }],
  );
  // 1 ràng buộc < 3 phương trình: nghiệm chuẩn tối thiểu + dư mô men ≠ 0 được báo.
  assert.ok(r.method.includes('thieu'));
  assert.equal(r.equilibrium.ok, false);
  // Phản lực vẫn cân bằng Fx (phần khả thi), mô men dư được ghi nhận.
  approx(r.reactions[0].R_N, -5000, 1e-9, 'R can bang Fx');
  assert.ok(Math.abs(r.equilibrium.residual_M_Nm) > 0, 'du mo men duoc bao');
});

test('Huong rang buoc phai la vecto don vi', () => {
  assert.throws(() => solveRestraints(
    [{ Fx_N: 1, Fy_N: 0, x_m: 0, y_m: 0 }],
    [{ x_m: 0, y_m: 0, dx: 2, dy: 0 }],
  ), /don vi/);
});
