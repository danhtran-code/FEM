---
name: fem-web
description: Khởi tạo và Quản lý Phần mềm Tính toán FEM & Kết cấu (Web-based). Kích hoạt khi người dùng yêu cầu tạo mới, thêm tính năng, hoặc chỉnh sửa một module tính toán phần tử hữu hạn, phân tích kết cấu hoặc địa kỹ thuật chạy trên trình duyệt.
---

# Skill: Khởi tạo và Quản lý Phần mềm Tính toán FEM (Web-based)

## 1. Mục tiêu và Điều kiện kích hoạt
- **Kích hoạt:** Khi người dùng yêu cầu tạo mới, thêm tính năng, hoặc chỉnh sửa một module tính toán phần tử hữu hạn, phân tích kết cấu hoặc địa kỹ thuật chạy trên trình duyệt.
- **Mục tiêu:** Xây dựng phần mềm dạng web tĩnh (Client-side), logic cơ học chuẩn xác, cấu trúc lưu trữ khoa học, tương thích 100% với GitHub Pages và Web Server nội bộ, có đầy đủ log phiên bản và tài liệu hướng dẫn.
- **Cơ sở tiêu chuẩn:** Ưu tiên TCVN trong tính toán, đánh giá và báo cáo mặc định; với kết cấu cọc bê tông cốt thép ưu tiên TCVN 5574, gồm cả tính dự ứng lực sau tổn hao. Các tiêu chuẩn khác phục vụ tham khảo, đối chiếu và so sánh theo lựa chọn người dùng.

## 2. Kiến trúc & Công nghệ lõi
- **Giao diện (UI):** HTML5, Tailwind CSS (qua CDN để chạy tĩnh không cần build step).
- **Tính toán (Logic/Math):** JavaScript ES6 Modules kết hợp thư viện toán học (`mathjs` qua CDN khi giải hệ phương trình/ma trận lớn). Với bài toán lặp mật độ cao hoặc lưới phần tử lớn, tách vào **Web Worker** để tránh treo giao diện.
- **Trực quan hóa (Viz):** `Chart.js` hoặc `Plotly.js` để vẽ biểu đồ nội lực ($M, Q, N$), chuyển vị, đường cong hệ số an toàn và mặt cắt cấu kiện.
- **Môi trường triển khai:** Static Hosting (GitHub Pages hoặc Web Server nội bộ).
- **Đơn vị:** Lõi tính chuẩn SI m–kg–s với N, Pa và các đơn vị dẫn xuất; giao diện có thể nhập/xuất mm, MPa, kN nhưng phải chuyển đổi tại biên và lưu rõ đơn vị. Chuẩn hóa cả các hằng số có thứ nguyên trong công thức; không trộn m–N–Pa với mm–N–MPa, không nhầm khối lượng với trọng lượng.

## 3. Cấu trúc thư mục tiêu chuẩn bắt buộc
Khi khởi tạo dự án hoặc thêm module mới, Agent phải duy trì nghiêm ngặt cấu trúc cây thư mục sau:

```text
📁 / (Thư mục gốc dự án)
├── 📁 src/                 # Chứa mã nguồn ứng dụng
│   ├── 📁 ui/              # Giao diện từng module (xep-coc.html, tinh-dam.html...)
│   ├── 📁 core/            # Thư viện lõi dùng chung (fem_solver.js, math_matrix.js...)
│   ├── 📁 modules/         # Logic nghiệp vụ & kiểm tra tiêu chuẩn từng bài toán
│   └── 📁 workers/         # Web Worker xử lý bài toán nặng (tiếp xúc, quét dung sai, tối ưu)
├── 📁 data_in/             # File thông số thư viện & dữ liệu mẫu đầu vào (.json, .csv)
├── 📁 data_out/            # Mẫu xuất báo cáo / kịch bản kết xuất dữ liệu
├── 📁 docs/                # Tài liệu hướng dẫn sử dụng (User Manual) cho từng module
│   └── HDSD_<ten-module>.md  
├── 📁 tests/               # Bài toán chuẩn (benchmark) và kiểm tra hồi quy
├── .gitignore              # Bắt buộc loại trừ __pycache__/, *.pyc, .DS_Store, .vscode/
├── index.html              # Trang chủ (Dashboard) điều hướng đến các module
├── CHANGELOG.md            # Nhật ký cập nhật qua từng phiên bản (SemVer)
└── README.md               # Giới thiệu tổng quan, danh sách module và cách deploy
```

## 4. Tiêu chuẩn mặc định, tính đối chiếu và in báo cáo

- **TCVN là cơ sở chính:** Ưu tiên triển khai và kiểm chứng TCVN trước. Phương án mới/đặt lại mặc định `primaryStandard = "TCVN"`, `comparisonStandards = []`, `reportStandards = ["TCVN"]`; ghi mã tiêu chuẩn cụ thể, phiên bản, sửa đổi và điều khoản cho từng kiểm tra. Với xếp cọc PHC, ưu tiên TCVN 5574:2018 cho đặc trưng vật liệu, dự ứng lực sau tổn hao và sức kháng; TCVN 7888 đối chiếu sản phẩm/lưu kho, không dùng cấp tải để gán sức kháng hoặc ứng suất hữu hiệu.
- **Tiêu chuẩn khác là tham khảo:** Cho phép người dùng chọn không, một hoặc nhiều bộ như EC2/EN, SP/GOST, JIS, ACI/PCI, GB để đối chiếu ở từng bài có hỗ trợ. Chọn để xem, tính hoặc in không tự đổi cơ sở chính TCVN; không yêu cầu mọi bài toán đều triển khai mọi tiêu chuẩn.
- **Tính song song khi cần:** Dùng chung dữ liệu vật lý gốc và kịch bản để so sánh, nhưng mỗi bộ phải xác lập riêng đặc trưng vật liệu, tổ hợp/hệ số tải, tổn hao dự ứng lực, sức kháng và giới hạn. Chỉ dùng chung nghiệm cơ học khi tải, độ cứng, dự ứng lực và điều kiện biên giống nhau; khác các điều kiện này thì giải lại. Giữ tác vụ nặng trong Web Worker.
- **Giữ kết quả độc lập:** Tách bộ kiểm tra tiêu chuẩn khỏi lõi FEM/tiếp xúc; lưu kết quả theo bộ tiêu chuẩn, bài tính, kiểm tra và dấu vết đầu vào. Mỗi bộ có nội lực khi cần giải riêng, sức kháng, hệ số sử dụng, trạng thái và nguồn công thức; không trộn hệ số hoặc chọn kết quả thuận lợi giữa các bộ để tuyên bố đạt. TCVN thiếu căn cứ/dữ liệu hoặc chưa được triển khai phải hiện đúng trạng thái, không tự thay bằng tiêu chuẩn khác.
- **So sánh có cùng cơ sở:** Lấy TCVN làm mốc, thể hiện phiên bản, kết quả riêng, chênh lệch và cơ chế chi phối; chỉ đối chiếu trực tiếp các đại lượng cùng định nghĩa, đơn vị và trạng thái giới hạn. Khác cơ sở thì giải thích; mốc thiếu hoặc bằng 0 thì không xuất phần trăm không xác định. Tối ưu và đề nghị phương án mặc định theo TCVN; tập phương án tham khảo được ghi riêng.
- **Cho người dùng chọn bộ để in:** Lựa chọn xuất/in độc lập với lựa chọn tính; mặc định TCVN, cho phép in một hoặc nhiều bộ đã tính còn phù hợp với đầu vào/phiên bản hiện tại. Mỗi phần báo cáo ghi rõ vai trò chính/tham khảo, phiên bản, điều khoản và trạng thái; báo cáo chỉ có bộ tham khảo phải ghi rõ phạm vi, không suy ra kết luận TCVN. Bộ chưa có kết quả phải được tính/bổ sung hoặc ghi thiếu rõ ràng.
- **Lưu/nạp đúng lựa chọn:** Lưu bộ tham khảo và bộ được chọn in trong JSON/LocalStorage của phương án; nạp lại lựa chọn đã lưu. Cấu hình cũ thiếu trường tiêu chuẩn được bổ sung mặc định TCVN; CSV/HTML/PDF phải giữ nhãn tiêu chuẩn và kết quả tương ứng.
- **Kiểm chứng hành vi:** Kiểm tra mặc định TCVN, chọn tính đối chiếu, chọn riêng bộ để in, lưu/nạp và kết quả hết hiệu lực khi sửa đầu vào. Có trường hợp TCVN không đạt nhưng bộ tham khảo đạt, bộ chưa hỗ trợ và thiếu dữ liệu để xác nhận chúng không ghi đè kết luận TCVN hoặc tạo báo cáo sai bộ.

Ví dụ: BT03 tính TCVN và EC2 cho hai mức sử dụng khác nhau thì giữ cả hai cột cùng nguồn hệ số. Nếu người dùng chỉ chọn in EC2, xuất phần “tham khảo theo EC2”; kết luận TCVN của phương án vẫn giữ nguyên và phương án mới vẫn mặc định TCVN.

## 5. Áp dụng cho module xếp cọc PHC

Khi làm module này, đọc [kế hoạch xếp cọc](../../../Plan_XepCoc.md), đặc biệt mục 6–7 về dữ liệu/tiêu chuẩn và mục 11 về BT00–BT14; áp dụng các chốt dưới đây thay cách dùng dữ liệu tham khảo ở các phiên bản kế hoạch cũ.

- **Bản vẽ chỉ tham khảo:** Tách `reference` (ghi chú/thông số công bố), `input` (cấu tạo/vật liệu/quá trình người dùng xác lập) và `computed` (kết quả tự tính, chỉ đọc). Có thể xem/chọn bản vẽ và xác nhận cấu tạo đầu vào riêng; không để `M_cr/M_u`, tải thi công, khối lượng, sức chịu cắt hoặc dự ứng lực công bố đi vào lõi tính hay ngưỡng kiểm tra. Không hiệu chỉnh ngược thông số để ép khớp bản vẽ; 33 bản gồm 24 bản phiên bản 1.2 và 9 bản phiên bản 2.2.
- **Chiều dài là biến đầu vào:** `L > 0` do người dùng nhập; không coi việc bản vẽ để biến `L` là thiếu tài liệu triển khai. Đổi `L` phải tính lại hình học dọc trục, tự trọng, nội lực, tổn hao và các kết quả phụ thuộc.
- **Tự tính theo TCVN 5574:** Từ hình học, bố trí thép và cấp vật liệu, tính lại đặc trưng tiết diện hình học/quy đổi, diện tích thép, tự trọng, đặc trưng vật liệu thiết kế, mômen nứt và sức kháng uốn/cắt. Giữ nguồn/quy cách mẫu khi quy đổi bê tông; không tự coi 80 MPa mẫu trụ trên bản vẽ là một cấp B tương đương.
- **Quy trình căng đã chốt:** Cọc sản xuất tại nhà máy, căng trước bằng máy cơ khí, thép cắt để đạt lực và giãn dài theo chiều dài cọc yêu cầu; không yêu cầu chọn lại phương pháp hoặc áp dụng nhánh căng sau/nhiệt–điện. Giữ riêng chiều dài cọc `L`, thép trước căng `L_cut` và chiều dài làm việc `L_cang` khi cần; không lấy chiều dài tối đa bảng tra làm chiều dài đoạn căng. Dùng lực/ứng suất thực tế hoặc dữ liệu lực–giãn dài, ghi mốc đo để tránh trừ lặp tổn hao neo/bệ đã phản ánh trong phép đo; cắt đúng chiều dài không làm mất chùng ứng suất, co ngót và từ biến về sau.
- **Dưỡng hộ và nhiệt:** Hầm sấy vài giờ → đưa ra tháo khuôn → dưỡng hộ tự nhiên; không tự gán số giờ, nhiệt độ hay cường độ truyền lực từ mô tả “vài giờ”. Căng bằng cơ không dùng gia nhiệt, nhưng không suy tổn hao chênh nhiệt lúc dưỡng hộ bằng 0 chỉ từ phương pháp căng; TCVN 5574 mục 9.1.4 xét chênh nhiệt thép–thiết bị giữ lực lúc gia nhiệt. `ΔT = 0` chỉ khi ghi giả thiết không có chênh nhiệt; dùng hệ số dưỡng hộ nhiệt đúng điều kiện mục 9.1.8–9.1.9, không nhân lặp, không coi hầm sấy là chưng áp hay xóa lịch sử nhiệt vì sau đó dưỡng hộ tự nhiên.
- **Tính đủ tổn hao:** Từ loại thép, lực căng, dưỡng hộ/truyền lực và các dữ liệu cần thiết, tính đủ các khoản trước/sau truyền lực theo TCVN 5574 và giai đoạn đánh giá. Xuất bảng từng khoản, tổng và dự ứng lực còn lại, tránh tính trùng. Phân biệt `σ_pe` trong thép, `P_eff` và `σ_pc` trong bê tông; không nhập trực tiếp kết quả này để bỏ qua tổn hao, lấy 4/6/8/10 MPa theo cấp tải hoặc suy từ `M_cr/M_u`. Tham khảo [bảng tính vật liệu cọc](../../../Ref/SCTVL_5574_2018_00.xlsm), kiểm chứng lại công thức/đơn vị và tách sức kháng thiết kế khỏi giá trị theo cường độ tiêu chuẩn trước khi dùng đối chứng.
- **Bỏ thép dọc gia cường:** Không xét `N2, ØGC, L2` trong mô hình tính hiện tại, gồm tiết diện quy đổi/độ cứng, tổn hao và sức kháng; chỉ giữ thông tin này nếu cần xem bản vẽ. Vẫn xét thép dự ứng lực và phân vùng đai xoắn `section(x)` giữa đầu cọc và thân giữa; không yêu cầu bổ sung cấp thép gia cường để chạy bài tính.
- **Thanh kê gỗ tuyệt đối cứng:** Giữ tiết diện 100 × 100 mm, chuẩn SI `0,1 × 0,1 m` (`A = 0,01 m²`), chiều dài/phạm vi đỡ và vị trí kê theo phương án. Mô hình vật rắn, không kiểm tra uốn, cắt, nén, sức chịu tải hay biến dạng gỗ; không yêu cầu môđun/cường độ gỗ hoặc tối ưu vật liệu/tiết diện khác. Vẫn giải truyền lực, chuyển động vật rắn và tiếp xúc phía cọc, không chia tải đều mặc định.
- **Chỉ xét khả năng chịu cọc:** Kho được giả thiết đủ năng lực; nền cứng không lún, chèn/biên giữ có năng lực không giới hạn, không yêu cầu dữ liệu địa kỹ thuật, sức chịu tải nền/chèn, diện tích hay sức chứa kho. Đặt ràng buộc lý tưởng với vị trí/hướng rõ trên sơ đồ để lấy lực lên cọc, không khóa tùy ý mọi cọc; mặc định tiếp xúc pháp tuyến, không cần ma sát kho để tạo cân bằng. Phản lực kho là đầu ra truyền lực, không là kiểm tra chịu tải kho. BT07–BT08 chỉ kiểm chứng biên lý tưởng; BT13–BT14 so sánh số tầng giới hạn theo cọc, dung sai và mức sử dụng, không tối ưu năng lực kho.
- **Kết quả và lưu/nạp:** Báo cáo nêu SI/chuyển đổi, `L`, quy trình căng cơ/hầm sấy/tự nhiên, lực–giãn dài và bảng tổn hao; bỏ thép dọc gia cường, kê cứng/nền không lún/biên đủ năng lực. JSON/LocalStorage lưu nguồn, đơn vị và phiên bản; nạp lại tính `computed` từ `input`. Thay dữ liệu tham khảo, thép gia cường bị bỏ hay thông số năng lực kho phải giữ nguyên kết quả và không chặn tính; đổi cấu tạo/vật liệu/quá trình thì tính lại. File cũ không tự biến dữ liệu tham khảo thành kết quả hợp lệ.
- **Ghép hệ và kiểm chứng:** Với S1/S3, tiếp xúc một phía dọc thân cho phép tách hở/tập trung lực và vẫn phải có cân bằng hợp lệ với biên lý tưởng. Kết luận là khả năng chịu cọc theo TCVN 5574 dưới các giả thiết đã nêu; các quy định sản phẩm/lưu kho đối chiếu riêng, không kết luận năng lực toàn kho. Kiểm chứng tiết diện/tổn hao và truyền lực trước khi quét dung sai/tối ưu; dùng Plotly.js cho bản đầu.

Ví dụ: chỉ đổi `M_cr` tham khảo không được đổi sức kháng hoặc dự ứng lực tự tính; thiếu môđun/cường độ gỗ hay dữ liệu nền vẫn tính theo kho lý tưởng. Căng cơ khí là thông tin đã chốt; chênh nhiệt trong hầm sấy được ghi riêng, không lấy việc căng cơ làm bằng chứng tổn hao nhiệt bằng 0.
