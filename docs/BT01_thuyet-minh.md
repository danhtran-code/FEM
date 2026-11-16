# BT01 — Một cọc đặt trên hai gối, có hai đoạn hẫng, chỉ chịu tự trọng

**Phiên bản:** M1 (v0.3.0) — 16/11/2026
**Trạng thái:** Đã kiểm chứng bằng test hồi quy (7 test BT01 + 4 test lõi giải hệ).
**Kế hoạch:** Plan v0.5.0 §11.3 (BT01), mốc M1.

## 1. Tên bài và mục tiêu

Kiểm tra mô hình dầm cơ bản: một cọc PHC đặt trên hai gối (kê đáy), hai đầu
hẫng, chỉ chịu tự trọng bản thân. Đây là bài nền cho BT02 (thêm tải tầng trên)
và BT10 (S2 nhiều tầng): mọi bài sau đều phải quy về BT01 khi bỏ tải phụ.

## 2. Sơ đồ

```
          w (tự trọng, N/m, hướng xuống, đều toàn cọc)
    ─────────────────────────────────────────────
    ▲                                        ▲
    │ a1           nhịp s           a2      │
    0 ────┬──────────────────┬────────────── L
         x1                 x2
         R1 ↑               R2 ↑
```

- Trục x dọc cọc, gốc tại đầu trái. Gối 1 tại `x1`, gối 2 tại `x2`
  (`0 ≤ x1 < x2 ≤ L`); đoạn hẫng `a1 = x1`, `a2 = L − x2`, nhịp `s = x2 − x1`.
- Gối đơn: khóa chuyển vị đứng v, xoay tự do; mặt phẳng uốn đứng.

## 3. Đầu vào

| Thông số | Nguồn | Ghi chú |
|---|---|---|
| Cọc (Do, Di, Dp, thép DƯL, đai) | BT00 (`pile_specs.json`) | Chỉ dùng hình học + thép để tính A, I, w |
| L | Người dùng nhập, > 0 | Không lấy từ bản vẽ |
| x1, x2 | Người dùng nhập | Kiểm tra `0 ≤ x1 < x2 ≤ L` |
| E_b = 42 GPa | TCVN 5574:2018 B80 | Mặc định, ghi đè được qua `E_Pa` |
| γ_c = 25 kN/m³ | Tiêu chuẩn | Mặc định, ghi đè được qua `gamma_kN_m3` |
| EI = E_b·I | Tự tính | I hình học tổng (xem §4) |

## 4. Cơ sở tính

- Dầm Euler-Bernoulli, EI không đổi dọc cọc; giải FEM phần tử dầm 2 nút
  (`src/core/fem_solver.js`), hệ tuyến tính giải bằng khử Gauss chọn trụ
  chính (`src/core/math_matrix.js`). Lõi tính chuẩn **SI** (m, N, Pa);
  hiển thị đổi sang kN, kN·m, mm tại biên.
- Tự trọng `w = γ_c·A` tự tính từ tiết diện BT00; phản lực, M(x), Q(x),
  chuyển vị v(x) theo §5.
- **Giả thiết ghi rõ:** I lấy theo tiết diện hình học tổng của bê tông vành
  khăn (chưa quy đổi thép DƯL — ước tính làm tăng I khoảng 3%, tinh chỉnh
  ở BT03 khi tính tiết diện quy đổi). Dự ứng lực là nội lực tự cân bằng,
  không đổi phản lực/nội lực do tải ngoài trong phân tích đàn hồi tuyến
  tính chưa nứt; kiểm tra tiết diện có DƯL là việc của BT03. Chưa xét lực
  ngang (chỉ xuất hiện ở S1/S3).
- M(x), Q(x) tính bằng cân bằng đoạn dầm bên trái (chính xác, không phụ
  thuộc quy ước dấu lực nút phần tử). v(x) trong phần tử = nội suy Hermite
  từ nút + số hạng tải đều hai đầu ngàm (chính xác cho dầm lăng trụ).

## 5. Trình tự tính

1. Đọc cọc BT00 → A, I, W; tính `w = γ_c·A`, `EI = E_b·I`.
2. Dựng lưới: các điểm đặc biệt 0, L, x1, x2; mỗi khoảng chia
   `elementsPerSegment` (mặc định 10) phần tử bằng nhau.
3. Lắp ráp ma trận độ cứng, véc-tơ tải nút tương đương của tải đều,
   khóa v tại hai gối, giải hệ, tính phản lực `R = K·u − F` tại gối.
4. Từ phản lực và tải: M(x), Q(x) bằng cân bằng đoạn trái; v(x) bằng
   Hermite + số hạng tải đều; cực trị M/Q/v; kiểm tra cân bằng ΣF, ΣM.

## 6. Kết quả — trường hợp mốc đối chứng

PHC-B500, L = 12 m, gối cách mỗi đầu a = 2,4 m, chỉ tự trọng
(w = 2,898 kN/m; EI = 107 236 kN·m²):

| Đại lượng | Kết quả | Đối chứng |
|---|---|---|
| R1 = R2 | 17,389 kN | wL/2 = 17,388 kN |
| M tại gối | −8,347 kN·m | −w·a²/2 = −8,346 kN·m |
| M giữa nhịp (x = 6 m) | 10,433 kN·m | tính tay 10,433 kN·m |
| Q phải gối 1 / trái gối 2 | ±10,433 kN | R1 − w·a = 10,433 kN |
| Võng giữa nhịp | 0,441 mm xuống | công ảo / chồng chất 0,44 mm |
| Đầu hẫng | **0,224 mm lên** | xem hiệu chính dưới đây |
| Cân bằng ΣF, ΣM | ~10⁻⁹ tương đối | = 0 |

**Hiệu chính mốc chuẩn cũ:** mốc chuẩn bị trước đây ghi "đầu hẫng ≈ 0,45 mm
(xuống)" — giá trị này **sai**. Góc xoay tại gối là −1,401×10⁻⁴ rad
(chiều kim đồng hồ, khớp tính tay), nâng đầu hẫng lên |θ|·a = 0,336 mm,
trừ võng hẫng tương đối w·a⁴/8EI = 0,112 mm → đầu hẫng đi **lên 0,224 mm**.
Đã kiểm chứng bằng ba cách độc lập: FEM, công ảo (Simpson, m giải tích)
và chồng chất tính tay. Võng giữa nhịp 0,44 mm của mốc cũ là đúng và giữ nguyên.

## 7. Đối chứng

- Nghiệm giải tích: phản lực, M tại gối (−w·a²/2), M giữa nhịp, Q tại gối,
  võng dầm không hẫng 5wL⁴/384EI — khớp trong 0,5% (chuyển vị 2%).
- Công ảo độc lập (Simpson 12 000 khoảng, m(x) giải tích): võng giữa nhịp
  và đầu hẫng khớp FEM trong 1%.
- Đối xứng: khi hai gối đối xứng, R1 = R2, góc xoay giữa nhịp ≈ 0, hai đầu
  hẫng võng bằng nhau.
- Hội tụ lưới: `elementsPerSegment` 2 so với 30 cho R, Mmax, võng khác nhau
  dưới 0,2%.
- Cân bằng lực/mômen toàn hệ ~10⁻⁹ tương đối; M(0) = M(L) = 0 (đầu tự do).

## 8. Kết luận

- **Bài tính đã được kiểm chứng:** solver dầm khớp nghiệm giải tích và công
  ảo trong miền BT01 (dầm lăng trụ, hai gối, tải đều + tải tập trung/vệt
  ở BT02). Không phải kết luận phương án xếp đạt — kiểm tra tiết diện
  (uốn/cắt/nứt theo TCVN 5574) là việc của BT03.
- **Tái sử dụng:** BT02 dùng chung solver với tải tập trung/vệt; BT10 (S2)
  dùng BT01 làm bài toán con cho từng cọc khi tải truyền đúng gối.
- **Bài tiếp theo:** BT02 — thêm tải tập trung từ tầng trên, đúng gối rồi
  lệch gối.
