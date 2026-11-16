// BT03 (đầy đủ) — Tổn hao dự ứng lực và ứng suất hữu hiệu theo TCVN 5574:2018 §9.1.
// Căng trước cơ khí trên bệ; hầm sấy vài giờ → tháo khuôn → dưỡng hộ tự nhiên.
// Công thức đã đối chiếu trực tiếp với toàn văn TCVN 5574:2018
// (https://qlcl.gxd.vn/tieu-chuan/tcvn-5574-2018, 16/11/2026).
//
// Phân loại tổn hao (§9.1.2, căng trên bệ):
//   - Thứ nhất: Δσsp1 chùng (207) + Δσsp2 chênh nhiệt (211) + Δσsp3 biến dạng
//     khuôn/bệ (212) + Δσsp4 biến dạng neo (213).
//   - Thứ hai: Δσsp5 co ngót (215) + Δσsp6 từ biến (216).
//   - Ma sát Δσsp7 (214) KHÔNG áp dụng (chỉ căng trên bê tông).
//   - Co ngắn đàn hồi lúc truyền lực: bước tương thích (không phải một khoản
//     Δσsp đánh số trong §9.1.2) — xem ghi chú trong hàm.
//
// Đơn vị SI: m, N, Pa. Mọi giá trị mặc định theo tiêu chuẩn đều được ghi vào
// `assumptions` của kết quả; không có giá trị nào được "lấy bằng 0" ngầm:
// ΔT = 0 chỉ khi người dùng khai báo tường minh.

import { TCVN5574, pcSteelDesign } from './tcvn5574.js';
import { sectionGeometry, pcSteelArea } from './pile_specs.js';

/** Mặc định quy trình (mỗi mục đều có nguồn trong `assumptions`). */
export const DEFAULT_PROCESS = {
  // σsp mặc định: min(0,8·fpy, 0,7·fpu) = 994 MPa (đã dùng ở BT03 phần 1).
  sigma_sp_Pa: null,
  // 9.1.4: Δt mặc định 65 °C khi không có số liệu chính xác.
  delta_t_C: 65,
  // 9.1.5: Δσsp3 mặc định 30 MPa khi không có số liệu khuôn/bệ.
  delta_sigma_sp3_Pa: 30e6,
  // 9.1.6: ΔL neo mặc định 2 mm khi không có số liệu.
  delta_L_anchor_m: 0.002,
  // Chiều dài căng làm việc L_cang: mặc định = L (GIẢ THIẾT công nghệ chờ
  // xác lập — Plan §6.3.1 cấm tự lấy khi chưa có quan hệ công nghệ; ghi rõ).
  L_cang_m: null,
  // 6.1.3.4 Bảng 11: độ ẩm 40–75% ⇒ φb,cr = 1,4 (B60–B100).
  humidity: '40-75',
  // 6.1.1.6: Rbp ≥ 40 MPa với B80.
  Rbp_Pa: 40e6,
  // Dưỡng hộ nhiệt (hầm sấy) ⇒ hệ số 0,85 cho Δσsp5, Δσsp6 (9.1.8, 9.1.9).
  heat_cured: true,
  // Vật liệu (mặc định theo TCVN 5574 B80 / thép PC).
  Eb_Pa: 42e9,
  Es_Pa: 200e9,
};

/**
 * Tiết diện quy đổi (§9.1.9, (162)–(163)): Ared = Ac + α·Ap, Ired = I + α·Ip.
 * Thép phân bố đều trên vòng tròn đường kính Dp: Ip = Ap·rs²/2 (rs = Dp/2).
 * Thép GC KHÔNG đưa vào (Plan v0.5.0: bỏ thép dọc gia cường khỏi mô hình).
 */
export function transformedSection(pile, { Eb_Pa, Es_Pa }) {
  const { A_m2, I_m4 } = sectionGeometry(pile);
  const Ap_m2 = pcSteelArea(pile) * 1e-6;
  const alpha = Es_Pa / Eb_Pa;
  const rs_m = (pile.Dp_mm / 1000) / 2;
  const Ip_m4 = (Ap_m2 * rs_m * rs_m) / 2;
  const Ared_m2 = A_m2 + alpha * Ap_m2;
  const Ired_m4 = I_m4 + alpha * Ip_m4;
  return {
    Ac_m2: A_m2, Ap_m2, A0_m2: A_m2 - Ap_m2, alpha,
    Ared_m2, Ired_m4, Ip_m4, rs_m,
    Wred_m3: Ired_m4 / (pile.Do_mm / 2000),
    r_m: (Ired_m4 / (pile.Do_mm / 2000)) / Ared_m2, // (244): r = Wred/Ared
  };
}

/**
 * Tính tổn hao và ứng suất hữu hiệu cho một mã cọc.
 * @param {object} pile — bản ghi BT00 (Do/Di/Dp, pc_bar, class).
 * @param {object} process — quy trình (hợp nhất với DEFAULT_PROCESS).
 * @param {number} L_m — chiều dài đoạn cọc (m), do người dùng nhập.
 * @returns bảng tổn hao, σpe, P_eff, σ_pc, Lp, σ_pc(x), kiểm tra 9.1.10/9.1.11.
 */
export function prestressLosses(pile, process = {}, L_m) {
  if (!(L_m > 0)) throw new Error('L_m phai > 0');
  const p = { ...DEFAULT_PROCESS, ...process };
  const steel = pcSteelDesign(pile);
  const Es = p.Es_Pa ?? steel.Es_Pa;
  const Eb = p.Eb_Pa;
  const sigma_sp = p.sigma_sp_Pa ?? steel.sigma_sp_cap_Pa;
  if (sigma_sp > steel.sigma_sp_cap_Pa + 1) {
    throw new Error(`sigma_sp ${(sigma_sp / 1e6).toFixed(0)} MPa vuot gioi han cang ${steel.sigma_sp_cap_Pa / 1e6} MPa`);
  }
  const L_cang = p.L_cang_m ?? L_m;
  const ts = transformedSection(pile, { Eb_Pa: Eb, Es_Pa: Es });
  const assumptions = [
    'Thep PC TCVN 6284-3 khong co trong TCVN 5574: dung (207) nhu thep thanh 6284-5 cho chung; Rs,n = f_py; Es = 200.000 MPa; eta1 = 2,5 cho Rbond; acrc,u theo nhom thep thanh cuong do cao.',
    `Delta_t = ${p.delta_t_C} °C (mac dinh 9.1.4 khi khong co so lieu thuc te cua nha may).`,
    `Delta_sigma_sp3 = ${(p.delta_sigma_sp3_Pa / 1e6).toFixed(0)} MPa (mac dinh 9.1.5 khi khong co so lieu khuon/be).`,
    `Delta_L neo = ${(p.delta_L_anchor_m * 1000).toFixed(0)} mm (mac dinh 9.1.6).`,
    p.L_cang_m == null
      ? `L_cang = L = ${L_m} m (GIA THIET cong nghe cho xac lap — Plan 6.3.1).`
      : `L_cang = ${L_cang} m (nguoi dung khai bao).`,
    `Do am ${p.humidity} => phi_b,cr = ${TCVN5574.creepPhi[p.humidity]} (Bang 11, B60-B100).`,
    `Rbp = ${(p.Rbp_Pa / 1e6).toFixed(0)} MPa (toi thieu 6.1.1.6 cho B80).`,
    p.heat_cured ? 'Duong ho nhiet => he so 0,85 cho co ngot/tu bien (9.1.8, 9.1.9).' : 'Khong duong ho nhiet => khong nhan 0,85.',
  ];

  // --- Tổn hao thứ nhất (217) ---
  // (207) chùng ứng suất, căng cơ khí, thép thanh: max(0, 0,1·σsp − 20 MPa).
  const d_sp1 = Math.max(0, 0.1 * sigma_sp - 20e6);
  // (211) chênh nhiệt: 1,25·Δt.
  const d_sp2 = 1.25 * p.delta_t_C * 1e6;
  // (212) biến dạng khuôn/bệ (mặc định 30 MPa).
  const d_sp3 = p.delta_sigma_sp3_Pa;
  // (213) biến dạng neo: (ΔL/L)·Es.
  const d_sp4 = (p.delta_L_anchor_m / L_cang) * Es;
  const loss1 = d_sp1 + d_sp2 + d_sp3 + d_sp4;
  const sigma_sp1 = sigma_sp - loss1;
  const P1_N = ts.Ap_m2 * sigma_sp1;

  // --- Co ngắn đàn hồi lúc truyền lực (bước tương thích) ---
  // Tại truyền lực, bê tông co ngắn σbp/Eb ⇒ thép mất α·σbp. Giải tương thích:
  // σsp,el = σsp(1)/(1 + α·Ap/Ared); Δσ_el = σsp(1) − σsp,el.
  const sigma_sp_el = sigma_sp1 / (1 + ts.alpha * ts.Ap_m2 / ts.Ared_m2);
  const d_el = sigma_sp1 - sigma_sp_el;
  const P_el_N = ts.Ap_m2 * sigma_sp_el;

  // --- Tổn hao thứ hai ---
  // σbpj: ứng suất nén trong bê tông tại trọng tâm nhóm thép (§9.1.9) — với
  // dự ứng lực đồng tâm, σbpj = P/Ared (mô men tự trọng triệt tiêu trung bình
  // trên vòng thép).
  const sigma_bpj = P_el_N / ts.Ared_m2;
  let d_sp5 = 0, d_sp6 = 0;
  if (sigma_bpj > 0) {
    // (215) co ngót: εb,sh·Es; B80 ≥ B45 ⇒ ε = 0,0003; ×0,85 nếu dưỡng hộ nhiệt.
    d_sp5 = TCVN5574.shrinkageStrain.geB45 * Es * (p.heat_cured ? 0.85 : 1);
    // (216) từ biến; ysj = 0 (đồng tâm) ⇒ (1 + ysj²·Ared/Ired) = 1.
    const phi = TCVN5574.creepPhi[p.humidity];
    const mu = ts.Ap_m2 / ts.Ared_m2;
    d_sp6 = (0.8 * ts.alpha * phi * sigma_bpj) /
      (1 + ts.alpha * mu * (1 + 0.8 * phi)) * (p.heat_cured ? 0.85 : 1);
  }
  const loss2 = d_sp5 + d_sp6;
  const loss_total_19 = loss1 + loss2; // Σ Δσsp1..6 (9.1.10 kiểm tra ≥ 100 MPa)
  const loss_total = loss_total_19 + d_el;
  const sigma_pe = sigma_sp - loss_total;
  const P_eff_N = ts.Ap_m2 * sigma_pe;
  const sigma_pc = P_eff_N / ts.A0_m2; // ứng suất nén hữu hiệu trong bê tông

  // --- Chiều dài truyền lực Lp (222) ---
  // Rbond = η1·η2·Rbt (10.3.5.4); us = tổng chu vi thép PC.
  const Rbond_Pa = 2.5 * 1.0 * TCVN5574.concrete_B80.Rbt_Pa;
  const us_m = pile.pc_bar.N1 * Math.PI * (pile.pc_bar.d_mm / 1000);
  const ds_m = pile.pc_bar.d_mm / 1000;
  const Lp_m = Math.max(
    (sigma_sp1 * ts.Ap_m2) / (Rbond_Pa * us_m),
    10 * ds_m, 0.2,
  );

  // --- σ_pc(x): tăng tuyến tính trong vùng truyền lực Lp từ hai đầu ---
  const sigmaPcAt = (x_m) => {
    if (x_m < 0 || x_m > L_m) throw new Error(`x=${x_m} nam ngoai [0, ${L_m}]`);
    const ramp = Math.min(1, x_m / Lp_m, (L_m - x_m) / Lp_m);
    return sigma_pc * ramp;
  };

  return {
    pile_code: pile.code, L_m, L_cang_m: L_cang,
    sigma_sp_Pa: sigma_sp, sigma_sp_cap_Pa: steel.sigma_sp_cap_Pa,
    losses: {
      d_sp1_Pa: d_sp1, d_sp2_Pa: d_sp2, d_sp3_Pa: d_sp3, d_sp4_Pa: d_sp4,
      first_Pa: loss1, sigma_sp1_Pa: sigma_sp1, P1_N,
      d_elastic_Pa: d_el, sigma_sp_after_elastic_Pa: sigma_sp_el, P_after_elastic_N: P_el_N,
      sigma_bpj_Pa: sigma_bpj,
      d_sp5_Pa: d_sp5, d_sp6_Pa: d_sp6, second_Pa: loss2,
      total_19_Pa: loss_total_19, total_Pa: loss_total,
      total_ok_100MPa: loss_total_19 >= TCVN5574.minTotalLoss_Pa,
    },
    sigma_pe_Pa: sigma_pe, P_eff_N, sigma_pc_Pa: sigma_pc,
    transfer_length_Lp_m: Lp_m, Rbond_Pa,
    sigmaPcAt,
    section: ts,
    assumptions,
  };
}

/**
 * Kiểm tra ứng suất bê tông khi truyền lực (221): σbp = P(1)/Ared ± M·y/Ired.
 * @param {object} lossResult — kết quả prestressLosses().
 * @param {number} M_transfer_Nm — mô men do tự trọng ở giai đoạn truyền lực
 *   (lấy từ BT01 với cùng sơ đồ gối; bắt buộc — không mặc định bằng 0 vì
 *   M = 0 sẽ không thiên về an toàn cho cả hai thớ).
 * @param {number} Rbp_Pa — cường độ lúc truyền lực (mặc định 40 MPa).
 * @returns σbp thớ nén lớn nhất (đỉnh, giữa nhịp) và thớ kéo (đáy), giới hạn.
 */
export function transferCheck(lossResult, M_transfer_Nm, Rbp_Pa = TCVN5574.Rbp_min_Pa) {
  if (!(M_transfer_Nm >= 0)) throw new Error('M_transfer_Nm la bat buoc (lay tu BT01); khong mac dinh 0');
  const { section: ts, losses: { P1_N } } = lossResult;
  const y_m = lossResult.section.Ired_m4 / lossResult.section.Wred_m3; // = Do/2
  const sigma_axial = P1_N / ts.Ared_m2;
  const sigma_bend = (M_transfer_Nm * y_m) / ts.Ired_m4;
  // Đỉnh giữa nhịp: nén P/A + nén do võng (M gây nén thớ trên) — kiểm tra 0,9·Rbp.
  const sigma_top_Pa = sigma_axial + sigma_bend;
  // Đáy giữa nhịp: nén P/A − kéo do võng — ghi nhận (không có giới hạn kéo
  // riêng trong 9.1.11; đối chiếu Rbt,ser khi cần).
  const sigma_bot_Pa = sigma_axial - sigma_bend;
  const limit_Pa = 0.9 * Rbp_Pa; // ứng suất giảm/không đổi khi có ngoại lực
  return {
    sigma_top_Pa, sigma_bot_Pa, limit_Pa, Rbp_Pa,
    utilization_top: sigma_top_Pa / limit_Pa,
    ok_top: sigma_top_Pa <= limit_Pa,
    note: 'Gioi han 0,9·Rbp (9.1.11) khi ung suat giam/khong doi; 0,7·Rbp khi ung suat tang.',
  };
}
