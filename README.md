# Xếp cọc — Web App Tính toán & Đánh giá Xếp cọc Bê tông Ly tâm trong Kho

Ứng dụng web tĩnh (client-side) kiểm tra, so sánh và tìm phương án xếp cọc PHC
theo ba sơ đồ S1/S2/S3. Kế hoạch hiện hành: `docs/Plan_XepCoc_v0.5.0.md`
(Skill: `docs/Skill_fem-web.md`); bản v0.3.1 giữ lại trong `docs/` để đối chiếu
lịch sử. Thuyết minh từng bài trong `docs/`.

## Trạng thái

- **BT00 — xong, đã kiểm chứng (schema BT00-3):** thư viện 33 mã cọc PHC Phan Vũ
  (D300–D1000, cấp A/AB/B/C, TCVN 7888; 24 bản vẽ v1.2 D300–D700 + 9 bản v2.2
  D800–D1000, trường `drawing_version` từng mã) trong `data_in/pile_specs.json`,
  hàm `section(x)` trong `src/modules/xep-coc/pile_specs.js`, test
  `node --test tests/bt00.test.mjs` — 8/8 pass.
- **BT01 — xong, đã kiểm chứng:** một cọc, hai gối, tự trọng. Lõi giải dầm
  Euler-Bernoulli chuẩn SI (`src/core/fem_solver.js`, `src/core/math_matrix.js`),
  module `src/modules/xep-coc/bt01.js`. Mốc PHC-B500 L = 12 m, gối cách đầu
  2,4 m: R = 17,389 kN, M gối −8,347 kN·m, M giữa nhịp 10,433 kN·m, võng giữa
  nhịp 0,441 mm — khớp giải tích và công ảo. Xem `docs/BT01_thuyet-minh.md`,
  test 7/7.
- **BT02 — xong, đã kiểm chứng:** thêm tải tập trung/vệt từ tầng trên
  (`src/modules/xep-coc/bt02.js`). Tải đúng gối chỉ tăng phản lực, M(x) không
  đổi; tải lệch khớp tĩnh học; chồng chất tuyến tính hai tuyến kê. Xem
  `docs/BT02_thuyet-minh.md`, test 6/6.
- Tổng test 39/39 pass (`node --test tests/*.test.mjs`). **Mốc M1 hoàn thành; giao diện BT01/BT02 đã có trên GitHub Pages.**
- **Giao diện web BT01/BT02 (v0.4.0, v0.4.1):** trang chủ của site
  (https://danhtran-code.github.io/FEM/) mở thẳng module `src/ui/xep-coc.html` —
  chọn 1 trong 33 mã cọc, nhập L, x1, x2, thêm tải điểm/vệt, xem sơ đồ dọc cọc,
  biểu đồ M(x)/Q(x)/chuyển vị (Plotly) và bảng trạm kiểm tra. Số liệu tham khảo
  và kết quả tự tính tách rõ trên giao diện.
- **BT03 (phần 1) — chỉ còn là đối chiếu chẩn đoán:** σ_pc tính ngược theo
  TCVN 7888 §6.5/§6.6 (A 4, AB 6, B 8, C 10 MPa), σ_pe 678–878 MPa. Xem
  `docs/BT03_backcheck_sigma_pc.md`, `src/modules/xep-coc/prestress.js`, test
  5/5 pass. Theo Plan v0.5.0, **không dùng** các giá trị suy từ `M_cr/M_u` hay
  cấp tải làm đầu vào/ngưỡng tính; BT03 đầy đủ phải tự tính tổn hao theo
  TCVN 5574:2018 §9.1.
- BT03–BT14: chưa làm (BT03 đầy đủ thuộc mốc M2). Thứ tự theo Plan §11.2:
  BT03–BT08 → S2 → S1/S3 → BT13–BT14.

## Cấu trúc

```text
src/
  ui/            # giao diện từng module (chua co, moc M6)
  core/
    fem_solver.js    # BT01/BT02: dam Euler-Bernoulli, don vi SI
    math_matrix.js   # giai he tuyen tinh (khu Gauss, chon tru chinh)
  modules/xep-coc/
    pile_specs.js   # BT00: du lieu coc, section(x)
    prestress.js    # BT03 phan 1: doi chieu chan doan sigma_pc
    bt01.js         # BT01: mot coc, hai goi, tu trong
    bt02.js         # BT02: them tai tap trung/vet tu tang tren
  workers/       # Web Worker (chua co)
data_in/         # pile_specs.json (BT00-3), support_ground_specs.json (chua co)
data_out/        # mau xuat bao cao
docs/            # BT00/BT01/BT02/BT03_thuyet-minh.md, Plan v0.5.0, Skill
tests/           # bt00, bt01, bt02, bt03_backcheck, math_matrix — 30 test
Ref/             # ban ve goc Phan Vu (PDF) + ban text trich xuat Ref/txt/
tools/           # extract_pile_specs.py — trich xuat PDF -> pile_specs.json
```

## Chạy test

```bash
node --test tests/*.test.mjs
```

## Chạy web (giao diện BT01/BT02)

Trang dùng ES Modules nên phải mở qua máy chủ HTTP, không mở trực tiếp bằng
file://. Từ thư mục gốc của repo:

```bash
python3 -m http.server 8000
```

Rồi mở http://localhost:8000/ (trang chủ chuyển thẳng tới giao diện module).
Trang đã chạy trên GitHub Pages: https://danhtran-code.github.io/FEM/.

## Đơn vị nội bộ

Lõi tính BT01/BT02 chuẩn SI: m, N, Pa, N·m; hiển thị đổi sang kN, kN·m, mm
tại biên. BT00 vẫn lưu mm/N/MPa trong `pile_specs.json` nhưng các hàm đã trả
kèm tương đương SI (A_m2, I_m4, W_m3) để BT01 dùng trực tiếp.
Tự trọng cần `gamma_c` có nguồn — BT00 không tự điền.

## Ghi chú quan trọng (BT00)

- `E_b`, `E_p`, `gamma_c`, `L` không có trên bản vẽ → đã xác định theo tiêu chuẩn
  trong BT00-2 (xem `docs/BT03_backcheck_sigma_pc.md`): E_b 42.000 MPa,
  E_p 200.000 MPa, γ_c 25 kN/m³, L là thông số tính toán. Riêng `sigma_pc` hữu
  hiệu sau tổn hao **chưa có** — BT03 phần 1 chỉ đối chiếu chẩn đoán từ cấp tải
  (σ_ce A 4 / AB 6 / B 8 / C 10 MPa), không dùng làm đầu vào (Plan v0.5.0).
- GC (Do ≥ 600) được giả thiết ở cả hai đầu, mỗi đầu dài L2 = 1000 mm —
  cần Danh xác nhận.
- File `00. COC DONG_PHC_ALL.pdf` là bản tổng hợp, không phải mã cọc thứ 34.
