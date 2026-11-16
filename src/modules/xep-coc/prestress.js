// BT00/BT03 — Ứng suất hữu hiệu sigma_pc (sigma_ce) tính ngược từ bản vẽ,
// theo TCVN 7888:2014 và phương pháp JIS A 5337 (Phụ lục A TCVN 7888).
//
// ⚠️ TRẠNG THÁI theo Plan v0.5.0 (16/11/2026): đây chỉ là ĐỐI CHIẾU CHẨN ĐOÁN.
// Không dùng các giá trị sigma_pc/sigma_pe suy từ Mcr/Mu hay cấp tải A/AB/B/C
// làm đầu vào hay ngưỡng tính. BT03 đầy đủ phải tự tính từng khoản tổn hao
// và dự ứng lực hữu hiệu theo TCVN 5574:2018 §9.1 (căng trước cơ khí, hầm sấy
// vài giờ → tháo khuôn → dưỡng hộ tự nhiên). Code và test dưới đây được giữ
// nguyên vì phép tính số học vẫn đúng với vai trò đối chiếu; chỉ đổi trạng thái
// sử dụng, không đổi kết quả số.
//
// NGUỒN CHÍNH (không trộn hệ số giữa các hệ tiêu chuẩn):
// - TCVN 7888:2014 §6.5: sigma_ce tính toán theo cấp tải A/AB/B/C lần lượt
//   là 4 / 6 / 8 / 10 MPa, sai số cho phép ±5%. Đây là giá trị THIẾT KẾ
//   dùng cho BT01-BT03.
// - TCVN 7888:2014 §6.6 + Bảng 1: Mu = kr * Mcr, kr = 1,50 / 1,65 / 1,80 / 2,00
//   cho A / AB / B / C. Mu trên bản vẽ Phan Vũ khớp kr*Mcr trong 0,3% cho
//   33/33 mã — Mu KHÔNG phải kết quả phân tích cực hạn độc lập.
// - TCVN 7888:2014 Bảng 1: Mcr trên bản vẽ = giá trị tối thiểu của tiêu chuẩn
//   cho cùng Do/cấp tải. Lưu ý: chiều dày t trên bản vẽ Phan Vũ lớn hơn
//   t tối thiểu trong Bảng 1 (vd D350: 65 mm so với 60 mm), nên Mcr công bố
//   là giá trị tối thiểu của tiêu chuẩn, không phải Mcr tính lại chính xác
//   cho tiết diện thực tế dày hơn.
// - Mcr = Ze * (fr + sigma_ce) là công thức đối chiếu (JIS A 5337, và bản
//   tính PHC theo TCVN 7888: Mcr' = Ze*(sigma_bt + sigma_ce)).
//   Với sigma_ce danh nghĩa ở trên, fr suy ra từ Mcr công bố là 5,65-7,11 MPa,
//   trung bình ~6,3 MPa — khớp fr = 0,63*sqrt(80) = 5,64 MPa (AASHTO LRFD)
//   và gần fctm,fl của Eurocode 2 cho C80/95. Dùng fr = 6,3 MPa CHỈ để
//   đối chiếu, không dùng làm cường độ chịu kéo thiết kế (xem materials.js).
// - Phương pháp thuận JIS (sigma_pi -> sigma_pt -> tổn hao -> sigma_pe):
//   sigma_pi = min(0,8*fpy, 0,7*fpu) = 994 MPa; Ec = 39.227 GPa,
//   Ecp = 32.166 GPa, Ep = 196.133 GPa, epsilon_s = 1,5e-4, psi = 2,0,
//   hệ số chùng k = 0,025. Phương pháp này cho sigma_pe ~750-870 MPa,
//   khớp sigma_pe suy từ sigma_ce danh nghĩa (678-878 MPa), NHƯNG nếu dùng
//   sigma_bt = 80 kgf/cm2 = 7,85 MPa thì Mcr dự báo cao hơn Mcr công bố
//   12-27%. Vì vậy KHÔNG dùng sigma_bt = 7,85 MPa để tính ngược sigma_ce
//   từ Mcr công bố; dùng sigma_ce danh nghĩa TCVN §6.5 làm giá trị chính.
//
// Đơn vị: mm, N, MPa.

export const SIGMA_CE_BY_CLASS = { A: 4, AB: 6, B: 8, C: 10 }; // MPa, TCVN 7888 §6.5
export const SIGMA_CE_TOLERANCE = 0.05; // ±5%
export const KR_BY_CLASS = { A: 1.5, AB: 1.65, B: 1.8, C: 2.0 }; // TCVN 7888 §6.6
export const FR_BACKCHECK_MPA = 6.3; // MPa, chỉ dùng để đối chiếu Mcr (xem trên)

// Vật liệu xác định theo tiêu chuẩn (người dùng yêu cầu tự xác định):
// - Eb: TCVN 5574:2018 B80 = 42.000 MPa; Eurocode 2 C80/95 Ecm = 42.200 MPa;
//   AASHTO Ec = 4800*sqrt(80) = 42.933 MPa. Ba hệ khớp trong ~2% -> dùng 42.000.
// - Ep: 200.000 MPa (JIS G3137 / AASHTO; bản tính JIS dùng 196.133 MPa).
// - gamma_c: 25 kN/m3 (bê tông cốt thép, TCVN 5574 / Eurocode 2). Bê tông ly tâm
//   đặc hơn có thể 25-26 kN/m3; cần cân thực tế / số liệu nhà sản xuất để xác nhận.
export const MATERIALS = {
  concrete: {
    f_c_cyl_MPa: 80, specimen: 'cylinder D150xH300',
    Eb_MPa: 42000, Eb_source: 'TCVN 5574:2018 B80, Table 10 (EC2 C80/95 Ecm 42200, AASHTO 42933 — khop trong ~2%)',
    fcm_MPa_EC2: 88, fctm_MPa_EC2: 4.8, fctk005_MPa_EC2: 3.4,
    Rb_MPa_TCVN: 41, Rbt_MPa_TCVN: 2.1, Rbser_MPa_TCVN: 57, Rbtser_MPa_TCVN: 3.3,
    fr_AASHTO_MPa: 5.64, // 0,63*sqrt(80)
  },
  pc_steel: { Ep_MPa: 200000, Ep_JIS_MPa: 196133, f_pu_MPa: 1420, f_py_MPa: 1275 },
  gamma_c_kN_m3: 25,
};

export function sectionModulusGross(pile) {
  const { Do_mm: Do, Di_mm: Di } = pile;
  const I = (Math.PI / 64) * (Do ** 4 - Di ** 4);
  return I / (Do / 2); // mm3
}

export function pcArea(pile) {
  return pile.pc_bar.N1 * (Math.PI / 4) * pile.pc_bar.d_mm ** 2;
}

/** sigma_ce danh nghĩa theo cấp tải (TCVN 7888 §6.5). */
export function sigmaCeNominal(pile) {
  const v = SIGMA_CE_BY_CLASS[pile.class];
  if (v == null) throw new Error(`Cap tai khong biet: ${pile.class}`);
  return v;
}

/** sigma_pe suy từ sigma_ce danh nghĩa: sigma_pe = sigma_ce * A0 / Ap, A0 = Ac - Ap. */
export function sigmaPeFromNominal(pile) {
  const { Do_mm: Do, Di_mm: Di } = pile;
  const Ac = (Math.PI / 4) * (Do * Do - Di * Di);
  const Ap = pcArea(pile);
  return sigmaCeNominal(pile) * (Ac - Ap) / Ap;
}

/** Mcr dự báo bằng công thức đối chiếu, chỉ để kiểm tra tính nhất quán. */
export function mcrBackcheck(pile, fr_MPa = FR_BACKCHECK_MPA) {
  const W = sectionModulusGross(pile);
  const mcr_pred_kNm = (W * (fr_MPa + sigmaCeNominal(pile))) / 1e6;
  const err = (mcr_pred_kNm - pile.Mcr_kNm) / pile.Mcr_kNm;
  return {
    W_mm3: W, fr_MPa, sigma_ce_MPa: sigmaCeNominal(pile),
    mcr_pred_kNm, mcr_pub_kNm: pile.Mcr_kNm, rel_err: err,
    fr_implied_MPa: (pile.Mcr_kNm * 1e6) / W - sigmaCeNominal(pile),
  };
}

/** Mu theo TCVN §6.6: Mu = kr * Mcr. Kiểm tra Mu công bố có khớp không. */
export function muCheck(pile) {
  const kr = KR_BY_CLASS[pile.class];
  const mu_pred = kr * pile.Mcr_kNm;
  return { kr, mu_pred_kNm: mu_pred, mu_pub_kNm: pile.Mu_kNm, rel_err: (pile.Mu_kNm - mu_pred) / mu_pred };
}

/**
 * Phương pháp thuận JIS A 5337 / Phụ lục A TCVN 7888 (chỉ để đối chiếu,
 * không dùng làm giá trị thiết kế chính — xem ghi chú đầu file).
 * Trả về sigma_pt, sigma_cpt, tổn hao, sigma_pe, sigma_ce_forward.
 */
export function prestressForwardJIS(pile) {
  const K = 0.0980665; // 1 kgf/cm2 = 0,0980665 MPa
  const sig_pi = Math.min(0.8 * 1275, 0.7 * 1420); // 994 MPa
  const Ec = 4.0e5 * K, Ecp = 3.28e5 * K, Ep = 2.0e6 * K;
  const nPrime = Ep / Ecp, n = Ep / Ec;
  const epsS = 1.5e-4, psi = 2.0, kRelax = 0.025;
  const { Do_mm: Do, Di_mm: Di } = pile;
  const Ac = (Math.PI / 4) * (Do * Do - Di * Di) / 100; // cm2
  const Ap = pcArea(pile) / 100; // cm2
  const A0 = Ac - Ap;
  const sig_pt = sig_pi * (1 - kRelax / 2) / (1 + nPrime * (Ap / A0));
  const sig_cpt = sig_pt * (Ap / A0);
  const dPsi = (n * psi * sig_cpt + Ep * epsS) / (1 + n * (sig_cpt / sig_pt) * (1 + 0.5 * psi));
  const dR = 0.5 * kRelax * sig_pt;
  const sig_pe = sig_pt - dPsi - dR;
  const sig_ce = sig_pe * (Ap / A0);
  return { sig_pi_MPa: sig_pi, sig_pt_MPa: sig_pt, sig_cpt_MPa: sig_cpt, loss_creep_shrink_MPa: dPsi, loss_relax_MPa: dR, sig_pe_MPa: sig_pe, sig_ce_forward_MPa: sig_ce };
}
