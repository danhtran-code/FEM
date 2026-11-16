# Xếp cọc — Web App Tính toán & Đánh giá Xếp cọc Bê tông Ly tâm trong Kho

Ứng dụng web tĩnh (client-side) kiểm tra, so sánh và tìm phương án xếp cọc PHC
theo ba sơ đồ S1/S2/S3. Xem kế hoạch đầy đủ trong `Plan_XepCoc.md` (bản gốc của
Danh) và thuyết minh từng bài trong `docs/`.

## Trạng thái

- **BT00 — xong, đã kiểm chứng:** thư viện 33 mã cọc PHC Phan Vũ (D300–D1000,
  cấp A/AB/B/C, TCVN 7888, v1.2) trong `data_in/pile_specs.json`, hàm
  `section(x)` trong `src/modules/xep-coc/pile_specs.js`, test
  `node --test tests/bt00.test.mjs` — 7/7 pass.
- **BT03 (phần 1) — xong, đã kiểm chứng:** σ_pc tính ngược theo TCVN 7888 §6.5/§6.6
  (A 4, AB 6, B 8, C 10 MPa), σ_pe 678–878 MPa, E_b 42.000 MPa, E_p 200.000 MPa,
  γ_c 25 kN/m³, L là thông số tính toán. Xem `docs/BT03_backcheck_sigma_pc.md`,
  `src/modules/xep-coc/prestress.js`, test `tests/bt03_backcheck.test.mjs` — 5/5 pass.
  Tổng 12/12 test pass.
- BT01–BT14: chưa làm. Thứ tự theo Plan: BT01–BT02 → BT03–BT08 → S2 → S1/S3 →
  BT13–BT14.

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

mm, N, MPa (= N/mm²); mômen công bố trên bản vẽ giữ kN·m.
Tự trọng cần `gamma_c` có nguồn — BT00 không tự điền.

## Ghi chú quan trọng (BT00)

- `sigma_pc`, `E_b`, `E_p`, `gamma_c`, `L` không có trên bản vẽ → đã xác định
  theo tiêu chuẩn trong BT00-2 (xem `docs/BT03_backcheck_sigma_pc.md`):
  σ_ce A 4 / AB 6 / B 8 / C 10 MPa, E_b 42.000 MPa, E_p 200.000 MPa,
  γ_c 25 kN/m³, L là thông số tính toán.
- GC (Do ≥ 600) được giả thiết ở cả hai đầu, mỗi đầu dài L2 = 1000 mm —
  cần Danh xác nhận.
- File `00. COC DONG_PHC_ALL.pdf` là bản tổng hợp, không phải mã cọc thứ 34.
