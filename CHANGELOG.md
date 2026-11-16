# CHANGELOG

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
