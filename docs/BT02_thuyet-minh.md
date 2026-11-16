# BT02 — Một cọc nhận tải tập trung từ tầng trên, đúng gối rồi lệch gối

**Phiên bản:** M1 (v0.3.0) — 16/11/2026
**Trạng thái:** Đã kiểm chứng bằng test hồi quy (6 test BT02).
**Kế hoạch:** Plan v0.5.0 §11.3 (BT02), mốc M1.

## 1. Tên bài và mục tiêu

Mở rộng BT01: cọc vẫn đặt trên hai gối, nhưng nhận thêm tải từ tầng trên
truyền xuống qua các tuyến kê — đặt đúng gối, rồi lệch gối. Xác định phần
tăng phản lực, nội lực và chuyển vị do tầng trên gây ra, và kiểm chứng rằng
tải đặt đúng gối lý tưởng không sinh thêm mômen giả trên cọc. Đây là bài
toán con của BT10 (S2): mỗi tầng truyền tải xuống tầng dưới qua đúng hai
tuyến kê này.

## 2. Sơ đồ

```
    P1 ↓ (tuyến kê x1, lệch e1)     P2 ↓ (tuyến kê x2, lệch e2)
          │                              │
    ──────┼──────────────────────────────┼──────
    0 ────┬──────────────────┬────────────── L
         x1                 x2
         R1 ↑               R2 ↑
              ← w tự trọng toàn cọc (BT01) →
```

- Mỗi tải tầng trên khai báo độc lập theo tuyến kê: vị trí `x_m`, tổng lực
  `P_N` hướng xuống; tải vệt thêm `length_m` (phân bố đều trên đoạn tâm `x_m`).
- Lệch `e` đo từ gối gần nhất vào phía trong nhịp; `e = 0` là đúng gối.

## 3. Đầu vào

| Thông số | Nguồn | Ghi chú |
|---|---|---|
| Cọc, L, x1, x2, E_b, γ_c | BT01 | Giữ nguyên |
| Tải P, vị trí x | Người dùng nhập | P > 0; 0 ≤ x ≤ L |
| Chiều dài vệt (nếu có) | Người dùng nhập | Đoạn vệt phải nằm gọn trong [0, L] |

## 4. Cơ sở tính

- Cùng solver dầm BT01 (`src/core/fem_solver.js`): tải điểm đặt đúng nút
  lưới; tải vệt cộng vào tải đều của các phần tử nằm trong đoạn vệt
  (lưới luôn có nút tại biên vệt nên không cắt lẻ phần tử).
- Nền so sánh là kết quả BT01 cùng cọc/L/gối (chỉ tự trọng); mọi "phần tăng"
  (ΔR, ΔM, Δv) đều đo từ nền này.
- Giả thiết như BT01 (EI không đổi, mặt phẳng uốn đứng, DƯL không đổi nội
  lực do tải ngoài). Kiểm tra tiết diện là việc của BT03.

## 5. Trình tự tính

1. Giải BT01 (nền tự trọng) với cùng cọc/L/gối.
2. Giải lại dầm với tải tầng trên cộng thêm (điểm và/hoặc vệt).
3. Xuất phản lực, M(x), Q(x), v(x) và phần tăng so với nền; kiểm tra cân
   bằng ΣF, ΣM.

## 6. Kết quả — ví dụ mốc BT01 + tải

PHC-B500, L = 12 m, gối 2,4 / 9,6 m; tải P = 20 kN:

| Trường hợp | ΔR1 | ΔR2 | ΔMmax | Ghi chú |
|---|---|---|---|---|
| Đúng gối 1 (x = 2,4) | +20,0 kN | 0 | 0 | M(x) không đổi toàn cọc |
| Đúng gối 2 (x = 9,6) | 0 | +20,0 kN | 0 | M(x) không đổi toàn cọc |
| Lệch 1,0 m từ gối 1 (x = 3,4) | +17,22 kN | +2,78 kN | +17,22 kN·m tại x = 3,4 | ΔR theo tĩnh học P(s−e)/s, Pe/s |
| Vệt 1,0 m tâm giữa nhịp | +10,0 kN | +10,0 kN | < tải điểm cùng P | Trải đều → mômen nhỏ hơn tải điểm |
| Vệt 1,0 m tâm gối 1 | ≈ +20 kN | ≈ 0 | < 1 kN·m | Hầu như chỉ tăng phản lực |

## 7. Đối chứng

- Tải đúng gối lý tưởng: chỉ tăng phản lực tương ứng đúng P; M(x) không
  đổi trên toàn cọc (sai lệch < 1 N·m); ΔMmax = 0.
- Tải lệch gối: ΔR1, ΔR2 và ΔM tại vị trí tải khớp công thức tĩnh học
  trong 0,5%; lực cắt nhảy đúng P tại vị trí tải.
- Lệch bằng 0 quy về trường hợp đúng gối.
- Chồng chất tuyến tính: hai tải trên hai tuyến kê cho kết quả bằng nền +
  tổng từng phần tăng riêng (R, M(x), v(x) khớp trong dung sai số học).
- Vệt tải: tổng ΔR = P; vệt càng dài ΔMmax càng nhỏ; vệt tâm gối hầu như
  chỉ tăng phản lực.
- Cân bằng ΣF, ΣM toàn hệ ~10⁻⁶ tương đối.

## 8. Kết luận

- **Bài tính đã được kiểm chứng:** solver xử lý đúng tải tập trung/vệt,
  đúng gối không sinh mômen giả — điều kiện tiên quyết để BT10 không tạo
  mômen giả khi truyền tải tầng trên xuống (Plan §9).
- **Tái sử dụng:** BT10 (S2) gọi BT02 cho từng cọc với tải từ tầng trên;
  BT11 dùng BT02 để khảo sát lệch kê từng mặt.
- **Bài tiếp theo:** BT03 đầy đủ (tổn hao + kiểm tra tiết diện theo
  TCVN 5574) — thuộc mốc M2; sau đó BT04–BT08 rồi mới tới S2 (BT10–BT11).
