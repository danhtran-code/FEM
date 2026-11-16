# BT03 (đầy đủ) — Tổn hao dự ứng lực và kiểm tra tiết diện cọc PHC theo TCVN 5574:2018

**Phiên bản:** BT03-đầy đủ — 16/11/2026 (app v0.5.0, mốc M2)
**Trạng thái:** Đã kiểm chứng bằng test (16 test BT03 mới + 39 test cũ = 55/55 pass).
**Cơ sở chính:** TCVN 5574:2018 (đọc toàn văn, đối chiếu trực tiếp từng công
thức tại https://qlcl.gxd.vn/tieu-chuan/tcvn-5574-2018, 16/11/2026).
TCVN 7888 chỉ đối chiếu chẩn đoán; Mcr/Mu công bố trên bản vẽ là
**reference**, không phải đầu vào hay ngưỡng tính.

> **Kế thừa BT03 phần 1:** `docs/BT03_backcheck_sigma_pc.md` và
> `src/modules/xep-coc/prestress.js` giữ nguyên vai trò đối chiếu chẩn đoán
> (σ_ce danh nghĩa 4/6/8/10 MPa, σ_pe suy ra 678–878 MPa). BT03 đầy đủ
> **không dùng** các giá trị đó làm đầu vào — mọi thứ dưới đây tự tính từ
> σ_sp ban đầu, vật liệu và quy trình sản xuất.

## 1. Tên bài và mục tiêu

Tự tính từng khoản tổn hao dự ứng lực (căng trước cơ khí trên bệ; hầm sấy
vài giờ → tháo khuôn → dưỡng hộ tự nhiên), xác định σ_pe, P_eff, σ_pc,
chiều dài truyền lực Lp, rồi kiểm tra tiết diện vành khuyên: uốn (Mcr, Mu),
cắt (Qu theo vùng đai), ứng suất bê tông và độ mở vết nứt — ưu tiên
TCVN 5574:2018. Thép dọc gia cường (GC) không đưa vào mô hình.

## 2. Sơ đồ / dữ liệu gốc

- 33 mã cọc BT00 (`data_in/pile_specs.json`): Do/Di/Dp/t, thép PC
  (d, N1, f_pu = 1420, f_py = 1275 MPa), đai xoắn theo vùng, Mcr/Mu công bố.
- Quy trình sản xuất Phan Vũ (theo Plan §6.3.1): căng cơ khí trên bệ,
  dưỡng hộ hơi nước vài giờ, tháo khuôn, dưỡng hộ tự nhiên.
- TCVN 5574:2018 toàn văn (bản HTML qlcl.gxd.vn, 12.881 dòng).

## 3. Đầu vào

| Thông số | Loại | Nguồn / giá trị |
|---|---|---|
| Hình học, thép PC, đai | reference (BT00) | bản vẽ Phan Vũ |
| σ_sp ban đầu | input | mặc định min(0,8·f_py, 0,7·f_pu) = 994 MPa; người dùng ghi đè được, vượt giới hạn ⇒ lỗi |
| Δt chênh nhiệt | input | mặc định 65 °C (9.1.4, khi không có số liệu nhà máy); ΔT = 0 chỉ khi khai báo tường minh |
| Δσ_sp3 (khuôn/bệ) | input | mặc định 30 MPa (9.1.5) |
| ΔL neo | input | mặc định 2 mm (9.1.6) |
| L_cang | input | mặc định = L (**giả thiết công nghệ chờ xác lập** — Plan §6.3.1) |
| Độ ẩm (φ_b,cr) | input | mặc định 40–75% ⇒ φ = 1,4 (Bảng 11) |
| R_bp | input | mặc định 40 MPa (6.1.1.6: ≥ max(15, 50%·80)) |
| Dưỡng hộ nhiệt | input | có ⇒ hệ số 0,85 cho co ngót/từ biến (9.1.8, 9.1.9) |
| B80: R_b,ser 57; R_bt,ser 3,30; R_b 41; R_bt 2,10 MPa; E_b 42.000 MPa | reference | Bảng 6/7/10 — xem hiệu chính dưới |
| E_p = 200.000 MPa; R_s = 1275/1,15 = 1108,7 MPa; R_sc ≤ 400 MPa | computed/giả thiết | 6.2.2.2, 6.2.3.3 + giả thiết thép PC (mục 8) |
| M, Q tác dụng | input | từ BT01/BT02 (hoặc mẫu) |
| σ_pe, P_eff, σ_pc, Lp, Mcr, Mu, Qu, a_crc | computed | chỉ đọc, không nhập tay |

**Hiệu chính 16/11/2026:** R_bt,ser(B80) = **3,30 MPa** và R_bt(B80) =
**2,10 MPa** (Bảng 6/7, cột B80, đã đếm trực tiếp từng cột và kiểm tra nhất
quán Rb = 57/1,3×0,9333 ≈ 41,0). Bản trích xuất tự động trước đó ghi nhầm
3,00/1,90 (đó là giá trị của B70). Mọi tính toán BT03 dùng 3,30/2,10.

## 4. Cơ sở tính

### 4.1 Tổn hao (§9.1, căng trên bệ)

| Khoản | Công thức | Ghi chú |
|---|---|---|
| Δσ_sp1 chùng | (207) max(0; 0,1·σ_sp − 20) MPa | thép thanh, căng cơ khí — giả thiết cho thép PC (mục 8) |
| Δσ_sp2 chênh nhiệt | (211) 1,25·Δt | Δt mặc định 65 °C |
| Δσ_sp3 khuôn/bệ | (212) ((n−1)/2n)·(ΔL/L)·E_s | mặc định 30 MPa |
| Δσ_sp4 neo | (213) (ΔL/L)·E_s | ΔL mặc định 2 mm |
| Co ngắn đàn hồi | σ_sp,el = σ_sp(1)/(1 + α·A_p/A_red) | bước tương thích lúc truyền lực, không phải khoản Δσ_sp đánh số trong §9.1.2 |
| Δσ_sp5 co ngót | (215) ε_b,sh·E_s, ε = 0,0003 (≥ B45), ×0,85 | dưỡng hộ nhiệt |
| Δσ_sp6 từ biến | (216) 0,8·α·φ·σ_bpj/[1 + α·μ·(1 + y_sj²·A_red/I_red)·(1 + 0,8φ)], ×0,85 | y_sj = 0 (đồng tâm); σ_bpj = P/A_red; σ_bpj < 0 ⇒ Δσ_sp5 = Δσ_sp6 = 0 |
| Tổng | (217)–(220); tổng (1..6) ≥ 100 MPa (9.1.10) | ma sát Δσ_sp7 không áp dụng |

Tiết diện quy đổi (162)–(163): A_red = A_c + α·A_p; I_red = I + α·I_p,
I_p = A_p·r_s²/2 (thép phân bố đều trên vòng Dp). Truyền lực (221):
σ_bp = P(1)/A_red ± M·y/I_red ≤ 0,9·R_bp (ứng suất giảm/không đổi).
Chiều dài truyền lực (222): L_p = σ_sp(1)·A_p/(R_bond·u_s) ≥ max(10·d_s, 200 mm);
R_bond = η1·η2·R_bt = 2,5·1,0·2,1 = 5,25 MPa (η1 giả thiết, mục 8).
σ_pc(x) tăng tuyến tính trong L_p từ hai đầu.

### 4.2 Mô men nứt (243)

M_crc = R_bt,ser·W_pl + P·e_core,p; e_core,p = r = W_red/A_red (e_0p = 0);
W_pl = γ·W_red. **γ = 1,3 là giả thiết** (Phụ lục L không có tiết diện vành
khuyên); luôn báo kèm giá trị đàn hồi γ = 1,0.

### 4.3 Sức kháng uốn Mu — mô hình tự xây dựng (xem mục 8)

TCVN không có công thức Mu trực tiếp cho vành khuyên ƯST chịu uốn thuần túy
(Phụ lục F chỉ cho cột vành khuyên không ƯST chịu nén lệch tâm). Dùng mô
hình nội lực giới hạn trên vành khuyên theo giả thiết 8.1.2.2.1:
- Bê tông chịu nén R_b đều trên vùng nén (diện tích phân đoạn vành khuyên
  tính giải tích), bê tông chịu kéo = 0, tiết diện phẳng, ε_b2 = 0,003133.
- Thép: σ_s,i = σ_pe + E_s·ε_b2·(y_i − x)/x, chặn [−R_sc, R_s].
- Giải cân bằng C(x) = T(x) bằng chia đôi; M_u = mô men của C và T quanh
  trục trọng tâm. Kiểm tra ξ = x/h_0 ≤ ξ_R = 0,7/(1 + ε_s,el/ε_b2) (31)(223);
  nếu ξ > ξ_R thì dùng x = ξ_R·h_0 (8.1.2.3.5).

### 4.4 Sức kháng cắt (8.1.3)

b = 2·t (hai vách vành khuyên), h_0 = Do − a, a = (Do − Dp)/2.
q_sw = R_sw·A_sw/s_w; A_sw = số lớp × 2·A_dây trên một bước xoắn (một vòng
xoắn cắt tiết diện nghiêng hai lần — giả thiết); R_sw = 300 MPa (trần
6.2.2.3 — giả thiết vì mác đai SWM-C không ghi cường độ).
Q_b = 1,5·R_bt·b·h_0²/C kẹp [0,5; 2,5]·R_bt·b·h_0; Q_sw = 0,75·q_sw·C;
C ∈ [h_0, 2h_0], lấy min. Hệ số lực dọc φ_n (8.1.3.3.2) với
σ_m = P_eff/A_red. Giới hạn dải bê tông (88): Q ≤ φ_n·0,3·R_b·b·h_0.
**Nếu q_sw < 0,25·R_bt·b (96) thì Q_b tính theo (97).**

### 4.5 Nứt (8.2.2, 9.3)

M > M_crc mới tính. σ_s theo (245): [M·(h_0 − y_c)/I_red − N_p/A_red]·α_s1,
α_s1 = E_s/E_b,red, E_b,red = 57/0,0015 = 38.000 MPa; σ_s ≤ R_s,ser − σ_sp.
L_s = 0,5·(A_bt/A_s)·d_s, A_bt = A_c/2, kẹp [max(10d_s, 100), min(40d_s, 400)] mm.
ψ_s = 1 − 0,8·(M_crc/M) (176). a_crc = φ1·φ2·φ3·ψ_s·(σ_s/E_s)·L_s;
φ1 = 1,0/1,4 (ngắn/dài hạn), φ2 = 0,5, φ3 = 1,0. Giới hạn a_crc,u = 0,4/0,3 mm
(Bảng 17, nhóm thép thanh cường độ cao — giả thiết, mục 8).

## 5. Trình tự tính

1. Lấy hình học + thép PC từ BT00; tính A_red, I_red, W_red.
2. Tính từng khoản tổn hao thứ nhất → σ_sp(1), P(1) → co ngắn đàn hồi.
3. Tính Δσ_sp5, Δσ_sp6 (cần σ_bpj) → σ_pe, P_eff, σ_pc; kiểm tra tổng ≥ 100 MPa.
4. Tính L_p, σ_pc(x); kiểm tra truyền lực (221) với M do tự trọng từ BT01.
5. Tính M_crc, M_u, Q_u (theo vùng đai tại x), a_crc, ứng suất thớ sử dụng.
6. Đối chiếu với M, Q từ BT01/BT02 → hệ số sử dụng từng cơ chế.

## 6. Kết quả (mặc định quy trình, L = 12 m)

| Mã | σ_pe (MPa) | σ_pc (MPa) | P_eff (kN) | L_p (m) | Mcr tính/công bố (kN·m) | Mu tính/công bố (kN·m) | ξ/ξ_R | Q_u giữa (kN) |
|---|---|---|---|---|---|---|---|---|
| PHC-A300 | 684 | 3,61 | 163 | 0,26 | 18,4 / 24,5 | 32,9 / 36,7 | 0,15/0,29 | 56 |
| PHC-B500 | 652 | 7,16 | 821 | 0,39 | 117,8 / 147,2 | 261,5 / 265,0 | 0,23/0,28 | 178 |
| PHC-C500 | 644 | 8,09 | 926 | 0,39 | 127,3 / 166,8 | 290,4 / 333,5 | 0,25/0,28 | 181 |
| PHC-B800 | 659 | 6,30 | 1601 | 0,39 | 409,3 / 539,6 | 855,5 / 971,2 | 0,19/0,28 | 449 |
| PHC-C1000 | 640 | 8,48 | 3167 | 0,39 | 929,3 / 1177 | 2087 / 2354 | 0,23/0,28 | 779 |

- σ_pe 640–684 MPa cho cả 33 mã (cùng bậc độ với đối chiếu chẩn đoán
  678–878 MPa; thấp hơn chủ yếu do ΔT mặc định 65 °C = 81 MPa — với
  ΔT = 0 tường minh, σ_pe B500 tăng lên ~726 MPa).
- Mốc BT01 (B500, L = 12 m): giữa nhịp M = 10,4 kN·m ⇒ U_uốn = 0,040;
  tại gối Q = 17,4 kN ⇒ U_cắt < 0,10; chưa nứt (M < M_crc). **Đạt.**
- Truyền lực: σ_bp đỉnh giữa nhịp ≈ 8,9 MPa ≪ 0,9·R_bp = 36 MPa.

## 7. Đối chứng

- Test `tests/bt03_losses.test.mjs` (7 test) + `tests/bt03_section.test.mjs`
  (9 test): 16/16 pass; toàn bộ 55/55 pass.
- Ngưỡng đặt trước: từng khoản tổn hao khớp tính tay < 0,2%; tổng tổn hao
  ≥ 100 MPa; σ_pe 500–950 MPa; σ_pc 3–12 MPa; M_u cân bằng C = T trong 1 N;
  ξ ≤ ξ_R; M_u cùng bậc độ với công bố (±30%); Q_u ≫ Q BT01.
- Đối chứng độc lập: hình học vùng nén và M_u tính lại bằng tích phân lát
  cắt cực 720 lát (khớp < 2%); tổn hao tính tay từng khoản.
- **Chênh lệch cần giải thích, không hiệu chỉnh:**
  - Mcr tính thấp hơn công bố ~20–25% một cách hệ thống: Mcr công bố là
    giá trị tối thiểu TCVN 7888 Bảng 1, suy ra f_r ≈ 6,4 MPa, trong khi
    TCVN 5574 cho R_bt,ser·γ = 3,30×1,3 = 4,29 MPa. Mcr tính thiên về an toàn.
  - Mu tính thấp hơn công bố 1–13% (cùng nguyên nhân — Mu công bố =
    k_r·Mcr công bố).
  - **Phát hiện cắt:** đai giữa thân B500 (⌀4 @ 100 mm, 1 lớp) cho
    q_sw = 75,4 N/mm < 0,25·R_bt·b = 94,5 N/mm ⇒ **không đạt tối thiểu
    (96)**; bài tính dùng Q_b theo (97). Vùng đầu (2 lớp @ 50 mm) đạt.
    Đây là ghi nhận về cấu tạo đai, không phải kết luận không đạt — Q_u
    giữa thân (178 kN) vẫn gấp ~10 lần Q tác dụng (17,4 kN).

## 8. Kết luận

- **Đã có cơ sở dùng cho BT04–BT08:** σ_pe, P_eff, σ_pc(x), L_p, Mcr, Mu,
  Qu, a_crc tự tính theo TCVN 5574, có kiểm chứng độc lập.
- **Còn thiếu / giả thiết cần Danh hoặc nhà sản xuất xác nhận:**
  1. Thép PC TCVN 6284-3 không có trong TCVN 5574 — đã dùng tương tự:
     chùng theo (207) như thép thanh 6284-5; R_s,n = f_py; E_s = 200.000 MPa;
     η1 = 2,5 cho R_bond; a_crc,u theo nhóm thép thanh cường độ cao.
  2. Δt = 65 °C, Δσ_sp3 = 30 MPa, ΔL neo = 2 mm là mặc định tiêu chuẩn khi
     không có số liệu nhà máy — cần số liệu thực tế để thay.
  3. L_cang = L là giả thiết công nghệ chờ xác lập (Plan §6.3.1).
  4. γ = 1,3 cho W_pl của vành khuyên; b = 2t, h_0 = Do − a cho cắt;
     một bước xoắn cắt tiết diện nghiêng hai lần; R_sw = 300 MPa.
  5. M_u dùng mô hình nội lực giới hạn tự xây dựng (TCVN không có công thức
     trực tiếp cho vành khuyên ƯST); cần đối chiếu bản in TCVN 5574 cho các
     công thức (216) (y_sj²), (98) s_w,max và hệ số gần gối trước khi dùng
     cho thiết kế chính thức.
- Bài tiếp theo nhận kết quả này: BT04 (lực tiếp xúc từ BT01/BT02),
  BT05 (uốn vòng dùng P_eff và vùng tiếp xúc), BT06–BT08 (truyền lực,
  biên lý tưởng).
