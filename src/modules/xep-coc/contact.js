// BT04 — Nén tại vùng tiếp xúc cọc–kê và cọc–cọc (TCVN 5574:2018 §8.1.5).
// - Diện tích/áp lực tiếp xúc: tiếp xúc Hertz cho hai hình trụ song song
//   (cọc–kê phẳng cứng: R* = R; cọc–cọc: R* = R/2). Gỗ mô hình tuyệt đối
//   cứng nên E* chỉ lấy phía bê tông; KHÔNG tính nén/biến dạng gỗ.
// - Giới hạn nén cục bộ phía cọc: (116) N ≤ ψ·Rb,loc·Ab,loc, ψ = 0,75
//   (áp lực Hertz phân bố không đều); Rb,loc = φb·Rb (117); φb = 0,8·√(Ab,max/Ab,loc)
//   kẹp [1,0; 2,5] (118); Ab,max theo quy tắc mở rộng Hình 13 (mỗi cạnh mở
//   rộng bằng kích thước tương ứng của Ab,loc ⇒ 3× mỗi chiều).
// - Diện tích tiếp xúc KHÔNG lấy bằng tiết diện cọc hay tiết diện gỗ.
// Đơn vị SI: m, N, Pa.

import { TCVN5574 } from './tcvn5574.js';

const { Rb_Pa } = TCVN5574.concrete_B80;

/**
 * Tiếp xúc Hertz giữa hai hình trụ song song (hoặc trụ–mặt phẳng).
 * R2 = Infinity: mặt phẳng. E = Infinity: vật đối tuyệt đối cứng.
 */
export function hertzCylinderContact({ F_N, R1_m, R2_m, E1_Pa, nu1, E2_Pa, nu2, Lc_m }) {
  if (!(F_N > 0 && Lc_m > 0)) throw new Error('F_N va Lc_m phai > 0');
  const Rstar = 1 / (1 / R1_m + (R2_m === Infinity ? 0 : 1 / R2_m));
  const invEstar = (1 - nu1 * nu1) / E1_Pa + (E2_Pa === Infinity ? 0 : (1 - nu2 * nu2) / E2_Pa);
  const Estar = 1 / invEstar;
  const a_m = Math.sqrt((4 * F_N * Rstar) / (Math.PI * Lc_m * Estar));
  const p0_Pa = (2 * F_N) / (Math.PI * a_m * Lc_m);
  const area_m2 = 2 * a_m * Lc_m;
  const pMean_Pa = F_N / area_m2;
  return {
    a_m, p0_Pa, p_mean_Pa: pMean_Pa, area_m2, Rstar_m: Rstar, Estar_Pa: Estar,
    // Áp lực tại vị trí s (m) tính từ tâm vệt tiếp xúc, |s| ≤ a.
    pressureAt: (s_m) => {
      if (Math.abs(s_m) > a_m) return 0;
      return p0_Pa * Math.sqrt(1 - (s_m / a_m) ** 2);
    },
  };
}

/**
 * Kiểm tra nén cục bộ (116)–(118): N ≤ ψ·Rb,loc·Ab,loc.
 * @param {number} width_m — chiều rộng vệt tiếp xúc (2a); Lc_m — chiều dài.
 * Ab,max = (3·width) × (3·Lc) theo quy tắc Hình 13 (mở rộng mỗi cạnh bằng
 * kích thước tương ứng), giới hạn bởi bề mặt có sẵn nếu người dùng truyền vào.
 */
export function localBearingCheck({ F_N, width_m, Lc_m, Rb_Pa: Rb = Rb_Pa, Ab_max_m2 = null }) {
  const Ab_loc_m2 = width_m * Lc_m;
  const Ab_max = Ab_max_m2 ?? 9 * Ab_loc_m2; // 3× mỗi chiều
  const phi_b = Math.min(2.5, Math.max(1.0, 0.8 * Math.sqrt(Ab_max / Ab_loc_m2)));
  const Rb_loc_Pa = phi_b * Rb;
  const psi = 0.75; // áp lực Hertz phân bố không đều
  const N_allow_N = psi * Rb_loc_Pa * Ab_loc_m2;
  return {
    Ab_loc_m2, Ab_max_m2: Ab_max, phi_b, Rb_loc_Pa, psi,
    N_allow_N, utilization: F_N / N_allow_N, ok: F_N <= N_allow_N,
  };
}

/** Tiếp xúc cọc–kê gỗ: trụ (R = Do/2) trên mặt phẳng tuyệt đối cứng. */
export function pileBearerContact(pile, F_N, { Lc_m = 0.1, Eb_Pa = 42e9, nu = 0.2 } = {}) {
  const hertz = hertzCylinderContact({
    F_N, R1_m: pile.Do_mm / 2000, R2_m: Infinity,
    E1_Pa: Eb_Pa, nu1: nu, E2_Pa: Infinity, nu2: 0, Lc_m,
  });
  const bearing = localBearingCheck({ F_N, width_m: 2 * hertz.a_m, Lc_m });
  return {
    kind: 'coc-ke', F_N, Lc_m,
    a_m: hertz.a_m, contact_width_m: 2 * hertz.a_m,
    p0_Pa: hertz.p0_Pa, p_mean_Pa: hertz.p_mean_Pa, area_m2: hertz.area_m2,
    p0_over_Rb: hertz.p0_Pa / Rb_Pa,
    bearing,
    pressureAt: hertz.pressureAt,
  };
}

/** Tiếp xúc cọc–cọc: hai trụ cùng bán kính, cùng bê tông. */
export function pilePileContact(pile, F_N, { Lc_m, Eb_Pa = 42e9, nu = 0.2 } = {}) {
  if (!(Lc_m > 0)) throw new Error('Lc_m (chieu dai chong lap tiep xuc) la bat buoc');
  const hertz = hertzCylinderContact({
    F_N, R1_m: pile.Do_mm / 2000, R2_m: pile.Do_mm / 2000,
    E1_Pa: Eb_Pa, nu1: nu, E2_Pa: Eb_Pa, nu2: nu, Lc_m,
  });
  const bearing = localBearingCheck({ F_N, width_m: 2 * hertz.a_m, Lc_m });
  return {
    kind: 'coc-coc', F_N, Lc_m,
    a_m: hertz.a_m, contact_width_m: 2 * hertz.a_m,
    p0_Pa: hertz.p0_Pa, p_mean_Pa: hertz.p_mean_Pa, area_m2: hertz.area_m2,
    p0_over_Rb: hertz.p0_Pa / Rb_Pa,
    bearing,
    pressureAt: hertz.pressureAt,
  };
}
