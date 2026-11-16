# BT00 — Chuẩn hóa thông số cọc, phân vùng section(x), vật liệu, đơn vị và nguồn

**Phiên bản:** BT00-1 — 16/11/2026
**Trạng thái:** Đã kiểm chứng bằng test hồi quy (7/7 pass). Chưa phải kết luận phương án xếp đạt — BT00 chỉ chuẩn hóa dữ liệu đầu vào.

## 1. Tên bài và mục tiêu

Chuẩn hóa 33 mã cọc PHC Phan Vũ thành một thư viện dữ liệu có nguồn, có đơn vị,
có hàm `section(x)` phân vùng đai/GC theo tọa độ dọc trục, để các BT sau (BT01–BT14)
dùng chung một nguồn dữ liệu duy nhất thay vì gõ tay từng thông số.

## 2. Sơ đồ / dữ liệu gốc

- Nguồn: `Ref/06. COC BTLT ULT- BPTC DONG COC/` — 33 bản vẽ riêng (01–33) + file
  `00. COC DONG_PHC_ALL.pdf` là bản tổng hợp cùng 33 bản vẽ, không phải mã cọc thứ 34.
- Nhà sản xuất: Công ty Cổ phần Đầu tư Phan Vũ. Phiên bản bản vẽ 1.2, phát hành 11/2026.
  Thiết kế: Huỳnh Minh Phúc; kiểm tra: Trần Nguyễn Công Danh; phê duyệt: Lữ Triều Dương.
- Tiêu chuẩn sản phẩm: TCVN 7888. Bê tông 80 MPa, mẫu trụ D150×H300.
  Thép DƯL: TCVN 6284-3 (JIS G3137), f_pu = 1420 MPa, f_py = 1275 MPa.
  Thép đai: SWM-C (JIS G 3532).
- Trích xuất: `pdftotext -layout` → `Ref/txt/*.txt`, parse bằng
  `tools/extract_pile_specs.py` → `data_in/pile_specs.json` (schema `BT00-1`).
  Mỗi bản ghi giữ `drawing_no` và `drawing_title` để truy vết về đúng file PDF.

## 3. Đầu vào

| Nhóm | Có trên bản vẽ | Ghi chú |
|---|---|---|
| Hình học | Do, Dp, Di, Dei, t | t = (Do−Di)/2, kiểm tra lại trong test |
| Thép DƯL | ØPC, N1, f_pu, f_py | ØPC ∈ {7.1, 9.0, 10.7} mm |
| Thép GC | ØGC, N2, L2 | Chỉ Do ≥ 600 (16/33 mã), L2 = 1000 mm |
| Đai xoắn | ØFs, bước, số lớp | Đầu: 2 lớp, a50, dài L_end = 2·Do; giữa: 1 lớp, a100 |
| Mcr, Mu | kN·m | Có đủ 33/33, dùng để đối chiếu ngược σ_pc ở BT03 |
| Mặt bích / măng xông | Tf, T, hc, tc, w, h, hw1, Tm, Tg, hw2 | Ghi nguyên văn theo cột trên bản vẽ; tc có dạng `3(6)` nghĩa là tc = 3 mm, trường hợp hàn nối có bản táp tc = 6 mm |
| Tải thi công | install_load_T | 120–1150 T, cột riêng bên phải bảng |

**Không có trên bản vẽ — phải báo `chua_du_du_lieu`, không tự điền:**

- `sigma_pc` (ứng suất nén hữu hiệu): không có giá trị, không có lực căng ban đầu, không có tổn hao.
- `E_b`, `E_p`: không có giá trị.
- `gamma_c` / khối lượng dài: không có giá trị. Tự trọng chỉ tính được khi người dùng
  nhập `gamma_c` có nguồn; hàm `selfWeightPerMetre()` trả về trạng thái thiếu dữ liệu
  nếu không truyền gamma.
- `L` (chiều dài đoạn cọc): không cố định trên bản vẽ (tiêu đề ghi `PHC-...-L-...`).
  L là đầu vào của người dùng cho từng phương án xếp.
- Độ thẳng / dung sai chế tạo: không định lượng trên bản vẽ.

## 4. Cơ sở tính

- Đơn vị nội bộ: **mm, N, MPa (= N/mm²)**, mômen công bố giữ nguyên kN·m.
- Tiết diện vành khăn (hình học, chưa trừ thép):
  `A = π/4·(Do²−Di²)`, `I = π/64·(Do⁴−Di⁴)`, `W = I/(Do/2)`.
- Diện tích thép: `Ap = N1·π/4·ØPC²`, `Agc = N2·π/4·ØGC²`.
- `section(x)` (`src/modules/xep-coc/pile_specs.js`, hàm `sectionAt`):
  vùng đầu khi `x < 2·Do` hoặc `x > L − 2·Do` (đai 2 lớp, a50);
  vùng thân giữa (đai 1 lớp, a100). GC có mặt trong 1000 mm từ mỗi đầu.
- **Giả thiết cần Danh xác nhận (ghi rõ, chưa coi là dữ liệu bản vẽ):**
  GC bố trí ở cả hai đầu cọc, mỗi đầu dài L2. Bản vẽ chỉ ghi L2 = 1000 mm và vẽ
  chi tiết đầu đoạn cọc, không ghi rõ GC ở một đầu hay hai đầu.
- **Không quy đổi cường độ ở BT00:** bản vẽ cho cường độ mẫu trụ 80 MPa.
  Việc quy đổi sang `R_b, R_bt, E_b` (TCVN 5574:2018) hay `f_ck, f_ctm, E_cm`
  (Eurocode 2) thuộc BT03, theo đúng hệ số của từng tiêu chuẩn đang chọn.
  BT00 không tự gán `R_b` hay `E_b` từ 80 MPa.

## 5. Trình tự tính

1. Giải nén zip vào `Ref/`, trích text từng PDF.
2. Parse hàng số liệu trong bảng của từng bản vẽ (20 cột nếu không có GC,
   23 cột nếu có GC; thứ tự GC/Mcr có thể đổi chỗ theo bản vẽ, parser nhận diện
   bằng giá trị: GC là Ø14/16, N2 = 5–8, L2 = 1000).
3. Ghi vào `data_in/pile_specs.json`, kèm nguồn, đơn vị, danh sách thiếu dữ liệu.
4. Tính A/I/W/Ap/Agc và `section(x)` bằng `pile_specs.js`.
5. Chạy test hồi quy `node --test tests/bt00.test.mjs`.

## 6. Kết quả

- 33/33 mã cọc, Do 300–1000 mm, cấp A/AB/B/C.
  A = 45.239 mm² (D300) đến 378.248 mm² (D1000); Mcr 24,5–1177,0 kN·m;
  Mu 36,7–2354,0 kN·m; tải thi công 120–1150 T.
- Kiểm tra nội bộ đáng chú ý: tỉ số Mu/Mcr gần như đúng hệ số theo cấp —
  A ≈ 1,50; AB ≈ 1,65; B ≈ 1,80; C ≈ 2,00 (sai số do làm tròn 0,1 kN·m).
  Đây là dấu hiệu Mu trên bản vẽ được công bố theo hệ số của Mcr, không phải
  hai giá trị thí nghiệm độc lập — BT03 khi đối chiếu ngược σ_pc cần nhớ điểm này.
- GC: 16 mã Do ≥ 600, ØGC 14 hoặc 16 mm, N2 = 5–8, L2 = 1000 mm.
- Đai: ØFs 3–6 mm theo Do; bước đầu a50 (2 lớp), giữa a100 (1 lớp), L_end = 2·Do.

Ví dụ — PHC-A300: Do/Dp/Di = 300/240/180 mm, t = 60 mm, ØPC 7.1 mm × 6,
Mcr/Mu = 24,5/36,7 kN·m, ØFs 3 mm, A = 45.239 mm², I = 3,461×10⁸ mm⁴,
W = 2,307×10⁶ mm³. PHC-C1000: Do/Dp/Di = 1000/880/720 mm, t = 140 mm,
ØPC 10.7 mm × 55, GC Ø16 × 8, Mcr/Mu = 1177/2354 kN·m.

## 7. Đối chứng

- Tính tay độc lập A/I/W cho D300, D500, D1000: khớp < 0,1% (test `bt00.test.mjs`).
- `t = (Do−Di)/2` và `Dei = Di` đúng cho 33/33 mã.
- `validatePile()`: 33/33 bản ghi ok; Mu/Mcr trong khoảng 1,50–2,00.
- File tổng `00. ALL` được kiểm tra là bản tổng hợp, không tạo thêm mã cọc.
- Ngưỡng chấp nhận đặt trước: hình học < 0,1%; mọi bản ghi phải validate ok;
  thiếu dữ liệu phải báo trạng thái, không được tự điền.

## 8. Kết luận

- **Bài tính đã được kiểm chứng (phần dữ liệu + hình học + section(x)):**
  thư viện 33 mã cọc đã trích xuất đúng bảng số liệu trên bản vẽ, trong miền
  đã nêu, với các test trên.
- **Chưa đủ cơ sở kết luận chịu lực:** BT00 không kết luận gì về khả năng chịu
  lực của cọc. Muốn tính BT03 cần bổ sung σ_pc (hoặc đối chiếu ngược từ Mcr/Mu),
  E_b, E_p, gamma_c và L — hiện đều đang ở trạng thái thiếu dữ liệu có ghi rõ nguồn.
- Bài tiếp theo nhận kết quả này: BT01 (một cọc, hai gối, tự trọng — cần thêm
  gamma_c và L), BT03 (kiểm tra tiết diện — cần thêm σ_pc, E_b, E_p).
- Việc cần Danh quyết: (1) xác nhận GC ở cả hai đầu hay một đầu;
  (2) nguồn gamma_c / E_b / E_p muốn dùng (bản vẽ khác, thí nghiệm, hay tiêu chuẩn);
  (3) có muốn mình đối chiếu ngược σ_pc từ Mcr/Mu ở BT03 hay Danh sẽ cung cấp σ_pc.

## 9. Bổ sung ngày 16/11/2026 — BT00-2 (theo yêu cầu của Danh)

Danh yêu cầu: tự tính lại ứng suất hữu hiệu từ thông số trên bản vẽ theo
tiêu chuẩn; L là thông số tính toán có thể thay đổi; vật liệu tự xác định
theo tiêu chuẩn liên quan. Kết quả đầy đủ trong
`docs/BT03_backcheck_sigma_pc.md` và `src/modules/xep-coc/prestress.js`:

- σ_pc (σ_ce) theo TCVN 7888:2014 §6.5: A 4, AB 6, B 8, C 10 MPa (±5%).
  σ_pe suy ra = σ_ce·A0/Ap = 678–878 MPa.
- E_b = 42.000 MPa (TCVN 5574 B80), E_p = 200.000 MPa, γ_c = 25 kN/m³,
  f_c = 80 MPa mẫu trụ. Cường độ theo từng hệ giữ riêng trong
  `pile_specs.json > common.materials_determined_by_standard`.
- L: thông số tính toán, khoảng điển hình theo TCVN 7888 Bảng 1, ghi trong
  `length_range_m` của từng mã.
- Mcr đối chiếu bằng W·(f_r + σ_ce), f_r = 6,3 MPa: sai số TB +0,1%,
  |sai số| TB 2,2%, max 6,7%. Mu = k_r·Mcr (§6.6) khớp trong 0,3% cho 33/33 mã.
- Còn thiếu sau bổ sung: mác thép GC, mác thép đai, khối lượng dài thực tế
  (để xác nhận γ_c = 25), V cắt cho AB600.
