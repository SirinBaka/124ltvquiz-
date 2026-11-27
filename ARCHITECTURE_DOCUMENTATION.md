# Kiến Trúc Hệ Thống LTVQuiz

## 1. Tổng quan
LTVQuiz là nền tảng luyện thi và khảo sát đánh giá trắc nghiệm dành cho giáo viên và học sinh.
Kiến trúc dự án bao gồm:
- **`@ltvquiz/shared`**: Định nghĩa cấu trúc dữ liệu (`Quiz`, `Question`, `Attempt`, `QuizSettings`, parser văn bản).
- **`@ltvquiz/web`**: Ứng dụng web React + TypeScript + Tailwind CSS / Vanilla CSS, quản lý thi, giám sát thi trực tuyến, báo cáo và xuất bản.

## 2. Các luồng xử lý mới (v1.3.0)

### 2.1. Bảo mật phòng thi bằng Mật mã (Passcode Gate)
1. Giáo viên kích hoạt "Mật mã phòng thi (Passcode)" khi chỉnh sửa hoặc xuất bản bài thi.
2. `QuizSettings.accessPassword` được lưu kèm dữ liệu đề thi.
3. Khi học sinh truy cập `/test/:id`, `StudentQuizPage` kiểm tra `accessPassword`.
4. Nếu có mật mã và chưa được mở khóa trong phiên:
   - Hiển thị cổng xác thực (Passcode Gate).
   - Kiểm tra `validateAccessPassword`.
   - Nếu chính xác: Lưu cờ mở khóa vào `sessionStorage` và bắt đầu hiển thị câu hỏi + tính giờ.

### 2.2. Xuất kết quả bài thi cá nhân dạng Excel (.CSV UTF-8 BOM)
1. Giáo viên hoặc quản trị viên nhấn "Xuất Excel" trên từng dòng học sinh ở Dashboard hoặc Kết quả thi.
2. `generateStudentResultCsv` được gọi với thông tin `Attempt` và `Quiz`.
3. Tạo nội dung với tiền tố `\uFEFF` UTF-8 BOM, đảm bảo mở trực tiếp trên Excel hiển thị đầy đủ dấu tiếng Việt.
4. Trình duyệt tải xuống file kết quả chi tiết từng học sinh kèm bảng đối chiếu câu trả lời.

## 3. Kiến trúc Kho đề & Thư viện tài liệu (Kho đề - v1.4.0)

### 3.1. Phân loại 3 thực thể tài nguyên
- **Tài liệu gốc (`source_document` / `document`)**: Tệp nhị phân gốc (PDF, DOCX, TXT, MD) lưu trong IndexedDB và metadata trong localStorage. Dùng để trích xuất đề thi hoặc tải về máy.
- **Bộ câu hỏi (`question_set`)**: Tập hợp các câu hỏi trắc nghiệm đã trích xuất/chỉnh sửa, lưu kèm các công thức toán KaTeX và dữ liệu phương án. Có thể tái sử dụng trực tiếp để tạo đề thi mới mà không cần parse lại tệp nhị phân.
- **Đề kiểm tra (`exam`)**: Đề thi đã hoàn chỉnh hoặc xuất bản, bảo toàn các cấu hình trộn đề, giới hạn thời gian và quy chế thi.

### 3.2. Cấu trúc thư mục & Thuật toán chống chu trình (Folder Hierarchy & Cycle Prevention)
- Mỗi `LibraryFolder` mang ID ổn định (UUID prefix), tên hiển thị, màu sắc và `parentId`.
- Thuật toán `isDescendantOf(folderId, ancestorId)` duyệt ngược cây thư mục để ngăn chặn tuyệt đối việc di chuyển một thư mục vào chính nó hoặc vào thư mục con cháu của nó.
- Đổi tên thư mục chỉ cập nhật thuộc tính `name` và `updatedAt`, không làm thay đổi ID hay ảnh hưởng tới các tài nguyên bên trong.

### 3.3. Cơ chế Xóa mềm & Thùng rác (Soft Delete & Trash System)
- Khi người dùng xóa tài nguyên hoặc thư mục, trường `deletedAt` được gán mốc thời gian ISO hiện tại (`deletedAt = new Date().toISOString()`).
- Các tài nguyên bị xóa mềm sẽ tự động ẩn khỏi giao diện bình thường và hiển thị trong tab **Thùng rác**.
- Chức năng khôi phục (`restoreResource`, `restoreFolder`) phục hồi tài nguyên về thư mục cũ; nếu thư mục cha đã bị xóa vĩnh viễn, tài nguyên tự động chuyển về gốc Kho đề (`parentId = null`) để tránh mồ côi.

### 3.4. Chia sẻ bảo mật (Cryptographic Share Token)
- Tạo liên kết chia sẻ công khai an toàn qua `/share/library/:token` với token ngẫu nhiên bảo mật 128-bit hex.
- Hỗ trợ thời hạn tự động (24h, 7 ngày, 30 ngày) và thu hồi tức thì (`revokedAt`).
- Chế độ xem công khai bảo vệ bản quyền: học sinh xem câu hỏi để tự luyện mà không bị lộ đáp án đúng của giáo viên.

### 3.5. Tích hợp sâu hai chiều
- **CreateQuiz**: Cho phép duyệt thư mục Kho đề để bóc tách tài liệu hoặc nạp thẳng bộ câu hỏi vào đề thi.
- **EditorPage**: Cho phép giáo viên sau khi chỉnh sửa câu hỏi bấm "Lưu vào Kho đề" để phân loại vào thư mục chỉ định.

### 3.6. Xem trước tài nguyên trực tiếp qua Button (Interactive Resource Preview)
- **Nút xem trước trực quan**: Tích hợp nút xem trước chuyên biệt (nút "Xem chi tiết" ở chế độ Grid và nút biểu tượng `Eye` ở chế độ List) cho tất cả các thực thể tài nguyên (tài liệu gốc, bộ câu hỏi, đề kiểm tra).
- **Hộp thoại xem trước `LibraryResourcePreviewModal`**:
  - Hiển thị metadata đầy đủ (định dạng, kích cỡ tệp, ngày tạo).
  - Kết xuất trực tiếp nội dung chi tiết kèm công thức Toán KaTeX và danh sách đáp án.
  - Tích hợp các nút hành động nhanh: tải xuống tệp nhị phân gốc, mở chế độ đọc chuyên sâu (`/document-viewer/:id`) hoặc chuyển hướng sang làm bài thi thử nghiệm.

## 4. Kiến trúc Giao diện Dashboard Chuyên nghiệp (Dashboard UI Refinement)

### 4.1. Hệ thống Design Tokens & CSS Variables
- **Màu nền & Bề mặt**: Phân định rõ ràng giữa nền tổng thể (`--color-background`: `#f8fafc` light / `#0b0f19` dark) và bề mặt thẻ (`--color-surface`: `#ffffff` light / `#111827` dark).
- **Đường viền & Bóng mờ**: Sử dụng viền mảnh trung tính (`--color-border`: `#e2e8f0` light / `#1f2937` dark) cùng bóng đổ siêu nhẹ (`shadow-xs`), loại bỏ bóng mờ phát sáng hoặc viền neon.
- **Typography & Chữ số**: Tích hợp class tiện ích `.tabular-nums` (`font-variant-numeric: tabular-nums`) cho tất cả các thẻ số liệu KPI, thời gian và bảng điểm giúp thẳng hàng cột số khi so sánh.
- **Tiện ích Dashboard chuẩn hóa**: `.dashboard-surface`, `.dashboard-card`, `.dashboard-input`, `.dashboard-table-header`, `.dashboard-table-row`.

### 4.2. Cấu trúc Điều hướng & Layout
- **Sidebar**: Phân nhóm 3 khu vực chức năng trực quan:
  - *Không gian làm việc*: Tổng quan (`/dashboard`), Tạo đề thi (`/dashboard/create`), Quản lý bài thi (`/dashboard/quizzes`), Tài liệu & Thư viện (`/dashboard/documents`).
  - *Theo dõi & Báo cáo*: Kết quả thí sinh (`/dashboard/results`), Thống kê số liệu (`/dashboard/statistics`).
  - *Hệ thống*: Cài đặt (`/dashboard/settings`).
- **Footer Sidebar**: Khu vực hồ sơ giáo viên gọn gàng, định danh tác giả `Phùng Tấn Đạt`.
- **Thanh đỉnh (Topbar)**: Hiển thị breadcrumb định vị ngữ cảnh, nút truy cập nhanh thư viện và chuyển đổi Dark/Light mode tức thời.
- **Nguyên tắc Bảo tồn**: Giữ nguyên vẹn 100% trang chủ Landing Page (`/`), Hero section, stacked feature cards và interactive explorer.
