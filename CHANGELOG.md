# CHANGELOG

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
