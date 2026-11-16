# CHANGELOG

## 0.5.0 — 16/11/2026 — Mốc M2: BT03 đầy đủ + BT04–BT08

- **BT03 đầy đủ** (`prestress_losses.js`, `section_checker.js`, `tcvn5574.js`,
  `docs/BT03_thuyet-minh.md`, 16 test mới): tổn hao tự tính theo TCVN 5574:2018
  §9.1 — chùng (207), chênh nhiệt (211, Δt mặc định 65 °C), khuôn/bệ (212),
  neo (213), co ngót (215), từ biến (216), co ngắn đàn hồi lúc truyền lực —
  σ_pe, P_eff, σ_pc(x), L_p (222), kiểm tra truyền lực (221); kiểm tra tiết
  diện: Mcr (243), Mu (mô hình nội lực giới hạn tự xây dựng trên vành khuyên),
  cắt (8.1.3, theo vùng đai), nứt (166)(245). B500: σ_pe ≈ 652 MPa,
  σ_pc ≈ 7,16 MPa, Mcr ≈ 117,8 / Mu ≈ 261,5 kN·m (công bố 147,2 / 265 —
  chênh do Mcr công bố là giá trị tối thiểu TCVN 7888, ghi rõ trong thuyết
  minh, không hiệu chỉnh). **Hiệu chính:** R_bt,ser(B80) = 3,30 MPa,
  R_bt(B80) = 2,10 MPa (Bảng 6/7 — bản trích xuất trước đó ghi nhầm 3,00/1,90
  của B70). Phát hiện: đai giữa thân B500 không đạt tối thiểu (96) ⇒ Q_b
  theo (97). Mọi công thức §9.1 đối chiếu trực tiếp với toàn văn TCVN 5574:2018.
- **BT04** (`contact.js`, 6 test): tiếp xúc Hertz cọc–kê/cọc–cọc + nén cục bộ
  §8.1.5 (116)–(118). B500 tại gối: a ≈ 1,13 mm, p0 ≈ 98 MPa, U ≈ 1,05 —
  vượt nhẹ giới hạn lý tưởng (mô hình cứng thiên về an toàn; kê rộng gấp đôi
  ⇒ U = 0,74). Cọc–cọc U ≈ 0,10.
- **BT05** (`ring.js`, 6 test): uốn vòng/nứt thành cọc, M(θ) = P·r_m·(1/π −
  sinθ/2) (kiểm chứng bằng Castigliano). B500 tại kê: σ thớ trong ≈ 8,40 MPa,
  U_nứt ≈ 2,55 — sàng lọc 2D thiên về an toàn (cần L_eff ≈ 0,255 m để không
  nứt; hiệu ứng vỏ 3D và đai sau nứt chưa kể).
- **BT06** (`rigid_bearer.js`, 6 test): kê gỗ 100×100 cứng — vật rắn 2 bậc tự
  do trên gối đàn hồi BT01; không chia đều mặc định; mất tiếp xúc, lật kê.
- **BT07** (`lateral_restraint.js`, 4 test): ràng buộc giữ ngang lý tưởng;
  S1 đối xứng ⇒ phản lực ngang = 0.
- **BT08** (`bottom_bearers.js`, 4 test): kê đáy trên nền cứng không lún;
  tổng phản lực = tổng tải; API không nhận thông số nền.
- `data_in/support_ground_specs.json`: cấu hình kê gỗ 100×100 cứng + biên lý
  tưởng cho BT06/BT08. Xem `docs/BT04-BT08_thuyet-minh.md`.
- Tổng test 81/81 pass (39 cũ + 42 mới). Mốc M2 hoàn thành; tiếp theo: M3
  (BT10–BT11, S2).

## 0.4.2 — 16/11/2026 — Đổi chiều biểu đồ mômen theo quy ước

- Biểu đồ M(x) đảo chiều trục y (Plotly `autorange: 'reversed'`): mômen dương
  (võng xuống) vẽ xuống dưới, mômen âm (vồng lên) vẽ lên trên. Giá trị M và
  hover giữ nguyên dấu; chỉ hướng vẽ đổi. Ghi rõ quy ước trên tiêu đề biểu đồ.
- Tổng test 39/39 pass.

## 0.4.1 — 16/11/2026 — Trang chủ mở thẳng giao diện + sửa lỗi hiển thị

- `index.html` (trang chủ GitHub Pages) chuyển thẳng tới giao diện module
  `src/ui/xep-coc.html` — mở https://danhtran-code.github.io/FEM/ là thấy ngay
  sơ đồ + biểu đồ, không còn trang dashboard chữ thuần.
- Sửa lỗi hiển thị f_pu = undefined: `app.js` đọc sai tên trường
  (`pc.fpu_MPa` thay vì `pc.f_pu_MPa` trong pile_specs.json); thêm test hồi quy
  `tests/ui_app_refs.test.mjs` khóa tên trường UI theo schema JSON.
- Sơ đồ SVG: đưa tiêu đề mã cọc lên trên để không chồng lên mũi tên tự trọng.
- Tổng test 38/38 pass.

## 0.4.0 — 16/11/2026 — Giao diện web BT01/BT02 (một phần M6)

- Trang module `src/ui/xep-coc.html` + `src/ui/app.js`: chọn 1 trong 33 mã cọc,
  nhập L/x1/x2/E_b/γ_c, thêm tải điểm/vệt (BT02); tính ngay trường hợp mốc
  PHC-B500 khi mở trang. Hiển thị: thẻ kết quả R/M/Q/võng, sơ đồ dọc cọc (SVG:
  cọc, gối, tải, phản lực, kích thước a1/nhịp/a2), biểu đồ M(x)/Q(x)/chuyển vị
  (Plotly.js), bảng trạm kiểm tra. Tách rõ tham khảo/đầu vào/kết quả tự tính.
- `src/ui/inputs.js` (đọc/kiểm tra nhập liệu, đổi sang SI) và `src/ui/diagrams.js`
  (chuỗi biểu đồ + SVG) viết dạng hàm thuần, có test node: 7 test UI mới,
  tổng 37/37 pass. Mở trang qua máy chủ tĩnh (xem README mục Chạy web).
- Dashboard `index.html` liên kết tới trang module.

## 0.3.0 — 16/11/2026 — Mốc M1: BT01 + BT02 (bài dầm cơ bản)

- Lõi tính chuẩn SI (m, N, Pa) chốt từ BT01: `src/core/fem_solver.js`
  (dầm Euler-Bernoulli 2 nút, M/Q bằng cân bằng đoạn trái, v(x) Hermite +
  số hạng tải đều) và `src/core/math_matrix.js` (khử Gauss, chọn trụ chính).
- BT01 (`src/modules/xep-coc/bt01.js`, `docs/BT01_thuyet-minh.md`): một cọc,
  hai gối, tự trọng; mốc PHC-B500 L = 12 m, gối cách đầu 2,4 m — R 17,389 kN,
  M gối −8,347 kN·m, M giữa nhịp 10,433 kN·m, võng giữa nhịp 0,441 mm, khớp
  giải tích và công ảo (7 test).
- **Hiệu chính mốc chuẩn cũ:** đầu hẫng võng LÊN 0,224 mm, không phải xuống
  0,45 mm như mốc chuẩn bị trước đây (đã kiểm chứng bằng FEM, công ảo và
  tính tay chồng chất; xem thuyết minh BT01 §6).
- BT02 (`src/modules/xep-coc/bt02.js`, `docs/BT02_thuyet-minh.md`): tải tập
  trung/vệt từ tầng trên; tải đúng gối chỉ tăng phản lực, M(x) không đổi;
  tải lệch khớp tĩnh học; chồng chất tuyến tính hai tuyến kê (6 test).
- Tổng test 30/30 pass. Mốc M1 hoàn thành; bước tiếp theo: BT03 đầy đủ (M2).

## 0.2.1 — 16/11/2026 — Đồng bộ Skill + Plan v0.5.0 (không tính toán mới)

- Lưu Skill fem-web mới vào `docs/Skill_fem-web.md` và Plan v0.5.0 vào
  `docs/Plan_XepCoc_v0.5.0.md` (giữ `Plan_XepCoc_v0.3.1.md` để đối chiếu).
  TCVN 5574:2018 là cơ sở chính; TCVN 7888 chỉ đối chiếu sản phẩm/lưu kho.
- BT00 schema BT00-2 → BT00-3: thêm `drawing_version` từng mã — 24 bản v1.2
  (D300–D700) + 9 bản v2.2 (D800–D1000), đối chiếu từng file `Ref/txt/`
  (trường PHIÊN BẢN); sửa ghi chú cũ "v1.2 cho cả 33 bản". Thêm test
  phiên bản bản vẽ; `tests/bt00.test.mjs` 7/7 → 8/8, tổng 13/13 pass.
- BT03 phần 1 đổi trạng thái thành **đối chiếu chẩn đoán**: không dùng σ_pc/σ_pe
  suy từ `M_cr/M_u` hay cấp tải làm đầu vào/ngưỡng tính (Plan v0.5.0 §6.3, §7.1);
  BT03 đầy đủ phải tự tính tổn hao theo TCVN 5574 §9.1. Code/test/số liệu giữ
  nguyên, chỉ đổi trạng thái; `dataStatus` nay ghi σ_pc hữu hiệu là thiếu.
- Ghi rõ tồn đọng: lõi BT00 vẫn dùng mm/N/MPa (đã trả kèm tương đương SI);
  việc chuyển lõi sang SI m–N–Pa theo Plan §6.4 sẽ chốt ở bước BT01.
- Bước tiếp theo: BT01 (một cọc, hai gối, tự trọng) — chờ Danh kiểm tra bước này.

## 0.2.0 — 16/11/2026 — BT00-2 / BT03 (phần 1: σ_pc tính ngược)

- σ_pc (σ_ce) xác định theo TCVN 7888:2014 §6.5: A 4, AB 6, B 8, C 10 MPa (±5%);
  σ_pe = σ_ce·A0/Ap = 678–878 MPa.
- Vật liệu xác định theo tiêu chuẩn: E_b 42.000 MPa (TCVN 5574 B80),
  E_p 200.000 MPa, γ_c 25 kN/m³; L là thông số tính toán, khoảng theo TCVN 7888 Bảng 1.
- Đối chiếu Mcr = W·(f_r + σ_ce), f_r = 6,3 MPa: sai số TB +0,1%, max 6,7%.
  Đối chiếu Mu = k_r·Mcr (§6.6): khớp trong 0,3% cho 33/33 mã.
- Bổ sung lực cắt V theo TCVN 7888 Bảng 1 (trừ AB600 không có trong bảng).
- `src/modules/xep-coc/prestress.js`, `tests/bt03_backcheck.test.mjs` (5/5 pass),
  `docs/BT03_backcheck_sigma_pc.md`. Tổng test 12/12 pass.
- Ghi rõ cảnh báo: không dùng σ_bt = 7,85 MPa để tính ngược σ_ce (dự báo Mcr cao hơn 12–27%);
  Mcr/Mu công bố là giá trị tối thiểu của tiêu chuẩn, t thực tế dày hơn t tối thiểu trong Bảng 1.

## 0.1.0 — 16/11/2026 — BT00

- Tạo workspace `xep-coc` theo cấu trúc Skill/Plan.
- Giải nén bộ 33 bản vẽ chuẩn Phan Vũ (TCVN 7888, v1.2) vào `Ref/`.
- BT00: trích xuất 33 mã cọc PHC D300–D1000 (A/AB/B/C) thành
  `data_in/pile_specs.json` (schema BT00-1), kèm nguồn, đơn vị, trạng thái thiếu dữ liệu.
- BT00: `src/modules/xep-coc/pile_specs.js` — A/I/W, Ap/Agc, `section(x)`,
  tự trọng (yêu cầu gamma_c), `validatePile`, `dataStatus`.
- BT00: `tests/bt00.test.mjs` — 7/7 pass (hình học khớp tính tay < 0,1%).
- BT00: `docs/BT00_thuyet-minh.md`.
- Ghi rõ dữ liệu thiếu trên bản vẽ: sigma_pc, E_b, E_p, gamma_c, L.
