// BT01 — Một cọc đặt trên hai gối, có hai đoạn hẫng, chỉ chịu tự trọng.
// Lõi tính chuẩn SI (m, N, Pa). Tự trọng và EI tự tính từ cấu tạo BT00.
//
// Giả thiết (ghi rõ để BT03/BT10 đối chiếu lại):
// - Dầm Euler-Bernoulli, EI không đổi dọc cọc, lấy theo tiết diện hình học
//   tổng (bê tông vành khăn, I_m4 từ BT00) và E_b = 42 GPa (TCVN 5574 B80).
//   Chưa kể tiết diện quy đổi thép DƯL (ước ~+3% I) — tinh chỉnh ở BT03.
// - Gối: gối đơn tại x1 (khóa v) và x2 (khóa v); mặt phẳng uốn đứng, chưa
//   xét lực ngang (lực ngang chỉ xuất hiện ở S1/S3, xem BT09/BT12).
// - Dự ứng lực là nội lực tự cân bằng, không đổi phản lực/nội lực do tải
//   ngoài trong phân tích đàn hồi tuyến tính chưa nứt; kiểm tra tiết diện
//   có DƯL là việc của BT03.

import { analyseBeam } from '../../core/fem_solver.js';
import { sectionGeometry, selfWeightPerMetre } from './pile_specs.js';

/** E_b mặc định 42 GPa — TCVN 5574:2018 B80 (xem BT03_backcheck_sigma_pc.md). */
export const DEFAULT_EB_PA = 42e9;
/** gamma_c mặc định 25 kN/m³ — bê tông cốt thép theo tiêu chuẩn. */
export const DEFAULT_GAMMA_KN_M3 = 25;

/**
 * Phân tích BT01.
 * @param {object} pile bản ghi cọc trong data_in/pile_specs.json (BT00-3).
 * @param {object} opts
 * @param {number} opts.L_m chiều dài cọc do người dùng nhập, > 0.
 * @param {number} opts.x1_m vị trí gối 1 từ đầu cọc, 0 ≤ x1 < x2 ≤ L.
 * @param {number} opts.x2_m vị trí gối 2.
 * @param {number} [opts.E_Pa=42e9] môđun đàn hồi bê tông (Pa).
 * @param {number} [opts.gamma_kN_m3=25] trọng lượng thể tích bê tông.
 * @param {number} [opts.elementsPerSegment=10] số phần tử mỗi khoảng lưới.
 * @returns kết quả giải dầm kèm đầu vào đã dùng và giá trị hiển thị.
 */
export function analyseSinglePile(pile, opts) {
  const {
    L_m,
    x1_m,
    x2_m,
    E_Pa = DEFAULT_EB_PA,
    gamma_kN_m3 = DEFAULT_GAMMA_KN_M3,
    elementsPerSegment = 10,
  } = opts || {};
  if (!(L_m > 0)) throw new Error(`BT01: L_m phai > 0 (nhan ${L_m})`);
  if (!(E_Pa > 0)) throw new Error(`BT01: E_Pa phai > 0 (nhan ${E_Pa})`);
  if (!(gamma_kN_m3 > 0)) throw new Error(`BT01: gamma_kN_m3 phai > 0 (nhan ${gamma_kN_m3})`);

  const geom = sectionGeometry(pile);
  const w = selfWeightPerMetre(pile, gamma_kN_m3);
  const w_N_per_m = w.w_kN_per_m * 1000;
  const EI_Nm2 = E_Pa * geom.I_m4;

  const beam = analyseBeam({
    length_m: L_m,
    supports_m: [x1_m, x2_m],
    EI_Nm2,
    uniformLoad_N_per_m: w_N_per_m,
    elementsPerSegment,
  });

  const [R1, R2] = beam.reactions;
  return {
    bt: 'BT01',
    pile_code: pile.code,
    inputs: {
      L_m,
      x1_m,
      x2_m,
      overhang1_m: x1_m,
      overhang2_m: L_m - x2_m,
      span_m: x2_m - x1_m,
      E_Pa,
      E_source: 'TCVN 5574:2018 B80, Eb = 42 GPa (BT00-2)',
      gamma_kN_m3,
      gamma_source: 'tieu chuan, be tong cot thep 25 kN/m3',
      A_m2: geom.A_m2,
      I_m4: geom.I_m4,
      W_m3: geom.W_m3,
      w_N_per_m,
      EI_Nm2,
    },
    reactions: beam.reactions,
    // Giá trị hiển thị (đổi tại biên, lõi vẫn SI).
    display: {
      R1_kN: R1.R_N / 1000,
      R2_kN: R2.R_N / 1000,
      w_kN_per_m: w_N_per_m / 1000,
      EI_kNm2: EI_Nm2 / 1000,
      M_max_kNm: beam.extrema.M_max_Nm.value / 1000,
      M_max_x_m: beam.extrema.M_max_Nm.x_m,
      M_min_kNm: beam.extrema.M_min_Nm.value / 1000,
      M_min_x_m: beam.extrema.M_min_Nm.x_m,
      deflection_down_max_mm: beam.extrema.deflection_down_max_m.value * 1000,
      deflection_down_max_x_m: beam.extrema.deflection_down_max_m.x_m,
    },
    beam,
    equilibrium: beam.equilibrium,
  };
}
