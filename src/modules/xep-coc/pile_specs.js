// BT00 — Chuẩn hóa thông số cọc, phân vùng section(x), vật liệu, đơn vị, nguồn.
// Đơn vị nội bộ: mm, N, MPa (= N/mm2), kN.m cho mômen công bố trên bản vẽ.
// sigma_pc (sigma_ce), E_b, E_p, gamma_c KHÔNG có trên bản vẽ — đã xác định
// theo tiêu chuẩn, xem prestress.js (TCVN 7888 §6.5/§6.6, TCVN 5574, EC2,
// AASHTO/JIS). gamma_c mặc định 25 kN/m3 theo tiêu chuẩn (xem selfWeightPerMetre).

export const MISSING = 'chua_du_du_lieu';

/** Diện tích, mômen quán tính, môđun kháng uốn của tiết diện vành khăn. */
export function sectionGeometry(pile) {
  const { Do_mm: Do, Di_mm: Di } = pile;
  if (!(Do > Di && Di > 0)) throw new Error(`Do/Di khong hop le: ${Do}/${Di}`);
  const A_mm2 = (Math.PI / 4) * (Do * Do - Di * Di);
  const I_mm4 = (Math.PI / 64) * (Do ** 4 - Di ** 4);
  const W_mm3 = I_mm4 / (Do / 2);
  const t_mm = (Do - Di) / 2;
  return { A_mm2, I_mm4, W_mm3, t_mm, A_m2: A_mm2 * 1e-6, I_m4: I_mm4 * 1e-12, W_m3: W_mm3 * 1e-9 };
}

/** Diện tích thép dự ứng lực Ap (mm2). */
export function pcSteelArea(pile) {
  const { d_mm: d, N1 } = pile.pc_bar;
  return N1 * (Math.PI / 4) * d * d;
}

/** Diện tích thép gia cường đầu cọc Agc (mm2), 0 nếu không có. */
export function gcSteelArea(pile) {
  if (!pile.gc_bar) return 0;
  const { d_mm: d, N2 } = pile.gc_bar;
  return N2 * (Math.PI / 4) * d * d;
}

/**
 * section(x): đặc trưng thép/đai tại tọa độ dọc trục x (mm, tính từ đầu cọc).
 * - Vùng đầu: x < L_end (= 2*Do) hoặc x > L - L_end: đai 2 lớp, bước 50 mm.
 * - Vùng thân giữa: đai 1 lớp, bước 100 mm.
 * - Thép GC (nếu có, chỉ Do >= 600): có mặt trong L2 = 1000 mm từ mỗi đầu.
 *   Đây là giả thiết ghi rõ trong thuyết minh BT00 (bản vẽ chỉ ghi L2, không
 *   ghi rõ GC ở một đầu hay hai đầu; chi tiết đầu đoạn cọc vẽ ở cả hai đầu).
 * Trả về {zone, spiral_pitch_mm, spiral_layers, has_gc, L_end_mm}.
 */
export function sectionAt(pile, x_mm, L_mm) {
  if (!(L_mm > 0)) throw new Error('L_mm phai > 0');
  if (x_mm < 0 || x_mm > L_mm) throw new Error(`x=${x_mm} nam ngoai [0, ${L_mm}]`);
  const L_end = pile.spiral.L_end_mm; // 2*Do
  const inEnd = x_mm < L_end || x_mm > L_mm - L_end;
  const hasGc = !!pile.gc_bar &&
    (x_mm < pile.gc_bar.L2_mm || x_mm > L_mm - pile.gc_bar.L2_mm);
  return {
    zone: inEnd ? 'dau_coc' : 'than_giua',
    spiral_pitch_mm: inEnd ? pile.spiral.pitch_end_mm : pile.spiral.pitch_mid_mm,
    spiral_layers: inEnd ? pile.spiral.layers_end : pile.spiral.layers_mid,
    spiral_d_mm: pile.spiral.d_mm,
    has_gc: hasGc,
    gc_area_mm2: hasGc ? gcSteelArea(pile) : 0,
    L_end_mm: L_end,
  };
}

/**
 * Tự trọng dài (kN/m). gamma_c xác định theo tiêu chuẩn: 25 kN/m3
 * (bê tông cốt thép, TCVN 5574 / Eurocode 2). Bê tông ly tâm đặc hơn có thể
 * 25-26 kN/m3 — cần cân thực tế / số liệu nhà sản xuất để xác nhận.
 * Có thể truyền gamma khác để ghi đè; mặc định dùng giá trị tiêu chuẩn.
 */
export function selfWeightPerMetre(pile, gamma_kN_m3 = 25) {
  const { A_m2 } = sectionGeometry(pile);
  return { status: 'standard_25kN_m3', w_kN_per_m: A_m2 * gamma_kN_m3, gamma_kN_m3 };
}

/** Chiều dài đoạn cọc L (m): thông số tính toán, người dùng chọn.
 * Khoảng điển hình theo TCVN 7888:2014 Bảng 1 (ghi chú: chiều dài tối đa
 * phụ thuộc thiết kế/thiết bị, có thể lớn hơn bảng). */
export const LENGTH_RANGE_M = {
  300: [6, 13], 350: [6, 15], 400: [6, 16], 450: [6, 16], 500: [6, 20],
  600: [6, 17], 700: [6, 30], 800: [6, 30], 900: [6, 30], 1000: [6, 30],
};
export function lengthRange(pile) {
  return LENGTH_RANGE_M[pile.Do_mm] || [6, 30];
}

/** Trạng thái dữ liệu cho một mã cọc: cái gì có trên bản vẽ, cái gì thiếu. */
export function dataStatus(pile) {
  return {
    code: pile.code,
    co_tren_ban_ve: ['Do,Dp,Di,Dei,t', 'PC bar d,N1,fpu,fpy', 'Mcr,Mu', 'spiral d,pitch,L_end', 'GC (neu Do>=600)', 'flange/collar', 'install_load_T', 'concrete 80MPa, specimen D150xH300'],
    thieu: [
      { field: 'GC bar grade', reason: 'ban ve chi ghi duong kinh/so luong GC, khong ghi mac thep' },
      { field: 'spiral steel grade', reason: 'chi ghi SWM-C (JIS G 3532), khong ghi cuong do' },
      { field: 'L', reason: 'chieu dai doan coc la thong so tinh toan, nguoi dung chon trong khoang TCVN 7888 Bang 1 (xem lengthRange)' },
    ],
    // Mcr/Mu co san de doi chieu nguoc sigma_pc o BT03 (theo Plan 6.1).
    back_check_available: pile.Mcr_kNm != null && pile.Mu_kNm != null,
  };
}

/** Kiểm tra nội bộ một bản ghi: t, Dei, Mcr<Mu, tỉ số Mu/Mcr. */
export function validatePile(pile) {
  const errors = [];
  if (Math.abs(pile.t_mm - (pile.Do_mm - pile.Di_mm) / 2) > 1e-9) errors.push('t != (Do-Di)/2');
  if (pile.Dei_mm !== pile.Di_mm) errors.push('Dei != Di');
  if (!(pile.Mcr_kNm > 0 && pile.Mu_kNm > pile.Mcr_kNm)) errors.push('Mcr/Mu khong hop le');
  if (!(pile.pc_bar.N1 > 0 && pile.pc_bar.d_mm > 0)) errors.push('PC bar khong hop le');
  if (pile.Do_mm >= 600 && !pile.gc_bar) errors.push('Do>=600 nhung thieu GC');
  if (pile.Do_mm < 600 && pile.gc_bar) errors.push('Do<600 nhung co GC');
  return { code: pile.code, ok: errors.length === 0, errors, Mu_over_Mcr: pile.Mu_kNm / pile.Mcr_kNm };
}

export function findPile(specs, code) {
  const p = specs.piles.find((x) => x.code === code);
  if (!p) throw new Error(`Khong tim thay ma coc ${code}`);
  return p;
}
