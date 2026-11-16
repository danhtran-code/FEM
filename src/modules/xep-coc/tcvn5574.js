// TCVN 5574:2018 — hằng số vật liệu và công thức đã đối chiếu với toàn văn
// (https://qlcl.gxd.vn/tieu-chuan/tcvn-5574-2018, đọc ngày 16/11/2026).
// Mọi giá trị dưới đây đều có số bảng/mục kèm theo; chỗ nào tiêu chuẩn KHÔNG
// bao hàm thép PC TCVN 6284-3 (JIS G3137) thì ghi rõ là GIẢ THIẾT tương tự.
// Đơn vị SI: m, N, Pa. Riêng các hằng số tra bảng giữ MPa trong chú thích.
//
// HIỆU CHÍNH 16/11/2026: Rbt,ser(B80) = 3,30 MPa và Rbt(B80) = 2,10 MPa
// (Bảng 6/7, cột B80) — bản trích xuất tự động trước đó ghi nhầm 3,00/1,90
// do lệch một cột (3,00/1,90 là giá trị của B70). Đã đối chiếu trực tiếp
// từng cột của Bảng 6/7 và kiểm tra nhất quán: Rb = 57/1,3×0,9333 ≈ 41,0.

export const TCVN5574 = {
  standard: 'TCVN 5574:2018',
  concrete_B80: {
    grade: 'B80',
    Rb_ser_Pa: 57.0e6, // Bảng 6: Rb,n = Rb,ser
    Rbt_ser_Pa: 3.30e6, // Bảng 6: Rbt,n = Rbt,ser (B80)
    Rb_Pa: 41.0e6, // Bảng 7 (đã gồm γb,br = (360−80)/300 = 0,9333)
    Rbt_Pa: 2.10e6, // Bảng 7 (B80)
    Eb_Pa: 42.0e9, // Bảng 10
    nu: 0.2, // 6.1.3.5
    eps_b2: 0.0033 - (80 - 70) / 30 * (0.0033 - 0.0028), // 6.1.4.2: nội suy B70→B100: 0,0033→0,0028 ⇒ B80 = 0,003133
    eps_b1_red: 0.0015, // 6.1.4.3: bê tông nặng, ngắn hạn
    eps_bt2: 0.00015, // 6.1.4.4: kéo, ngắn hạn
    eps_b0: 0.002, // 6.1.3.2: nén, ngắn hạn
    gamma_b: 1.3, // 6.1.2.2: TTGH1
    gamma_bt: 1.5, // 6.1.2.2: TTGH1
  },
  // 9.1.8: εb,sh theo cấp bền (B45 trở lên: 0,0003).
  shrinkageStrain: { leB35: 0.0002, B40: 0.00025, geB45: 0.0003 },
  // 6.1.3.4 Bảng 11: φb,cr cho B60–B100 theo độ ẩm tương đối.
  creepPhi: { gt75: 1.0, '40-75': 1.4, lt40: 2.0 },
  // 6.1.1.6: Rbp ≥ 15 MPa và ≥ 50% cấp bền ⇒ B80: Rbp ≥ 40 MPa.
  Rbp_min_Pa: 40e6,
  // 9.1.10: tổng tổn hao thép chính giai đoạn sử dụng ≥ 100 MPa.
  minTotalLoss_Pa: 100e6,
  // 9.1.11: giới hạn ứng suất bê tông khi truyền lực.
  transferLimit: { decreasing: 0.9, increasing: 0.7 }, // × Rbp
};

/**
 * Thép PC TCVN 6284-3 (JIS G3137) — GIẢ THIẾT (tiêu chuẩn TCVN 5574 không
 * liệt kê loại thép này trong Bảng 12/13, 9.1.3, Bảng 17, 10.3.5.4):
 * - Rs,n lấy bằng f_py của tiêu chuẩn sản phẩm (1275 MPa); Rs = Rs,n/1,15.
 * - Es = 200.000 MPa (trùng thép thanh 6.2.3.3).
 * - Chùng ứng suất: xử lý như thép thanh 6284-5, công thức (207).
 * - Rbond: η1 = 2,5 (thép cán nóng/gia công nhiệt — gần nhất), η2 = 1,0.
 * - acrc,u: nhóm thép thanh cường độ cao (Bảng 17): 0,3 mm dài hạn / 0,4 mm ngắn hạn.
 * Mọi giả thiết này được liệt kê trong kết quả (assumptions) của BT03.
 */
export const PC_STEEL_ASSUMPTIONS = {
  standard: 'TCVN 6284-3 (JIS G3137) — KHONG co trong TCVN 5574',
  Rs_n_source: 'f_py theo tieu chuan san pham (1275 MPa)',
  Es_source: '200000 MPa (trung thep thanh 6.2.3.3)',
  relaxation_formula: 'TCVN 5574 (207) — nhu thep thanh 6284-5',
  bond_eta1: 2.5,
  bond_eta1_source: '10.3.5.4 — gan nhat: thep can nong/gia cong nhiet',
  acrc_u_source: 'Bang 17 — nhom thep thanh cuong do cao',
};

export function pcSteelDesign(pile) {
  const { f_pu_MPa, f_py_MPa } = pile.pc_bar;
  const Rs_n_Pa = f_py_MPa * 1e6;
  const Rs_Pa = Rs_n_Pa / 1.15; // 6.2.2.2, γs = 1,15 (TTGH1)
  const Rsc_Pa = Math.min(Rs_Pa, 400e6); // 6.2.2.2: Rsc ≤ 400 MPa (ngắn hạn)
  const Es_Pa = 200e9; // 6.2.3.3 (thép thanh)
  // Giới hạn căng ban đầu (JIS/phương pháp thuận đã dùng ở BT03 phần 1):
  const sigma_sp_cap_Pa = Math.min(0.8 * f_py_MPa, 0.7 * f_pu_MPa) * 1e6;
  return { Rs_n_Pa, Rs_Pa, Rsc_Pa, Es_Pa, sigma_sp_cap_Pa, f_pu_Pa: f_pu_MPa * 1e6, f_py_Pa: f_py_MPa * 1e6 };
}
