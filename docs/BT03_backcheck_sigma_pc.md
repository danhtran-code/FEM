# BT03 (phần 1) — Tính ngược ứng suất hữu hiệu σ_pc từ bản vẽ, theo tiêu chuẩn

**Phiên bản:** BT00-2 — 16/11/2026
**Trạng thái:** Đã kiểm chứng bằng test hồi quy (5 test BT03 + 7 test BT00 = 12/12 pass).

> ⚠️ **Đổi trạng thái theo Plan v0.5.0 (16/11/2026): chỉ còn là ĐỐI CHIẾU CHẨN ĐOÁN.**
> Không dùng σ_pc/σ_pe suy từ `M_cr/M_u` hay cấp tải A/AB/B/C làm đầu vào hay ngưỡng
> tính. BT03 đầy đủ phải tự tính từng khoản tổn hao và dự ứng lực hữu hiệu theo
> TCVN 5574:2018 §9.1 (căng trước cơ khí, hầm sấy vài giờ → tháo khuôn → dưỡng hộ
> tự nhiên). Các con số dưới đây và test hồi quy được giữ nguyên vì phép tính số học
> vẫn đúng với vai trò đối chiếu; chỉ đổi trạng thái sử dụng.
**Kết quả chính:** σ_pc (σ_ce) theo cấp tải — A 4 MPa, AB 6 MPa, B 8 MPa, C 10 MPa.

## 1. Tên bài và mục tiêu

Xác định ứng suất hữu hiệu trong bê tông σ_pc (ký hiệu trong TCVN 7888 là
σ_ce), ứng suất hữu hiệu trong thép σ_pe, và các thông số vật liệu
(E_b, E_p, γ_c, f_ct) từ các thông số có trên bản vẽ, theo tiêu chuẩn —
không tự điền giá trị lạc quan, không trộn hệ số giữa các hệ tiêu chuẩn.
Chiều dài L là thông số tính toán, người dùng chọn, không cố định.

## 2. Sơ đồ / dữ liệu gốc

- Bản vẽ Phan Vũ v1.2 (33 mã, TCVN 7888) — chỉ có Do/Dp/Di/t, thép DƯL,
  Mcr/Mu, đai, GC, mặt bích, tải thi công. Không có σ_pc, E_b, E_p, γ_c, L.
- TCVN 7888:2014, Bảng 1 + §6.5 + §6.6 + Phụ lục A (đã đọc toàn văn bản
  tiêu chuẩn để đối chiếu, không chỉ dựa vào bản vẽ).
- Phương pháp thuận JIS A 5337 (bản tính PHC theo TCVN 7888, công trình
  Saigon Premier Container Terminal): σ_pi → σ_pt → tổn hao → σ_pe → σ_ce.

## 3. Đầu vào

| Thông số | Nguồn | Giá trị |
|---|---|---|
| σ_ce danh nghĩa | TCVN 7888:2014 §6.5 | A 4, AB 6, B 8, C 10 MPa (±5%) |
| Mcr, Mu công bố | Bản vẽ = TCVN 7888 Bảng 1 | 33/33 mã khớp Bảng 1 |
| f_pu, f_py | Bản vẽ (TCVN 6284-3) | 1420 / 1275 MPa |
| E_b | TCVN 5574:2018 B80, Bảng 10 | 42.000 MPa (EC2 C80/95 Ecm 42.200; AASHTO 42.933 — khớp ~2%) |
| E_p | JIS G3137 / AASHTO | 200.000 MPa (bản tính JIS dùng 196.133 MPa) |
| γ_c | TCVN 5574 / Eurocode 2 | 25 kN/m³ (bê tông ly tâm có thể 25–26, cần cân xác nhận) |
| f_c | Bản vẽ | 80 MPa, mẫu trụ D150×H300 |
| L | Thông số tính toán | Khoảng điển hình TCVN 7888 Bảng 1: D300 6–13 m, D350 6–15 m, D400/D450 6–16 m, D500 6–20 m, D600 6–17 m, D700–D1000 6–30 m. Ghi chú Bảng 1: chiều dài tối đa có thể lớn hơn bảng, tùy thiết kế/thiết bị. |

Cường độ theo từng hệ, giữ riêng, không trộn:
- TCVN 5574 B80: R_b = 41 MPa, R_bt = 2,1 MPa, R_b,ser = 57 MPa, R_bt,ser = 3,3 MPa.
- Eurocode 2 C80/95: f_ck = 80, f_cm = 88, f_ctm = 4,8, f_ctk,0,05 = 3,4 MPa, E_cm = 42.200 MPa.
- AASHTO: f_r = 0,63·√80 = 5,64 MPa, E_c = 42.933 MPa, E_ci = 37.181 MPa.

## 4. Cơ sở tính

**Giá trị thiết kế chính — σ_ce danh nghĩa (§6.5):**
σ_ce = 4 / 6 / 8 / 10 MPa theo cấp A / AB / B / C.
σ_pe suy ra: σ_pe = σ_ce · A0 / Ap, A0 = Ac − Ap.
Kết quả: σ_pe = 678–878 MPa (trung bình ~780 MPa), nằm trong khoảng
σ_pe của phương pháp thuận JIS (750–870 MPa).

**Đối chiếu Mcr:** Mcr = W · (f_r + σ_ce), W là môđun kháng uốn tiết diện vành khăn.
Với σ_ce danh nghĩa, f_r suy ra từ Mcr công bố là 5,65–7,11 MPa,
trung bình ~6,3 MPa — khớp f_r AASHTO 5,64 MPa.
Dùng f_r = 6,3 MPa để đối chiếu: Mcr dự báo khớp Mcr công bố với
sai số trung bình +0,1%, |sai số| trung bình 2,2%, tối đa 6,7%.
f_r = 6,3 MPa CHỈ dùng để đối chiếu, không dùng làm cường độ chịu kéo thiết kế.

**Đối chiếu Mu:** Mu = k_r · Mcr, k_r = 1,50 / 1,65 / 1,80 / 2,00 (§6.6).
Khớp Mu công bố trong 0,3% cho 33/33 mã. Mu KHÔNG phải kết quả phân tích
cực hạn độc lập — không được dùng Mu để suy ngược lại σ_pc một cách độc lập.

**Phương pháp thuận JIS (Phụ lục A) — chỉ để đối chiếu:**
σ_pi = min(0,8·f_py, 0,7·f_pu) = 994 MPa;
σ_pt = σ_pi·(1−k/2) / (1 + n'·Ap/A0), n' = E_p/E_cp = 6,10;
tổn hao từ biến + co ngót Δσ_pψ và chùng Δσ_r = ½·k·σ_pt (k = 0,025,
ε_s = 1,5·10⁻⁴, ψ = 2,0); σ_pe = σ_pt − Δσ_pψ − Δσ_r;
σ_ce = σ_pe·Ap/A0. Kết quả σ_ce thuận = 3,98–10,74 MPa, cùng bậc độ
với σ_ce danh nghĩa.

**Cảnh báo đã kiểm chứng — không dùng σ_bt = 80 kgf/cm² = 7,85 MPa
để tính ngược σ_ce từ Mcr công bố:** với σ_bt đó, Mcr dự báo cao hơn
Mcr công bố 12–27% cho cả 33 mã. Mcr công bố là giá trị tối thiểu của
TCVN Bảng 1, không phải Mcr' tính thuận của JIS.

**Lưu ý về chiều dày:** t trên bản vẽ Phan Vũ dày hơn t tối thiểu trong
TCVN Bảng 1 (vd D350: 65 so với 60 mm, D500: 90 so với 80 mm), nhưng
Mcr/Mu công bố vẫn bằng đúng giá trị Bảng 1. Vì vậy Mcr công bố là
giá trị tối thiểu của tiêu chuẩn, không phải Mcr tính lại cho tiết diện
thực tế dày hơn — dùng Mcr công bố làm giới hạn nứt là thiên về an toàn.

## 5. Trình tự tính

1. Lấy σ_ce danh nghĩa theo cấp tải (§6.5).
2. Tính σ_pe = σ_ce·A0/Ap cho từng mã.
3. Đối chiếu Mcr bằng W·(f_r + σ_ce) với f_r = 6,3 MPa; ghi sai số từng mã.
4. Đối chiếu Mu bằng k_r·Mcr (§6.6).
5. Chạy phương pháp thuận JIS để kiểm tra bậc độ σ_pe/σ_ce.
6. Ghi tất cả vào `data_in/pile_specs.json` (schema BT00-2, trường `prestress`,
   `self_weight`, `length_range_m`, `shear_capacity_kN_TCVN7888`).

## 6. Kết quả

- σ_ce: A 4, AB 6, B 8, C 10 MPa (±5% theo §6.5).
- σ_pe: 678–878 MPa. Ví dụ: A300 758 MPa, B300 703 MPa, C300 701 MPa,
  A1000 845 MPa, B1000 757 MPa, C1000 755 MPa.
- Tự trọng (γ_c = 25 kN/m³, tiết diện vành khăn, chưa cộng riêng thép —
  thép < 2%): D300 1,131 kN/m (115,3 kg/m), D500 2,898 kN/m,
  D1000 9,456 kN/m (964,3 kg/m).
- Lực cắt cho phép V (TCVN Bảng 1, không có trên bản vẽ Phan Vũ):
  vd D300 A 99,1 / B 125,6 / C 136,4 kN; D1000 A 762,2 / B 961,4 / C 1047,0 kN.
  Ngoại lệ: AB600 không có V trong Bảng 1 — để null, không tự nội suy.
- Mcr đối chiếu: sai số trung bình +0,1%, |sai số| TB 2,2%, max 6,7% (A350).
- Mu đối chiếu: khớp trong 0,3% cho 33/33 mã.

## 7. Đối chứng

- Test `tests/bt03_backcheck.test.mjs`: 5/5 pass (cùng 7 test BT00 = 12/12).
- Ngưỡng đặt trước: Mcr |sai số| TB < 3%, max < 10%; Mu < 0,5%; σ_pe 600–950 MPa.
- Hai phương pháp độc lập (σ_ce danh nghĩa §6.5 và phương pháp thuận JIS)
  cho σ_pe/σ_ce cùng bậc độ, chênh nhau trong ~15% — đây là đối chứng chéo,
  không phải hai lần tính cùng một công thức.

## 8. Kết luận

- **Đã có cơ sở dùng cho BT01–BT03:** σ_ce danh nghĩa theo cấp tải,
  σ_pe suy ra, E_b = 42.000 MPa, E_p = 200.000 MPa, γ_c = 25 kN/m³,
  L là thông số tính toán trong khoảng TCVN Bảng 1.
- **Chưa đủ cơ sở kết luận chịu lực:** BT03 đầy đủ (kiểm tra tiết diện
  chịu uốn/cắt/nứt theo TCVN 5574 hoặc Eurocode 2) vẫn chưa làm; phần này
  chỉ xác định ứng suất hữu hiệu và đối chiếu Mcr/Mu công bố.
- **Còn thiếu:** mác thép GC và thép đai (bản vẽ chỉ ghi loại/đường kính),
  khối lượng dài thực tế của nhà sản xuất (để xác nhận γ_c = 25),
  V cắt cho AB600. Ba mục này vẫn ở trạng thái thiếu, ghi trong
  `pile_specs.json > common.missing_from_drawings`.
- Bài tiếp theo nhận kết quả này: BT01 (một cọc, hai gối, tự trọng —
  dùng w(kN/m) và L ở trên), BT03 (kiểm tra tiết diện — dùng σ_ce, σ_pe,
  E_b, E_p, Mcr/Mu/V ở trên).
