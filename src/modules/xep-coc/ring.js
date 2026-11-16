// BT05 — Ép ngang, uốn vòng và nứt thành cọc rỗng (mô hình vành đàn hồi).
// Vành tròn mỏng (bán kính giữa thành rm, dày t) chịu hai tải hướng tâm đối
// nhau P (N/m dọc trục cọc): tải từ trên xuống tại đỉnh + phản lực kê tại đáy.
// Nghiệm cổ điển (Timoshenko, suy ra lại bằng Castigliano trong test):
//   M(θ) = P·rm·(1/π − sinθ/2),  θ tính từ điểm đặt tải;
//   M_max = +0,3183·P·rm tại điểm đặt tải (kéo thớ trong),
//   M = −0,1817·P·rm tại hông (θ = 90°, kéo thớ ngoài);
//   N(θ) = −(P/2)·sinθ (nén; N = 0 tại điểm đặt tải, N = −P/2 tại hông).
// Ứng suất vòng: σ = N/t ± M/W, W = t²/6 trên một đơn vị dài trục.
// Dự ứng lực dọc KHÔNG được coi là dự ứng lực vòng (không cộng vào kháng nứt).
//
// PHẠM VI HIỆU LỰC (mô hình sàng lọc): vành mỏng (t/rm ≤ ~0,5); tải coi như
// tải đường (bề rộng tiếp xúc 2a ≪ rm); BỎ QUA trải dài dọc trục (hiệu ứng
// vỏ 3D) nên kết quả thiên về an toàn — xem `L_eff_required_m`. Sau khi nứt,
// đai xoắn chịu kéo vòng nhưng BT05 chưa tính khả năng sau nứt (ghi rõ).
// Đơn vị SI: m, N, Pa.

import { TCVN5574 } from './tcvn5574.js';
import { sectionAt } from './pile_specs.js';

const { Rbt_Pa, Rbt_ser_Pa } = TCVN5574.concrete_B80;

/** Mô men và lực dọc vành tại góc θ (rad, từ điểm đặt tải) cho tải đường P. */
export function ringDiametral(P_line_N_per_m, R_m) {
  const M_at = (theta) => P_line_N_per_m * R_m * (1 / Math.PI - Math.sin(theta) / 2);
  const N_at = (theta) => (-P_line_N_per_m / 2) * Math.sin(theta);
  return {
    M_load_Nm_per_m: P_line_N_per_m * R_m / Math.PI,
    M_side_Nm_per_m: P_line_N_per_m * R_m * (1 / Math.PI - 0.5),
    N_side_N_per_m: -P_line_N_per_m / 2,
    M_at, N_at,
  };
}

/**
 * Kiểm tra vòng tại một mặt cắt ngang.
 * @param {object} pile — bản ghi BT00.
 * @param {number} F_N — lực hướng tâm tổng tại mặt cắt (N).
 * @param {number} Lc_m — chiều dài trải tải dọc trục (m): bề rộng kê (BT04)
 *   hoặc chiều dài chồng lấp (cọc–cọc).
 * @param {number} x_m, L_m — vị trí mặt cắt (để lấy hàm lượng đai thực tế).
 */
export function ringCheck(pile, F_N, Lc_m, x_m, L_m) {
  if (!(F_N > 0 && Lc_m > 0)) throw new Error('F_N va Lc_m phai > 0');
  const Ro = pile.Do_mm / 2000, Ri = pile.Di_mm / 2000;
  const t_m = Ro - Ri;
  const rm_m = (Ro + Ri) / 2;
  const P_line = F_N / Lc_m;
  const ring = ringDiametral(P_line, rm_m);
  const W_m3_per_m = (t_m * t_m) / 6; // trên một đơn vị dài trục
  // Thớ trong tại điểm đặt tải (M lớn nhất, N = 0): kéo thuần do uốn.
  const sigma_inner_load_Pa = ring.M_load_Nm_per_m / W_m3_per_m;
  // Hông: kéo thớ ngoài do uốn, trừ nén màng N/t.
  const sigma_outer_side_Pa = Math.abs(ring.M_side_Nm_per_m) / W_m3_per_m
    + ring.N_side_N_per_m / t_m; // N âm (nén) ⇒ giảm kéo
  const sigma_max_Pa = Math.max(sigma_inner_load_Pa, sigma_outer_side_Pa);
  const crack_location = sigma_inner_load_Pa >= sigma_outer_side_Pa
    ? 'tho trong tai diem dat tai (dinh/day)'
    : 'tho ngoai tai hong (90 do)';
  // Giới hạn tải đường để không nứt (σ_max = Rbt,ser) và chiều dài trải tải
  // cần thiết với lực F đã cho.
  const P_line_allow = (Rbt_ser_Pa * W_m3_per_m) / (rm_m / Math.PI);
  const L_eff_required_m = F_N / P_line_allow;
  // Hàm lượng đai thực tế tại vùng tiếp xúc (thông tin; chưa dùng cho kháng nứt).
  const zone = sectionAt(pile, x_m * 1000, L_m * 1000);
  const spiral_ratio = (zone.spiral_layers * (Math.PI / 4) * zone.spiral_d_mm ** 2)
    / (zone.spiral_pitch_mm * t_m * 1000); // A_đai trên một đơn vị dài / (t·1)
  return {
    F_N, Lc_m, P_line_N_per_m: P_line,
    rm_m, t_m, t_over_rm: t_m / rm_m,
    M_load_Nm_per_m: ring.M_load_Nm_per_m,
    M_side_Nm_per_m: ring.M_side_Nm_per_m,
    sigma_inner_load_Pa, sigma_outer_side_Pa, sigma_max_Pa,
    crack_location,
    utilization_crack: sigma_max_Pa / Rbt_ser_Pa,
    utilization_strength: sigma_max_Pa / Rbt_Pa,
    cracked_elastic: sigma_max_Pa > Rbt_ser_Pa,
    P_line_allow_N_per_m: P_line_allow,
    L_eff_required_m,
    spiral: { zone: zone.zone, pitch_mm: zone.spiral_pitch_mm, layers: zone.spiral_layers, ratio: spiral_ratio },
    Rbt_ser_Pa, Rbt_Pa,
  };
}
