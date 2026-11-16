# BT04–BT08 — Tiếp xúc, vòng, truyền lực qua kê cứng, ràng buộc ngang, kê đáy

**Phiên bản:** M2 — 16/11/2026 (app v0.5.0)
**Trạng thái:** Đã kiểm chứng bằng test (BT04: 6, BT05: 6, BT06: 6, BT07: 4,
BT08: 4 — tổng 26 test mới; toàn bộ 81/81 pass).
**Cơ sở chính:** TCVN 5574:2018 (BT04 §8.1.5, BT03 §9.1/§8.1.3/§9.3);
BT05–BT08 dùng cơ học vật rắn/vành đàn hồi theo Plan v0.5.0 §11.3.
Thanh kê gỗ 100×100 mm tuyệt đối cứng; kho/biên lý tưởng đủ năng lực;
không kiểm tra gỗ, không kiểm tra nền/chèn.

---

## BT04 — Nén tại vùng tiếp xúc cọc–kê và cọc–cọc

### 1. Mục tiêu
Xác định diện tích, bề rộng vệt tiếp xúc thực tế và áp lực tiếp xúc; kiểm
tra nén cục bộ phía cọc. Không lấy diện tích tiếp xúc bằng tiết diện cọc
hay tiết diện gỗ.

### 2. Đầu vào
| Thông số | Loại | Nguồn |
|---|---|---|
| Lực tiếp xúc F | input | phản lực BT01/BT02 (vd 17,389 kN tại gối B500) |
| Bề rộng kê / chiều dài chồng lấp Lc | input | kê: 0,1 m (support_ground_specs.json); cọc–cọc: chiều dài chồng lấp, bắt buộc |
| E_b = 42.000 MPa, ν = 0,2; R_b = 41 MPa | reference | TCVN 5574 Bảng 10/7 |
| p0, a, A_tx, R_b,loc, N_allow | computed | chỉ đọc |

### 3. Cơ sở tính
- **Hertz** (hai hình trụ song song): 1/R* = 1/R1 + 1/R2; 1/E* =
  (1−ν1²)/E1 + (1−ν2²)/E2; a = √(4·F·R*/(π·Lc·E*));
  p(s) = p0·√(1−(s/a)²); p0 = 2F/(π·a·Lc); p_trung bình = (π/4)·p0.
  Cọc–kê: R* = R, E* = E_b/(1−ν²) (kê cứng tuyệt đối). Cọc–cọc: R* = R/2,
  E* = E_b/(2(1−ν²)).
- **Nén cục bộ (116)–(118):** N ≤ ψ·R_b,loc·A_b,loc; ψ = 0,75 (áp lực
  Hertz không đều); R_b,loc = φ_b·R_b; φ_b = 0,8·√(A_b,max/A_b,loc) kẹp
  [1,0; 2,5]; A_b,max theo Hình 13 (mở rộng mỗi cạnh bằng kích thước tương
  ứng ⇒ 3× mỗi chiều ⇒ φ_b = 2,4 cho vệt Hertz).

### 4. Kết quả (B500, L = 12 m)
| Trường hợp | a (mm) | p0 (MPa) | A_tx (m²) | φ_b | N_allow (kN) | U = F/N_allow |
|---|---|---|---|---|---|---|
| Cọc–kê, F = 17,389 kN, Lc = 0,1 m | 1,13 | 98,4 | 2,25·10⁻⁴ | 2,40 | 16,60 | **1,05** |
| Cọc–cọc, F = 20,08 kN, Lc = 12 m | 0,11 | 9,7 | 2,64·10⁻³ | 2,40 | 195 | 0,10 |

### 5. Đối chứng
Tích phân số áp lực Hertz = lực đặt (< 0,1%); F×4 ⇒ a×2, p0×2;
A_tx ≪ A_cọc (0,2%) và ≪ A_gỗ (2,3%). Kê rộng gấp đôi ⇒ U giảm 1/√2.

### 6. Kết luận
- **Phát hiện:** tiếp xúc cọc–kê tại phản lực BT01 **vượt nhẹ giới hạn lý
  tưởng (U = 1,05)** với mô hình Hertz + kê cứng tuyệt đối. Mô hình này
  thiên về an toàn (thực tế gỗ biến dạng cục bộ và bê tông phân bố lại áp
  lực làm vệt tiếp xúc rộng ra — cả hai đều ngoài phạm vi mô hình theo
  Plan). Phương án xử lý thuộc về thiết kế: kê rộng gấp đôi (Lc = 0,2 m)
  ⇒ U = 0,74; hoặc chấp nhận với luận chứng riêng.
- Cọc–cọc đạt thoải mái (U = 0,10).

---

## BT05 — Ép ngang, uốn vòng và nứt thành cọc rỗng

### 1. Mục tiêu
Kiểm tra uốn vòng/nứt thành cọc dưới tải hướng tâm (phản lực kê, tiếp xúc
cọc–cọc) bằng mô hình vành đàn hồi. Dự ứng lực dọc **không** được coi là
dự ứng lực vòng.

### 2. Đầu vào
| Thông số | Loại | Nguồn |
|---|---|---|
| Lực hướng tâm F, chiều dài trải tải Lc | input | BT04 (F) + bề rộng kê/chồng lấp |
| rm = (Ro+Ri)/2, t; R_bt,ser = 3,30; R_bt = 2,10 MPa | reference/computed | BT00 + TCVN 5574 Bảng 6/7 |
| Đai thực tế tại vùng tiếp xúc | reference | section(x) BT00 |
| M_vòng, σ_vòng, vị trí nứt, L_eff | computed | chỉ đọc |

### 3. Cơ sở tính
Vành mỏng chịu hai tải hướng tâm đối nhau P (N/m): M(θ) = P·r_m·(1/π −
sinθ/2); M_max = +0,3183·P·r_m tại điểm đặt tải (kéo thớ trong);
M = −0,1817·P·r_m tại hông (kéo thớ ngoài); N(θ) = −(P/2)·sinθ.
σ = N/t ± M/W, W = t²/6 trên một đơn vị dài trục.
Phạm vi hiệu lực: vành mỏng; tải coi như tải đường (2a ≪ r_m); **bỏ qua
trải dài dọc trục (hiệu ứng vỏ 3D)** nên thiên về an toàn. Sau khi nứt,
đai xoắn chịu kéo vòng nhưng BT05 chưa tính khả năng sau nứt.

### 4. Kết quả (B500)
| Trường hợp | P_line (kN/m) | σ_thớ trong (MPa) | σ_hông (MPa) | U_nứt (σ/R_bt,ser) | L_eff cần (m) |
|---|---|---|---|---|---|
| Tại kê, F = 17,389 kN, Lc = 0,1 m | 173,9 | **8,40** | 3,83 | **2,55** | 0,255 |
| Cọc–cọc, F = 20,08 kN, Lc = 12 m | 1,67 | 0,08 | 0,04 | 0,02 | — |

Vị trí nứt dự kiến: thớ trong tại điểm đặt tải (đỉnh/đáy). Gối x = 2,4 m
nằm ở vùng thân giữa (L_end = 1,0 m) — đai thưa 1 lớp @ 100 mm.

### 5. Đối chứng
M(θ) kiểm tra độc lập bằng Castigliano (góc xoay tại điểm đặt tải = 0,
tích phân số); M(0), M(π/2), N_hông khớp công thức; kê rộng gấp đôi ⇒ σ
giảm một nửa; D lớn ⇒ σ giảm.

### 6. Kết luận
- **Phát hiện:** mô hình vành 2D sàng lọc dự báo **nứt thớ trong tại kê**
  (U = 2,55) với tải tập trung trên bề rộng kê 0,1 m. Đây là kết quả sàng
  lọc thiên về an toàn: hiệu ứng vỏ 3D trải tải trên chiều dài hiệu dụng
  ~0,255 m (cần để không nứt) thay vì 0,1 m; đai xoắn tại vùng đầu (2 lớp
  @ 50 mm) chưa được kể vào kháng nứt. Cần mô hình vỏ 3D hoặc thí nghiệm
  để kết luận cuối — BT05 ghi nhận trạng thái sàng lọc, không kết luận
  không đạt cho toàn bộ phương án xếp.
- Cọc–cọc: không nứt.

---

## BT06 — Truyền lực qua thanh kê gỗ 100×100 tuyệt đối cứng

### 1. Mục tiêu
Xác định phản lực tại các điểm tiếp xúc khi tải tầng trên truyền qua thanh
kê cứng xuống các cọc dưới. Không chia đều mặc định; xử lý phân tải không
đều và mất tiếp xúc. Không kiểm tra gỗ.

### 2. Đầu vào
| Thông số | Loại | Nguồn |
|---|---|---|
| Tải xuống F_j tại y_j | input | từ tầng trên (BT01/BT02) |
| Độ cứng cọc dưới k_i tại y_i | computed | BT01: tải đơn vị tại x tiếp xúc ⇒ k = 1/v; tại gối ⇒ k ≈ ∞ (số 10¹²) |
| Phản lực R_i, chuyển động (u, θ) | computed | chỉ đọc |

### 3. Cơ sở tính
Vật rắn 2 bậc tự do: R_i = k_i·(u + θ·y_i) (chỉ nén); hệ
[Σk, Σky; Σky, Σky²]·[u, θ]ᵀ = [ΣF, ΣF·y]ᵀ. R_i < 0 ⇒ loại điểm đó và
giải lại. Kiểm tra ΣR = ΣF, ΣR·y = ΣF·y. Tải ngoài phạm vi gối ⇒ kê lật
(báo lỗi, không giả số).

### 4. Kết quả (B500, k_giữa nhịp = 13,79 MN/m)
- Đối xứng (tải giữa, 2 cọc giống nhau): 17,39 / 17,39 kN.
- Tải lệch y = +0,25 m: 8,70 / 26,09 kN (quy tắc đòn bẩy, không phải 50/50).
- Tải lệch y = −0,4 m, 3 gối: gối xa nhất mất tiếp xúc, còn 27,82 / 6,96 kN,
  vẫn cân bằng.
- Tải ngoài phạm vi gối: kê lật — báo lỗi rõ ràng.

### 5. Đối chứng
k khớp võng giải tích dầm đơn giản P·L³/48EI (2%); phân tải lệch khớp đòn
bẩy (0,1%); cân bằng lực/mô men < 10⁻⁶.

### 6. Kết luận
Đã có mô hình truyền lực qua kê cứng dùng cho BT10–BT11 (S2). Giới hạn:
độ cứng cọc lấy từ BT01 đàn hồi tuyến tính (chưa nứt); tiếp xúc tại gối
được xử lý như cứng tuyệt đối.

---

## BT07 — Ràng buộc giữ ngang lý tưởng

### 1. Mục tiêu
Xác định phản lực giữ ngang và tác động tương ứng lên cọc từ sơ đồ ràng
buộc đã định. Ràng buộc không tự khóa mọi cọc, không làm lệch lực tiếp xúc
nghiêng. Không kiểm tra chèn/kho.

### 2. Đầu vào
| Thông số | Loại | Nguồn |
|---|---|---|
| Lực ngoài (thành phần ngang của tiếp xúc nghiêng) | input | S1: pháp tuyến ±30° so với đứng |
| Ràng buộc: vị trí + hướng đơn vị (+ cọc gắn vào) | input | sơ đồ phương án |
| Phản lực, lực ròng từng cọc | computed | chỉ đọc |

### 3. Cơ sở tính
Cân bằng mặt phẳng ΣFx = ΣFy = ΣM = 0. Đúng 3 ràng buộc độc lập: giải duy
nhất. Ít hơn: nghiệm chuẩn tối thiểu + báo dư. Nhiều hơn: bình phương tối
thiểu + báo dư (siêu tĩnh — cần độ cứng mới chia được).

### 4. Kết quả
- Cụm S1 đối xứng (cọc trên W = 34,78 kN, 2 tiếp xúc ±30°): thành phần
  ngang triệt tiêu ⇒ phản lực giữ = 0.
- Cụm lệch (1 tiếp xúc): chèn cùng phía chịu −10,04 kN (ngược chiều đẩy),
  chèn đối diện 0; lực tiếp xúc giữ nguyên; lực ròng trên cọc dưới-phải
  = −10,04 kN (đưa vào BT03 kiểm tra lại nếu cần).

### 5. Đối chứng
Cân bằng dư < 10⁻⁶; 1 ràng buộc cho 1 lực ngang: Fx cân bằng, dư mô men
được báo (không giấu).

### 6. Kết luận
Đã có mô hình ràng buộc dùng cho S1/S3 (BT09/BT12). Giới hạn: ràng buộc
lý tưởng (không độ cứng, không giới hạn chịu lực).

---

## BT08 — Hai tuyến kê đáy trên nền cứng không lún

### 1. Mục tiêu
Xác định phản lực đáy từng cọc và tổng hệ trên nền cứng lý tưởng. Thiếu
dữ liệu nền **không** tạo trạng thái thiếu dữ liệu. Không có kết quả sức
chịu tải hay lún nền.

### 2. Đầu vào
| Thông số | Loại | Nguồn |
|---|---|---|
| Cọc, L, x1, x2, tải tập trung/vệt (nếu có) | input | BT01/BT02 |
| Phản lực R1/R2, tổng hệ | computed | chỉ đọc |
| (Không có thông số nền trong API — theo thiết kế) | — | Plan §6.2 |

### 3. Cơ sở tính
Mỗi cọc tính như BT01 (dầm hai gối + tự trọng + tải thêm). Tổng phản lực
= tổng tải hệ. Đối xứng (cùng tải, cùng gối) ⇒ R1 = R2 từng cọc.

### 4. Kết quả
- 1 cọc B500 (L = 12 m, gối 2,4/9,6 m): R1 = R2 = 17,389 kN (khớp mốc BT01).
- 3 cọc giống nhau: tổng 104,33 kN, đối xứng.
- Tải tập trung 10 kN tại x = 3,0 m: vẫn cân bằng; gối gần tải chịu nhiều
  hơn; cờ đối xứng tắt.

### 5. Đối chứng
Tổng phản lực = tổng tải (< 10⁻⁶ tương đối) cho mọi trường hợp; mốc BT01
khớp 0,1%.

### 6. Kết luận
Đã có mô hình kê đáy dùng cho BT10–BT11 (S2) và BT12 (S3). Nền cứng lý
tưởng là giả thiết của Plan; mọi kết luận về nền ngoài phạm vi.
