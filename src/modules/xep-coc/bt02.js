// BT02 — Một cọc nhận tải tập trung từ tầng trên, đúng gối rồi lệch gối.
// Dùng chung solver BT01 (src/core/fem_solver.js); tải tầng trên đặt trên
// từng tuyến kê, mỗi tuyến khai báo độc lập.
//
// Quy ước tải:
// - Tải điểm: { P_N, x_m } — lực hướng xuống đặt đúng tại x_m.
// - Tải vệt: { P_N, x_m, length_m } — tổng lực P phân bố đều trên đoạn
//   [x_m − length_m/2, x_m + length_m/2], phải nằm gọn trong [0, L].
// So sánh với nền BT01 (chỉ tự trọng) để lấy phần tăng nội lực do tầng trên.

import { analyseBeam } from '../../core/fem_solver.js';
import { analyseSinglePile } from './bt01.js';

/**
 * Phân tích BT02.
 * @param {object} pile bản ghi cọc BT00-3.
 * @param {object} opts như BT01, thêm:
 * @param {Array<{P_N:number,x_m:number,length_m?:number}>} opts.loads tải tầng trên.
 */
export function analyseSinglePileWithLoads(pile, opts) {
  const { loads = [], ...bt01Opts } = opts || {};
  const { L_m } = bt01Opts;
  if (!(L_m > 0)) throw new Error(`BT02: L_m phai > 0 (nhan ${L_m})`);

  const pointLoads = [];
  const patchLoads = [];
  const loadsNorm = [];
  for (const ld of loads) {
    const { P_N, x_m, length_m = 0 } = ld;
    if (!(P_N > 0)) throw new Error(`BT02: P_N phai > 0 (nhan ${P_N})`);
    if (!(x_m >= 0 && x_m <= L_m)) {
      throw new Error(`BT02: vi tri tai x_m=${x_m} ngoai [0, ${L_m}]`);
    }
    if (length_m === 0) {
      pointLoads.push({ x_m, P_N });
      loadsNorm.push({ P_N, x_m, length_m: 0, kind: 'point' });
    } else {
      if (!(length_m > 0)) throw new Error(`BT02: length_m phai > 0 (nhan ${length_m})`);
      const xa = x_m - length_m / 2;
      const xb = x_m + length_m / 2;
      if (!(xa >= 0 && xb <= L_m)) {
        throw new Error(`BT02: vet tai [${xa}, ${xb}] vuot ngoai [0, ${L_m}]`);
      }
      patchLoads.push({ x1_m: xa, x2_m: xb, w_N_per_m: P_N / length_m });
      loadsNorm.push({ P_N, x_m, length_m, kind: 'patch', x1_m: xa, x2_m: xb });
    }
  }

  const baseline = analyseSinglePile(pile, bt01Opts);
  const { w_N_per_m, EI_Nm2 } = baseline.inputs;
  const beam = analyseBeam({
    length_m: L_m,
    supports_m: [bt01Opts.x1_m, bt01Opts.x2_m],
    EI_Nm2,
    uniformLoad_N_per_m: w_N_per_m,
    pointLoads,
    patchLoads,
    elementsPerSegment: bt01Opts.elementsPerSegment ?? 10,
  });

  const [R1, R2] = beam.reactions;
  const [bR1, bR2] = baseline.reactions;
  return {
    bt: 'BT02',
    pile_code: pile.code,
    inputs: { ...baseline.inputs, loads: loadsNorm },
    reactions: beam.reactions,
    baseline: {
      R1_kN: bR1.R_N / 1000,
      R2_kN: bR2.R_N / 1000,
      M_max_kNm: baseline.display.M_max_kNm,
      M_min_kNm: baseline.display.M_min_kNm,
    },
    display: {
      R1_kN: R1.R_N / 1000,
      R2_kN: R2.R_N / 1000,
      dR1_kN: (R1.R_N - bR1.R_N) / 1000,
      dR2_kN: (R2.R_N - bR2.R_N) / 1000,
      M_max_kNm: beam.extrema.M_max_Nm.value / 1000,
      M_max_x_m: beam.extrema.M_max_Nm.x_m,
      M_min_kNm: beam.extrema.M_min_Nm.value / 1000,
      M_min_x_m: beam.extrema.M_min_Nm.x_m,
      dM_max_kNm: (beam.extrema.M_max_Nm.value - baseline.beam.extrema.M_max_Nm.value) / 1000,
      dM_min_kNm: (beam.extrema.M_min_Nm.value - baseline.beam.extrema.M_min_Nm.value) / 1000,
      deflection_down_max_mm: beam.extrema.deflection_down_max_m.value * 1000,
    },
    beam,
    baselineBeam: baseline.beam,
    equilibrium: beam.equilibrium,
  };
}
