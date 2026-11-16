---
name: fem-web
description: Khởi tạo và Quản lý Phần mềm Tính toán FEM & Kết cấu (Web-based). Kích hoạt khi người dùng yêu cầu tạo mới, thêm tính năng, hoặc chỉnh sửa một module tính toán phần tử hữu hạn, phân tích kết cấu hoặc địa kỹ thuật chạy trên trình duyệt.
---

# Skill: Khởi tạo và Quản lý Phần mềm Tính toán FEM (Web-based)

## 1. Mục tiêu và Điều kiện kích hoạt
- **Kích hoạt:** Khi người dùng yêu cầu tạo mới, thêm tính năng, hoặc chỉnh sửa một module tính toán phần tử hữu hạn, phân tích kết cấu hoặc địa kỹ thuật chạy trên trình duyệt.
- **Mục tiêu:** Xây dựng phần mềm dạng web tĩnh (Client-side), logic cơ học chuẩn xác, cấu trúc lưu trữ khoa học, tương thích 100% với GitHub Pages và Web Server nội bộ, có đầy đủ log phiên bản và tài liệu hướng dẫn.

## 2. Kiến trúc & Công nghệ lõi
- **Giao diện (UI):** HTML5, Tailwind CSS (qua CDN để chạy tĩnh không cần build step).
- **Tính toán (Logic/Math):** JavaScript ES6 Modules kết hợp thư viện toán học (`mathjs` qua CDN khi giải hệ phương trình/ma trận lớn). Với bài toán lặp mật độ cao hoặc lưới phần tử lớn, tách vào **Web Worker** để tránh treo giao diện.
- **Trực quan hóa (Viz):** `Chart.js` hoặc `Plotly.js` để vẽ biểu đồ nội lực ($M, Q, N$), chuyển vị, đường cong hệ số an toàn và mặt cắt cấu kiện.
- **Môi trường triển khai:** Static Hosting (GitHub Pages hoặc Web Server nội bộ).

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