// BT06 — Truyền lực qua thanh kê gỗ 100×100 mm tuyệt đối cứng.
// Thanh kê là vật rắn: 2 bậc tự do (tịnh tiến đứng u + xoay θ). Mỗi điểm
// tiếp xúc với cọc dưới có độ cứng k_i (N/m) lấy từ BT01: cọc dưới đặt trên
// hai gối, chịu tải đơn vị tại điểm tiếp xúc ⇒ k_i = 1/v_i.
//   R_i = k_i·(u + θ·y_i)  (chỉ chịu nén; R_i < 0 ⇒ mất tiếp xúc, loại khỏi
//   hệ và giải lại — không chia đều mặc định).
//   [Σk, Σk·y; Σk·y, Σk·y²]·[u, θ]ᵀ = [ΣF, ΣF·y]ᵀ.
// Bảo toàn: ΣR = ΣF; ΣR·y = ΣF·y. Không kiểm tra gỗ (không môđun/sức kháng).
// Đơn vị SI: m, N, Pa. y: tọa độ ngang dọc thanh kê (m).

import { analyseBeam } from '../../core/fem_solver.js';
import { sectionGeometry } from './pile_specs.js';

/** Độ cứng khi tiếp xúc ngay tại gối: xem như cứng tuyệt đối (số học). */
export const RIGID_CONTACT_K_N_PER_M = 1e12;

/** Độ cứng đứng của cọc tại x (N/m): tải đơn vị tại x trên dầm BT01. */
export function pileStiffnessAt(pile, { L_m, x1_m, x2_m, x_m, E_Pa = 42e9 }) {
  const { I_m4 } = sectionGeometry(pile);
  const beam = analyseBeam({
    length_m: L_m,
    supports_m: [x1_m, x2_m],
    EI_Nm2: E_Pa * I_m4,
    pointLoads: [{ x_m, P_N: 1 }],
    elementsPerSegment: 10,
  });
  const v_m = -beam.deflection(x_m); // deflection() dương hướng lên; tải xuống ⇒ v âm
  // Tại gối (v ≈ 0): độ cứng → vô cùng; dùng số lớn thay thế (xem hằng số trên).
  if (!(v_m > 1e-12)) return RIGID_CONTACT_K_N_PER_M;
  return 1 / v_m;
}

/**
 * Giải thanh kê cứng trên các gối đàn hồi (cọc dưới).
 * @param {Array<{F_N, y_m}>} loads — tải xuống từ tầng trên.
 * @param {Array<{k_N_per_m, y_m, label?}>} contacts — điểm tiếp xúc cọc dưới.
 * @returns phản lực, chuyển động vật rắn, kiểm tra cân bằng, mất tiếp xúc.
 */
export function solveRigidBearer(loads, contacts) {
  if (!loads.length) throw new Error('can it nhat mot tai');
  if (!contacts.length) throw new Error('can it nhat mot diem tiep xuc');
  const totalF = loads.reduce((s, l) => s + l.F_N, 0);
  const totalM = loads.reduce((s, l) => s + l.F_N * l.y_m, 0);
  let active = contacts.map((c, i) => ({ ...c, index: i }));
  const dropped = [];
  let u, theta, reactions;
  for (;;) {
    if (active.length < 2) {
      throw new Error('Ke bi lat: tai nam ngoai pham vi goi, khong co can bang (chi con < 2 diem tiep xuc)');
    }
    const S0 = active.reduce((s, c) => s + c.k_N_per_m, 0);
    const S1 = active.reduce((s, c) => s + c.k_N_per_m * c.y_m, 0);
    const S2 = active.reduce((s, c) => s + c.k_N_per_m * c.y_m * c.y_m, 0);
    const det = S0 * S2 - S1 * S1;
    if (Math.abs(det) < 1e-12 * Math.max(1, S0 * S2)) {
      throw new Error('He goi suy bien (cac diem tiep xuc con lai thang hang — khong xac dinh duoc xoay)');
    }
    u = (totalF * S2 - totalM * S1) / det;
    theta = (S0 * totalM - S1 * totalF) / det;
    reactions = active.map((c) => ({
      ...c,
      R_N: c.k_N_per_m * (u + theta * c.y_m),
    }));
    const bad = reactions.find((r) => r.R_N < -1e-9 * Math.max(1, totalF));
    if (!bad) break;
    // Mất tiếp xúc: loại điểm có phản lực âm lớn nhất (theo trị tuyệt đối).
    const worst = reactions.reduce((a, b) => (a.R_N < b.R_N ? a : b));
    dropped.push({ ...worst, reason: 'mat tiep xuc (R < 0)' });
    active = active.filter((c) => c.index !== worst.index);
    if (!active.length) throw new Error('Tat ca diem tiep xuc deu mat — ke khong con goi');
  }
  const sumR = reactions.reduce((s, r) => s + r.R_N, 0);
  const sumRy = reactions.reduce((s, r) => s + r.R_N * r.y_m, 0);
  return {
    totalF_N: totalF, totalM_Nm: totalM,
    u_m: u, theta_rad: theta,
    reactions: reactions.map((r) => ({ y_m: r.y_m, R_N: r.R_N, k_N_per_m: r.k_N_per_m, label: r.label })),
    dropped,
    equilibrium: {
      sumR_minus_sumF_N: sumR - totalF,
      sumRy_minus_sumM_Nm: sumRy - totalM,
      ok: Math.abs(sumR - totalF) < 1e-6 * Math.max(1, totalF)
        && Math.abs(sumRy - totalM) < 1e-6 * Math.max(1, Math.abs(totalM)),
    },
  };
}

/**
 * Tiện ích: một tầng kê đầy đủ — tải từ các cọc trên (mỗi cọc một lực tại y)
 * truyền xuống các cọc dưới (mỗi cọc một độ cứng tại y, tính từ BT01).
 * @param {Array<{pile, L_m, x1_m, x2_m, x_m, y_m, label?}>} lowerPiles
 */
export function transferThroughBearer(loads, lowerPiles) {
  const contacts = lowerPiles.map((lp) => ({
    k_N_per_m: pileStiffnessAt(lp.pile, lp),
    y_m: lp.y_m,
    label: lp.label ?? lp.pile.code,
  }));
  return solveRigidBearer(loads, contacts);
}
