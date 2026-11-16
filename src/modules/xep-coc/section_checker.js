// BT03 (đầy đủ) — Kiểm tra tiết diện cọc PHC theo TCVN 5574:2018.
// Uốn (9.2), cắt (8.1.3), ứng suất bê tông và nứt (9.3, 8.2.2).
// Công thức đã đối chiếu với toàn văn TCVN 5574:2018 (16/11/2026).
// Đơn vị SI: m, N, Pa.
//
// ⚠️ GIỚI HẠN ĐÃ XÁC MINH (ghi rõ trong kết quả `assumptions`):
// - TCVN không có công thức Mu trực tiếp cho tiết diện vành khuyên ƯST chịu
//   uốn thuần túy (Phụ lục F chỉ cho cột vành khuyên KHÔNG ƯST chịu nén lệch
//   tâm). Mu ở đây dùng mô hình nội lực giới hạn tự xây dựng trên vành khuyên
//   theo giả thiết 8.1.2.2.1 (Rb đều trên vùng nén, bê tông chịu kéo = 0,
//   tiết diện phẳng, εb2 = 0,003133) — xem thuyết minh BT03.
// - Phụ lục L không có γ cho Wpl của tiết diện vành khuyên ⇒ γ = 1,3
//   (giá trị tiết diện chữ nhật) là GIẢ THIẾT; luôn báo kèm giá trị đàn hồi
//   γ = 1,0 để đối chiếu.
// - TCVN không có điều khoản riêng cho đai xoắn trong tính cắt và không định
//   nghĩa b, h0 cho vành khuyên ⇒ b = 2·t, h0 = Do − a (a = (Do−Dp)/2),
//   một bước xoắn cắt tiết diện nghiêng hai lần ⇒ Asw = 2·A_dây.
// - Rsw của đai xoắn (SWM-C, mác không ghi trên bản vẽ): lấy trần 300 MPa
//   theo 6.2.2.3 — GIẢ THIẾT, chờ số liệu nhà sản xuất.

import { TCVN5574, pcSteelDesign } from './tcvn5574.js';
import { sectionGeometry, pcSteelArea, sectionAt } from './pile_specs.js';

const { Rb_Pa, Rbt_Pa, Rbt_ser_Pa, Rb_ser_Pa, Eb_Pa, eps_b2 } = TCVN5574.concrete_B80;

/** Diện tích phân đoạn tròn: đoạn vành tròn bán kính R, sâu h tính từ đỉnh. */
export function circleSegmentArea(R_m, h_m) {
  if (h_m <= 0) return 0;
  if (h_m >= 2 * R_m) return Math.PI * R_m * R_m;
  return R_m * R_m * Math.acos((R_m - h_m) / R_m)
    - (R_m - h_m) * Math.sqrt(2 * R_m * h_m - h_m * h_m);
}
/** Mô men tĩnh của phân đoạn tròn đối với trục qua tâm (dương hướng lên). */
export function circleSegmentFirstMoment(R_m, h_m) {
  if (h_m <= 0) return 0;
  if (h_m >= 2 * R_m) return 0; // toàn hình tròn: mô men tĩnh = 0
  return (2 / 3) * Math.pow(2 * R_m * h_m - h_m * h_m, 1.5);
}

/** Vùng nén của vành khuyên khi chiều sâu vùng nén = x (tính từ thớ nén ngoài). */
export function compressionZone(pile, x_m) {
  const Ro = pile.Do_mm / 2000, Ri = pile.Di_mm / 2000, t = Ro - Ri;
  const A = circleSegmentArea(Ro, x_m) - circleSegmentArea(Ri, Math.max(0, x_m - t));
  const Q = circleSegmentFirstMoment(Ro, x_m) - circleSegmentFirstMoment(Ri, Math.max(0, x_m - t));
  return { A_m2: A, Q_m3: Q };
}

/** Vị trí các thanh PC: phân bố đều trên vòng Dp, một thanh ở đỉnh (giả thiết — bản vẽ không ghi góc đặt). */
export function barDepths(pile) {
  const { N1, d_mm } = pile.pc_bar;
  const rs = pile.Dp_mm / 2000;
  const depths = [];
  for (let i = 0; i < N1; i++) {
    const theta = (2 * Math.PI * i) / N1; // 0 = đỉnh
    depths.push({ y_m: pile.Do_mm / 2000 - rs * Math.cos(theta), theta });
  }
  return { depths, barArea_m2: (Math.PI / 4) * (d_mm / 1000) ** 2, rs_m: rs };
}

/**
 * Mô men nứt Mcrc (243): Mcrc = Rbt,ser·Wpl + P·ecore,p; ecore,p = r (e0p = 0).
 * Wpl = γ·Wred; γ = 1,3 là giả thiết (Phụ lục L không có vành khuyên).
 */
export function crackingMoment(pile, lossResult, gamma_pl = 1.3) {
  const ts = lossResult.section;
  const Wpl_m3 = gamma_pl * ts.Wred_m3;
  const Mcrc_Nm = Rbt_ser_Pa * Wpl_m3 + lossResult.P_eff_N * ts.r_m;
  const Mcrc_elastic_Nm = Rbt_ser_Pa * ts.Wred_m3 + lossResult.P_eff_N * ts.r_m;
  return { Mcrc_Nm, Mcrc_elastic_Nm, gamma_pl, Wpl_m3, r_m: ts.r_m, P_eff_N: lossResult.P_eff_N };
}

/**
 * Sức kháng uốn Mu — mô hình nội lực giới hạn trên vành khuyên (xem đầu file).
 * @param {object} pile, lossResult — như trên.
 * @param {number} sigma_steel_Pa — ứng suất thép dùng trong tương thích biến
 *   dạng (mặc định σpe; giai đoạn truyền lực dùng σsp(1)).
 * @param {number} N_ext_N — lực dọc ngoài, dương = nén (mặc định 0 = uốn thuần).
 * @returns {Mu_Nm, x_m, xi, xi_R, over_reinforced, equilibrium_residual_N, ...}
 */
export function ultimateMoment(pile, lossResult, sigma_steel_Pa = null, N_ext_N = 0) {
  const steel = pcSteelDesign(pile);
  const Es = steel.Es_Pa;
  const sigma_pe = sigma_steel_Pa ?? lossResult.sigma_pe_Pa;
  const { depths, barArea_m2 } = barDepths(pile);
  const Do = pile.Do_mm / 1000;
  const a_m = (pile.Do_mm - pile.Dp_mm) / 2000; // lớp bảo vệ tới trọng tâm thép
  const h0 = Do - a_m;
  // ξR (31)/(223): tử số 0,7 cho B70–B100; εs,el = (Rs + 400 − 0,9·σsp)/Es.
  const eps_s_el = (steel.Rs_Pa + 400e6 - 0.9 * sigma_pe) / Es;
  const xi_R = 0.7 / (1 + eps_s_el / eps_b2);
  const x_R = xi_R * h0;

  const forcesAt = (x) => {
    const { A_m2, Q_m3 } = compressionZone(pile, x);
    const C = Rb_Pa * A_m2;
    let T = 0, M_steel = 0;
    for (const { y_m } of depths) {
      const d_eps = eps_b2 * (y_m - x) / x; // tăng biến dạng do uốn (kéo +)
      let sig = sigma_pe + Es * d_eps;
      sig = Math.min(sig, steel.Rs_Pa);
      sig = Math.max(sig, -steel.Rsc_Pa);
      const Ti = sig * barArea_m2;
      T += Ti;
      M_steel += Ti * (y_m - Do / 2);
    }
    // Mu quanh trục trọng tâm: C·(Q/A) + ΣT·z (Q dương hướng lên).
    const M_conc = C * (Q_m3 / Math.max(A_m2, 1e-12));
    return { C, T, Mu: M_conc + M_steel, A_comp: A_m2 };
  };

  // Giải cân bằng C(x) − T(x) = N_ext bằng chia đôi trên x ∈ (0, Do).
  const f = (x) => { const { C, T } = forcesAt(x); return C - T - N_ext_N; };
  let lo = 1e-6, hi = Do - 1e-6;
  let flo = f(lo), fhi = f(hi);
  let x, over = false;
  if (flo * fhi > 0) {
    // Không có nghiệm trong khoảng: vùng nén cần vượt tiết diện ⇒ lấy x = Do.
    x = Do;
  } else {
    for (let i = 0; i < 200; i++) {
      x = (lo + hi) / 2;
      const fx = f(x);
      if (Math.abs(fx) < 1e-3) break;
      if (fx * flo > 0) { lo = x; flo = fx; } else { hi = x; }
    }
  }
  const xi = x / h0;
  if (xi > xi_R) {
    // 8.1.2.3.5: dùng x = ξR·h0 khi As lớn hơn cần thiết.
    x = x_R; over = true;
  }
  const { C, T, Mu, A_comp } = forcesAt(x);
  return {
    Mu_Nm: Mu, x_m: x, xi: x / h0, xi_R, over_reinforced: over,
    C_N: C, T_N: T, equilibrium_residual_N: C - T - N_ext_N,
    h0_m: h0, N_ext_N, sigma_steel_Pa: sigma_pe,
  };
}

/**
 * Sức kháng cắt Qu theo 8.1.3 (dải bê tông (88) + tiết diện nghiêng (89)–(92)).
 * @param {object} opts.x_m — vị trí tiết diện (m) để lấy vùng đai theo section(x).
 */
export function shearResistance(pile, lossResult, x_m, L_m) {
  const zone = sectionAt(pile, x_m * 1000, L_m * 1000);
  const t_m = (pile.Do_mm - pile.Di_mm) / 2000;
  const b_m = 2 * t_m; // hai vách vành khuyên chịu cắt (giả thiết — xem đầu file)
  const a_m = (pile.Do_mm - pile.Dp_mm) / 2000;
  const h0 = pile.Do_mm / 1000 - a_m;
  // qsw (92): Asw = số lớp × 2·A_dây trên một bước xoắn (một vòng xoắn cắt
  // tiết diện nghiêng hai lần; vùng đầu có 2 lớp đai); Rsw = 300 MPa (trần 6.2.2.3).
  const Rsw_Pa = 300e6;
  const A_wire_m2 = (Math.PI / 4) * (zone.spiral_d_mm / 1000) ** 2;
  const Asw_m2 = zone.spiral_layers * 2 * A_wire_m2;
  const sw_m = zone.spiral_pitch_mm / 1000;
  const qsw = (Rsw_Pa * Asw_m2) / sw_m; // N/m
  // φn (8.1.3.3.2): σm = P_eff/Ared (nén trung bình do dự ứng lực).
  const sigma_m = lossResult.P_eff_N / lossResult.section.Ared_m2;
  let phi_n;
  if (sigma_m <= 0.25 * Rb_Pa) phi_n = 1 + sigma_m / Rb_Pa;
  else if (sigma_m <= 0.75 * Rb_Pa) phi_n = 1.25;
  else phi_n = 5 * (1 - sigma_m / Rb_Pa);
  // (88): Q ≤ φb1·Rb·b·h0, φb1 = 0,3.
  const Q_cap88 = phi_n * 0.3 * Rb_Pa * b_m * h0;
  // (96): qsw ≥ 0,25·Rbt·b mới kể thép ngang theo (90); nếu không, Qb theo (97).
  const qsw_min = 0.25 * Rbt_Pa * b_m;
  const qsw_ok = qsw >= qsw_min;
  const Qb_lim = [0.5 * Rbt_Pa * b_m * h0, 2.5 * Rbt_Pa * b_m * h0];
  let best = null;
  const steps = 200;
  for (let i = 0; i <= steps; i++) {
    const C = h0 + (i / steps) * h0; // C ∈ [h0, 2h0]
    const Qb = qsw_ok
      ? Math.min(Math.max((1.5 * Rbt_Pa * b_m * h0 * h0) / C, Qb_lim[0]), Qb_lim[1])
      : (4 * 1.5 * h0 * h0 * qsw) / C; // (97)
    const Qsw = 0.75 * qsw * C; // (91), φsw = 0,75
    const Q = Qb + Qsw;
    if (!best || Q < best.Q) best = { Q, C, Qb, Qsw };
  }
  const Qu_N = Math.min(phi_n * best.Q, Q_cap88);
  return {
    Qu_N, Q_cap88_N: Q_cap88, phi_n, sigma_m_Pa: sigma_m,
    qsw_N_per_m: qsw, qsw_min_N_per_m: qsw_min, qsw_ok,
    C_crit_m: best.C, Qb_N: best.Qb, Qsw_N: best.Qsw,
    b_m, h0_m: h0, zone: zone.zone, spiral_pitch_mm: zone.spiral_pitch_mm,
    spiral_layers: zone.spiral_layers, Rsw_Pa,
  };
}

/**
 * Độ mở vết nứt acrc (166) + (245) cho cấu kiện ƯST chịu uốn.
 * duration: 'short' | 'long'. acrc,u theo Bảng 17 (nhóm thép thanh cường độ
 * cao — giả thiết vì thép PC 6284-3 không có trong bảng): 0,4 / 0,3 mm.
 */
export function crackWidth(pile, lossResult, M_Nm, duration = 'long') {
  const steel = pcSteelDesign(pile);
  const Es = steel.Es_Pa;
  const ts = lossResult.section;
  const { Mcrc_Nm } = crackingMoment(pile, lossResult);
  const absM = Math.abs(M_Nm);
  if (absM <= Mcrc_Nm) return { cracked: false, Mcrc_Nm, acrc_mm: 0, acrc_u_mm: duration === 'long' ? 0.3 : 0.4, sigma_s_Pa: 0 };
  const Do = pile.Do_mm / 1000;
  const a_m = (pile.Do_mm - pile.Dp_mm) / 2000;
  const h0 = Do - a_m;
  const yc_m = Do / 2;
  const Eb_red_Pa = Rb_ser_Pa / 0.0015; // (169): Eb,red = Rb,n/εb1,red
  const alpha_s1 = Es / Eb_red_Pa;
  // (245): σs = [M·(h0 − yc)/Ired − Np/Ared]·αs1 (e0p = 0 ⇒ Mp = M).
  const sigma_s = ((absM * (h0 - yc_m)) / ts.Ired_m4 - lossResult.P_eff_N / ts.Ared_m2) * alpha_s1;
  const sigma_s_limit = steel.Rs_n_Pa - lossResult.sigma_pe_Pa;
  // (174): Ls = 0,5·(Abt/As)·ds; Abt = Ac/2 (nửa vành khuyên chịu kéo).
  const ds_m = pile.pc_bar.d_mm / 1000;
  const Abt_m2 = ts.Ac_m2 / 2;
  const Ls_raw = 0.5 * (Abt_m2 / ts.Ap_m2) * ds_m;
  const Ls_m = Math.min(Math.max(Ls_raw, Math.max(10 * ds_m, 0.1)), Math.min(40 * ds_m, 0.4));
  const psi_s = 1 - 0.8 * (Mcrc_Nm / absM); // (176)
  const phi1 = duration === 'long' ? 1.4 : 1.0;
  const phi2 = 0.5; // thép có gân/cáp (giả thiết cho thanh PC)
  const phi3 = 1.0; // uốn
  const acrc_m = phi1 * phi2 * phi3 * psi_s * (sigma_s / Es) * Ls_m;
  const acrc_u_mm = duration === 'long' ? 0.3 : 0.4;
  return {
    cracked: true, Mcrc_Nm, sigma_s_Pa: sigma_s, sigma_s_limit_Pa: sigma_s_limit,
    sigma_s_ok: sigma_s <= sigma_s_limit,
    Ls_m, psi_s, acrc_mm: acrc_m * 1000, acrc_u_mm,
    utilization: (acrc_m * 1000) / acrc_u_mm,
  };
}

/** Ứng suất thớ bê tông ở trạng thái sử dụng (P_eff + M), đối chiếu TTGH2. */
export function serviceStresses(pile, lossResult, M_Nm) {
  const ts = lossResult.section;
  const sigma_axial = lossResult.P_eff_N / ts.Ared_m2;
  const sigma_bend = (Math.abs(M_Nm) * (pile.Do_mm / 2000)) / ts.Ired_m4;
  return {
    sigma_top_Pa: sigma_axial + sigma_bend, // nén lớn nhất
    sigma_bot_Pa: sigma_axial - sigma_bend, // thớ đối diện (âm = kéo)
    Rb_ser_Pa, Rbt_ser_Pa,
    utilization_compression: (sigma_axial + sigma_bend) / Rb_ser_Pa,
    tension_exceeds_Rbt_ser: (sigma_bend - sigma_axial) > Rbt_ser_Pa,
  };
}

/**
 * Kiểm tra tiết diện tổng hợp tại một vị trí x với (M, Q) từ BT01/BT02.
 * Trả về Mcrc, Mu, Qu, nứt, ứng suất và hệ số sử dụng từng cơ chế.
 */
export function checkSection(pile, lossResult, { M_Nm, Q_N, x_m, L_m, duration = 'long' }) {
  const mcrc = crackingMoment(pile, lossResult);
  const mu = ultimateMoment(pile, lossResult);
  const shear = shearResistance(pile, lossResult, x_m, L_m);
  const crack = crackWidth(pile, lossResult, M_Nm, duration);
  const stress = serviceStresses(pile, lossResult, M_Nm);
  const u_bending = Math.abs(M_Nm) / mu.Mu_Nm;
  const u_shear = Math.abs(Q_N) / shear.Qu_N;
  const u_crack = crack.cracked ? crack.utilization : 0;
  const utils = { bending: u_bending, shear: u_shear, crack: u_crack };
  const governing = Object.entries(utils).sort((a, b) => b[1] - a[1])[0][0];
  return {
    pile_code: pile.code, x_m, L_m, M_Nm, Q_N,
    Mcrc_Nm: mcrc.Mcrc_Nm, Mcrc_elastic_Nm: mcrc.Mcrc_elastic_Nm,
    Mu_Nm: mu.Mu_Nm, xi: mu.xi, xi_R: mu.xi_R, over_reinforced: mu.over_reinforced,
    Qu_N: shear.Qu_N, shear_zone: shear.zone,
    cracked: crack.cracked, acrc_mm: crack.acrc_mm, acrc_u_mm: crack.acrc_u_mm,
    sigma_top_Pa: stress.sigma_top_Pa, sigma_bot_Pa: stress.sigma_bot_Pa,
    utilization: { ...utils, compression_service: stress.utilization_compression },
    governing, ok: u_bending <= 1 && u_shear <= 1 && u_crack <= 1,
    assumptions: [
      'Mu: mo hinh noi luc gioi han tu xay dung tren vanh khuyen (8.1.2.2.1); TCVN khong co cong thuc Mu truc tiep cho vanh khuyen UST.',
      'Mcrc: gamma = 1,3 (gia thiet; Phu luc L khong co vanh khuyen).',
      'Cat: b = 2t, h0 = Do - a; mot buoc xoan cat tiet dien nghieng hai lan; Rsw = 300 MPa (tran 6.2.2.3).',
      'Nut: acrc,u = 0,3/0,4 mm (Bang 17, nhom thep thanh cuong do cao — gia thiet).',
    ],
    details: { mcrc, mu, shear, crack, stress },
  };
}
