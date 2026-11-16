// BT08 — Hai tuyến kê đáy trên nền cứng lý tưởng, không lún.
// Mỗi cọc tính như BT01 (dầm hai gối + tự trọng + tải tập trung/vệt nếu có),
// phản lực đáy = phản lực gối. Tổng phản lực = tổng tải hệ (kiểm chứng).
// Nền KHÔNG có thông số trong API — thiếu dữ liệu nền không tạo trạng thái
// thiếu dữ liệu cho bài tính cọc (Plan §6.2, §11.3 BT08). Không có kết quả
// sức chịu tải hay lún nền.
// Đơn vị SI: m, N, Pa.

import { analyseBeam } from '../../core/fem_solver.js';
import { sectionGeometry, selfWeightPerMetre } from './pile_specs.js';

/**
 * @param {Array<{pile, L_m, x1_m, x2_m, pointLoads?: [{x_m, P_N}], patchLoads?: [{x1_m, x2_m, w_N_per_m}]}>} piles
 * @returns phản lực từng cọc, tổng hệ, kiểm tra cân bằng và đối xứng.
 */
export function bottomReactions(piles) {
  if (!piles.length) throw new Error('can it nhat mot coc');
  const perPile = piles.map((pc) => {
    const { pile, L_m, x1_m, x2_m } = pc;
    const { I_m4 } = sectionGeometry(pile);
    const w_N_per_m = selfWeightPerMetre(pile).w_kN_per_m * 1000;
    const beam = analyseBeam({
      length_m: L_m,
      supports_m: [x1_m, x2_m],
      EI_Nm2: 42e9 * I_m4,
      uniformLoad_N_per_m: w_N_per_m,
      pointLoads: pc.pointLoads ?? [],
      patchLoads: pc.patchLoads ?? [],
      elementsPerSegment: 10,
    });
    const [R1, R2] = beam.reactions;
    const totalLoad = w_N_per_m * L_m
      + (pc.pointLoads ?? []).reduce((s, p) => s + p.P_N, 0)
      + (pc.patchLoads ?? []).reduce((s, p) => s + p.w_N_per_m * (p.x2_m - p.x1_m), 0);
    return {
      pile_code: pile.code, L_m, x1_m, x2_m,
      R1_N: R1.R_N, R2_N: R2.R_N,
      totalLoad_N: totalLoad,
      equilibrium_error_N: (R1.R_N + R2.R_N) - totalLoad,
    };
  });
  const totalR = perPile.reduce((s, p) => s + p.R1_N + p.R2_N, 0);
  const totalLoad = perPile.reduce((s, p) => s + p.totalLoad_N, 0);
  // Đối xứng: mọi cọc cùng tải và cùng vị trí gối ⇒ R1 = R2 từng cọc.
  const symmetric = perPile.every((p) => Math.abs(p.R1_N - p.R2_N) < 1e-6 * Math.max(1, p.R1_N));
  return {
    perPile,
    totalReaction_N: totalR,
    totalLoad_N: totalLoad,
    equilibrium_error_N: totalR - totalLoad,
    equilibrium_ok: Math.abs(totalR - totalLoad) < 1e-6 * Math.max(1, totalLoad),
    symmetric,
  };
}
