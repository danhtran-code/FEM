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
- **BT03 (phần 1) — chỉ còn là đối chiếu chẩn đoán:** σ_pc tính ngược theo
  TCVN 7888 §6.5/§6.6 (A 4, AB 6, B 8, C 10 MPa), σ_pe 678–878 MPa, E_b 42.000 MPa,
  E_p 200.000 MPa, γ_c 25 kN/m³, L là thông số tính toán. Xem
  `docs/BT03_backcheck_sigma_pc.md`, `src/modules/xep-coc/prestress.js`, test
  `tests/bt03_backcheck.test.mjs` — 5/5 pass. Tổng 13/13 test pass.
  Theo Plan v0.5.0, **không dùng** các giá trị suy từ `M_cr/M_u` hay cấp tải làm
  đầu vào/ngưỡng tính; BT03 đầy đủ phải tự tính tổn hao theo TCVN 5574:2018 §9.1.
- BT01–BT14: chưa làm. Bước tiếp theo theo Plan §11.2: **BT01** (một cọc, hai gối,
  tự trọng). Thứ tự: BT01–BT02 → BT03–BT08 → S2 → S1/S3 → BT13–BT14.

## Cấu trúc

```text
src/
  ui/            # giao diện từng module
  core/          # fem_solver.js, math_matrix.js (chua co)
  modules/xep-coc/
    pile_specs.js   # BT00: du lieu coc, section(x)
  workers/       # Web Worker (chua co)
data_in/         # pile_specs.json, support_ground_specs.json (chua co)
data_out/        # mau xuat bao cao
docs/            # BT00_thuyet-minh.md, HDSD (chua co)
tests/           # bt00.test.mjs
Ref/             # ban ve goc Phan Vu (PDF) + ban text trich xuat Ref/txt/
tools/           # extract_pile_specs.py — trich xuat PDF -> pile_specs.json
```

## Chạy test

```bash
node --test tests/bt00.test.mjs
```

## Đơn vị nội bộ

BT00 dùng mm, N, MPa (= N/mm²); mômen công bố trên bản vẽ giữ kN·m; các hàm
đã trả kèm tương đương SI (m², m⁴, m³). Plan v0.5.0 §6.4 yêu cầu lõi tính chuẩn
SI m–N–Pa — việc chuyển lõi sang SI sẽ chốt ở bước BT01, không đổi ngầm ở đây.
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
