# Changelog

All notable changes to the LTVQuiz project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-10-15T22:35:00+07:00

### Added & Enhanced
- **Hệ thống Kho đề & Thư viện tài liệu hoàn chỉnh (Document & Question Library - "Kho đề")**:
  - **Mô hình dữ liệu thư viện đa cấp ([libraryTypes.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/shared/src/libraryTypes.ts))**:
    - Phân tách 3 loại tài nguyên riêng biệt: Tài liệu gốc (`source_document`), Bộ câu hỏi (`question_set`), và Đề kiểm tra (`exam`).
    - Hệ thống thư mục phân cấp đa tầng (`LibraryFolder`) có kiểm tra chống đệ quy lặp vô tận (`isDescendantOf`), bảo toàn ID ổn định khi đổi tên hoặc di chuyển.
    - Hỗ trợ lưu vết siêu dữ liệu: người sở hữu, ngày tạo, ngày cập nhật, dung lượng, định dạng tệp, cấu hình câu hỏi, và trạng thái xóa mềm.
  - **Dịch vụ lưu trữ và đồng bộ cục bộ ([libraryStorageService.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/services/libraryStorageService.ts))**:
    - Tích hợp chuẩn hóa tiếng Việt không dấu (`normalizeVietnamese`) giúp tìm kiếm tức thì cả khi gõ có dấu lẫn không dấu.
    - Hệ thống Thùng rác (`trash`) an toàn: xóa mềm (`deleteResource`, `deleteFolder`), khôi phục nguyên vẹn (`restoreResource`, `restoreFolder`) và dọn sạch vĩnh viễn (`permanentDeleteResource`, `emptyTrash`).
    - Đồng bộ tự động dữ liệu cũ (`syncExistingDataToLibrary`) từ `StorageService` giúp toàn bộ tài liệu và bài thi trước đây xuất hiện ngay trong Kho đề mà không bị trùng lặp.
  - **Dịch vụ nén và tải ZIP thư mục ([libraryZipService.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/services/libraryZipService.ts))**:
    - Tải xuống tài liệu đơn lẻ hoặc đóng gói toàn bộ nhiều tài nguyên đã chọn thành tệp ZIP chuẩn cấu trúc thư mục.
    - Làm sạch tên tệp (`sanitizeZipFileName`) phòng chống triệt để lỗ hổng path traversal (`../`) và ký tự cấm hệ điều hành.
  - **Giao diện Kho đề trung tâm ([LibraryPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/LibraryPage.tsx))**:
    - Thanh tiêu đề chuẩn nhận diện LTVQuiz: *"Kho đề - Lưu trữ, sắp xếp và quản lý tài liệu cùng các đề kiểm tra của bạn."*
    - Các tab điều hướng: *Tất cả tệp*, *Thư mục của tôi*, *Đã chia sẻ*, *Được chia sẻ với tôi*, *Thùng rác*.
    - Thanh công cụ mạnh mẽ: Tạo thư mục mới (`CreateFolderModal`), Tải tài liệu lên (`UploadLibraryModal`), Tìm kiếm có lọc theo loại, Sắp xếp (A-Z, mới nhất, dung lượng), Chuyển đổi lưới/danh sách (Grid/List), và Thao tác hàng loạt (Bulk Move, Bulk Download ZIP, Bulk Delete).
    - Thanh Breadcrumb tương tác duyệt thư mục con mượt mà.
  - **Liên kết chia sẻ bảo mật ([ShareLibraryModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/library/ShareLibraryModal.tsx), [LibraryShareViewerPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/LibraryShareViewerPage.tsx))**:
    - Sinh mã token ngẫu nhiên bảo mật cao (128-bit hex), hỗ trợ hạn dùng (24h, 7 ngày, 30 ngày, vĩnh viễn) và thu hồi bất cứ lúc nào.
    - Trang xem công khai `/share/library/:token` chỉ cấp quyền xem (viewer) an toàn, ẩn đáp án đúng để học sinh tự luyện tập, kèm các thông báo hết hạn hoặc thu hồi thân thiện.
  - **Tích hợp sâu với "Tài liệu có sẵn" và Trình soạn thảo**:
    - **Tạo đề thi ([CreateQuiz.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/CreateQuiz.tsx))**: Nâng cấp tab "Chọn từ Kho đề", bổ sung nút "Duyệt cây thư mục Kho đề" và cửa sổ chọn tài nguyên [SelectFromLibraryModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/library/SelectFromLibraryModal.tsx). Tự động nạp tài liệu gốc để bóc tách hoặc nạp trực tiếp bộ câu hỏi vào đề thi mà không cần trích xuất lại.
    - **Trình soạn thảo ([EditorPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/EditorPage.tsx))**: Bổ sung nút "Lưu vào Kho đề" và [SaveToLibraryModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/library/SaveToLibraryModal.tsx) cho phép lưu bộ câu hỏi đã sửa vào bất kỳ thư mục nào.

### Architectural Decisions
- Tận dụng kiến trúc lưu trữ hiện có (`localStorage` cho metadata và `IndexedDB` cho tệp nhị phân thông qua `StorageService`), tuyệt đối không giả mạo lưu trữ đám mây hoặc thêm mã Google Drive ngoài phạm vi yêu cầu.
- Toàn bộ ngôn ngữ hiển thị 100% tiếng Việt chuẩn mực, hỗ trợ gõ tìm kiếm tiếng Việt không dấu.

## [1.4.0] - 2026-10-15T22:45:00+07:00

### Added & Enhanced - Professional Dashboard UI Refinement
- **Hệ thống Design Tokens & CSS Variables chuẩn mực ([index.css](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/index.css))**:
  - Tinh giản bảng màu theo định hướng SaaS giáo dục cao cấp, trung tính, kiểm soát độ tương phản:
    - Light mode: Nền `var(--color-background)` mềm mại (`#f8fafc`), bề mặt thẻ `var(--color-surface)` trắng thuần (`#ffffff`), viền tinh tế `var(--color-border)` (`#e2e8f0`), chữ chủ đạo `#0f172a`, phụ `#64748b`, thương hiệu `#2563eb`.
    - Dark mode: Nền `#0b0f19`, bề mặt `#111827`, viền `#1f2937`, chữ `#f8fafc`.
  - Loại bỏ triệt để các hiệu ứng giả tạo (neon glow, glassmorphism dày đặc, góc bo lồng nhau, bóng mờ lòe loẹt).
  - Chuẩn hóa typography với `.tabular-nums` hỗ trợ căn chỉnh hoàn hảo các chỉ số thống kê, điểm số và số lượng.
  - Xây dựng tiện ích cốt lõi cho dashboard: `.dashboard-surface`, `.dashboard-card`, `.dashboard-input`, `.dashboard-table-header`, `.dashboard-table-row`.
- **Nâng cấp Hệ thống Component nền tảng ([Button.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Button.tsx), [Card.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Card.tsx), [Badge.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Badge.tsx))**:
  - Gỡ bỏ độ trễ ảo giả lập 700ms (`KahootLoader`) trong [Button.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Button.tsx) để toàn bộ tương tác trên dashboard phản hồi tức thì (zero artificial delay). Bổ sung đầy đủ biến thể chuẩn: `primary`, `secondary`, `outline`, `ghost`, `danger`.
  - [Card.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Card.tsx): Bo góc `rounded-xl`, viền mảnh `border-[var(--color-border)]`, bóng đổ thanh lịch `shadow-xs`.
  - [Badge.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Badge.tsx): Chuẩn hóa hệ thống nhãn trạng thái ngữ nghĩa (`default`, `success`, `warning`, `danger`, `primary`, `info`, `purple`) hỗ trợ hoàn chỉnh cả 2 chế độ sáng/tối.
- **Tái cấu trúc Sidebar & Header Dashboard ([Layout.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/Layout.tsx))**:
  - Phân nhóm điều hướng rõ ràng, mạch lạc:
    - *Không gian làm việc*: Tổng quan (`/dashboard`), Tạo đề thi (`/dashboard/create`), Quản lý bài thi (`/dashboard/quizzes`), Tài liệu & Thư viện (`/dashboard/documents`).
    - *Theo dõi & Báo cáo*: Kết quả thí sinh (`/dashboard/results`), Thống kê số liệu (`/dashboard/statistics`).
    - *Hệ thống*: Cài đặt (`/dashboard/settings`).
  - Active state tinh tế (viền xanh chỉ điểm bên trái, nền xanh nhạt, chữ đậm), thanh breadcrumb định vị ngữ cảnh tức thì, thẻ thông tin giáo viên `Phùng Tấn Đạt` cố định gọn gàng ở chân sidebar.
- **Tái thiết kế Trang Tổng quan Dashboard ([Dashboard.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/Dashboard.tsx))**:
  - Cụm 4 thẻ chỉ số KPI mật độ cao với số liệu thật từ localStorage (Tổng bài thi, Đã xuất bản, Bản nháp, Lượt nộp bài).
  - Hai bảng điều hành song song: "Bài kiểm tra gần đây" (thao tác Sửa, Xem báo cáo, Xuất Excel) và "Thí sinh làm bài gần đây" (điểm số, chuỗi câu đúng, trạng thái trung thực, tải kết quả cá nhân) kèm trạng thái rỗng trung thực (honest empty state).
- **Tái thiết kế Quản lý Bài thi ([ExamManagementPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/ExamManagementPage.tsx))**:
  - Khắc phục lỗi điều hướng tiềm ẩn (chuyển đổi route sửa bài từ `/edit/:id` chưa định nghĩa sang `/editor/:id` chuẩn xác).
  - Bổ sung thanh tìm kiếm nhanh, bộ lọc trạng thái dạng thẻ tab (Tất cả, Đã xuất bản, Bản nháp, Đã lưu trữ), bảng dữ liệu chuẩn SaaS hiển thị thời gian, số câu hỏi, lượt làm bài và menu thao tác đầy đủ.
- **Tái thiết kế Quản lý Tài liệu & Kho đề ([DocumentManagementPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/DocumentManagementPage.tsx), [LibraryPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/LibraryPage.tsx))**:
  - Loại bỏ các khối neon và icon rườm rà; thay thế bằng 4 thẻ chỉ số rõ ràng và dung lượng bộ nhớ khả dụng.
  - Bổ sung thanh thao tác hàng loạt (Bulk Selection) cho phép chọn nhiều tài liệu để xóa hoặc nén ZIP tải về.
  - Chuyển đổi linh hoạt giữa dạng lưới (grid) và danh sách (table), hỗ trợ lọc định dạng (PDF, DOCX, TXT).
- **Hoàn thiện Trang Kết quả & Thống kê ([ResultsPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/ResultsPage.tsx), [StatisticsPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/StatisticsPage.tsx))**:
  - Trang kết quả: Bảng thí sinh chi tiết với bộ lọc đề thi, chỉ báo gian lận trung thực, xuất CSV UTF-8 BOM.
  - Trang thống kê: 4 chỉ số hiệu suất, biểu đồ phân bổ phổ điểm dạng CSS Bar Chart thanh lịch, chính xác theo số liệu thực tế, bảng xếp hạng bài thi theo lượt nộp.
- **Trang Cài đặt Thống nhất ([SettingsPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/SettingsPage.tsx))**:
  - Đồng bộ giao diện cài đặt theo design token mới, căn lề thẳng hàng, các trường biểu mẫu và nút lưu rõ ràng.

### Architectural Decisions
- Toàn bộ cải tiến tập trung tại phân hệ Dashboard (`/dashboard/*`) và các thành phần chia sẻ được kiểm soát chặt chẽ để giữ nguyên vẹn 100% trang Landing Page (`/`), Hero section, stacked feature cards và interactive explorer.
- Không phát sinh thư viện UI bên ngoài; giữ vững kiến trúc thuần Vite + React + Tailwind 4 / `index.css` với hiệu suất tối ưu và 0 cảnh báo biên dịch TypeScript.

## [1.3.8] - 2026-10-15T22:12:00+07:00

### Added & Enhanced
- **Tích hợp Quy tắc AI Thinking 15s khi Tạo Flashcard ([FlashcardGeneratorModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardGeneratorModal.tsx), [flashcardThinkingHelper.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/flashcardThinkingHelper.ts), [aiFlashcardService.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/services/aiFlashcardService.ts))**:
  - **Quy tắc Sư phạm Cốt lõi (Rule 1)**: Thiết lập quy chuẩn AI: *Đọc hết toàn bộ tài liệu & phân tích Thinking chuyên sâu trong 15s trước khi xuất bản bộ thẻ Flashcard để xem lại lý thuyết và đặt các câu hỏi phản xạ*.
  - **Cập nhật AI System Prompt ([aiFlashcardService.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/services/aiFlashcardService.ts))**: Bổ sung chỉ thị nghiêm ngặt cho mô hình LLM về việc đọc toàn văn tài liệu, không bỏ sót định lý/công thức Toán-Lý-Hóa (chuẩn LaTeX `$E=mc^2$`), hệ thống hóa lý thuyết cho thẻ định nghĩa và tự động đặt câu hỏi gợi mở, bài tập tình huống cho thẻ hỏi đáp/trắc nghiệm.
  - **Quy trình Thinking Pipeline 15 giây ([flashcardThinkingHelper.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/flashcardThinkingHelper.ts))**:
    - Giai đoạn 1 (0-4s): Đọc hết toàn bộ tài liệu & phân tích cấu trúc tổng thể.
    - Giai đoạn 2 (5-9s): Deep Thinking: Hệ thống hóa lý thuyết, thuật ngữ cốt lõi & công thức.
    - Giai đoạn 3 (10-14s): Deep Thinking: Thiết lập bộ câu hỏi phản xạ & tư duy sâu.
    - Giai đoạn 4 (15s+): Tung bộ thẻ Flashcard 3D hoàn chỉnh.
  - **Giao diện Thinking trực quan (Live Progress & Countdown)**:
    - Hiển thị bảng tiến trình Thinking với icon [Brain](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardGeneratorModal.tsx) phát sáng, thanh tiến độ gradient đa sắc và đồng hồ đếm ngược trực tiếp `{thinkingSeconds}/15s`.
    - Bổ sung thẻ giới thiệu quy tắc sư phạm trước khi bấm tạo.

### Architectural Decisions
- Đồng bộ hóa bất đồng bộ (`Promise.all([generatePromise, thinkingFlow.promise])`) đảm bảo người dùng luôn trải nghiệm trọn vẹn quy trình Deep Thinking 15s ngay cả khi mạng hoặc mô hình phản hồi cực nhanh, đồng thời huỷ bỏ an toàn (`cancel()`) khi gặp lỗi.

## [1.3.7] - 2026-10-15T22:07:00+07:00

### Added & Enhanced
- **Cảnh báo mạng phản hồi chậm / Quá thời gian tải (Slow Loading Network Warning)**:
  - Bổ sung cơ chế tự động phát hiện tình trạng mạng kém hoặc tác vụ tải kéo dài quá 6 giây thông qua hook [useSlowLoadingNotice](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/loaderHelper.ts).
  - Tích hợp thông báo chữ đỏ nổi bật: `Nếu bị sự cố, vui lòng khởi động lại trang hoặc nhấn phím F5 trên bàn phím` kèm biểu tượng cảnh báo động [AlertCircle](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/KahootLoader.tsx).
  - Áp dụng trên toàn hệ thống:
    - Màn hình tải chính [KahootLoader.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/KahootLoader.tsx) (Học sinh vào bài/nộp bài, tải hệ thống ở Landing Page, xử lý tạo đề thi, nạp tài liệu). Bổ sung thêm nút hành động nhanh **"Khởi động lại ngay (F5)"** hỗ trợ tối đa cho học sinh/giáo viên sử dụng điện thoại và máy tính bảng không có bàn phím vật lý.
    - Cửa sổ tạo thẻ thông minh [FlashcardGeneratorModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardGeneratorModal.tsx) khi gọi AI Groq hoặc xử lý tài liệu lớn trong điều kiện đường truyền kém.
    - Màn hình chuẩn bị tài liệu xem trước [DocumentViewerPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/DocumentViewerPage.tsx).

### Architectural Decisions
- Đặt thời gian ngưỡng mặc định là 6000ms (`DEFAULT_LOADER_TIMEOUT_MS`) để tránh báo động giả khi hệ thống phản hồi bình thường (1-3s), chỉ hiển thị khi đường truyền người dùng thực sự gặp trở ngại, giúp trấn an người dùng và cung cấp lối thoát/cách xử lý tức thời.

## [1.3.6] - 2026-10-15T22:02:00+07:00

### Changed & Enhanced
- **Tối ưu hóa tỉ lệ & giao diện Tạo Flashcard chuyên nghiệp ([FlashcardGeneratorModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardGeneratorModal.tsx), [flashcardRatioHelper.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/flashcardRatioHelper.ts))**:
  - **Tỉ lệ vàng cho khung thoại (Modal Proportion)**: Thu gọn chiều rộng từ `max-w-2xl` (672px - dẹt ngang, trống trải) thành `max-w-[540px]` chuẩn tỉ lệ cân đối (~1:1.1), giúp popup tạo flashcard tập trung, vừa vặn trên cả laptop lẫn mobile mà không bị dàn trải.
  - **Tái thiết kế lựa chọn dạng thẻ (Card Type Selector)**: Thay thế lưới 3 cột ngang chật chội bằng danh sách thẻ xếp tầng cao cấp, tích hợp icon màu chuyên biệt (`BookOpen` tím cho Lý thuyết, `HelpCircle` xanh cho Hỏi-Đáp, `CheckCircle2` xanh lục cho Trắc nghiệm), nhãn phân loại rõ ràng và nút checkbox tròn trực quan.
  - **Thanh trực quan hóa tỉ lệ phân bổ (Distribution Ratio Preview Bar)**: Tự động tính toán và hiển thị thanh phân chia tỷ lệ phần trăm (segmented bar) cùng số lượng thẻ ước tính cho từng dạng đã chọn (VD: ~7 thẻ Khái niệm, ~7 thẻ Hỏi-Đáp, ~6 thẻ Trắc nghiệm với tổng 20 thẻ).
  - **Thiết kế lại bộ chọn số lượng thẻ (Card Count Selector)**: Chia 4 mức với số to rõ ràng, nhãn định hướng (`Nhanh`, `Chuẩn ⭐ - Khuyên dùng`, `Mở rộng`, `Toàn diện`) và thời gian học ước lượng (~3 phút, ~6 phút, ~10 phút, ~15 phút).
  - **Thẻ giới thiệu công nghệ AI & Công thức**: Thêm khối glassmorphic thông tin về công nghệ Groq LPU siêu tốc (~500 token/s) tự động trích xuất công thức Toán - Lý - Hóa (LaTeX) và mô hình 3D hai mặt.
  - **Cân bằng tỷ lệ trong AI Prompt ([aiFlashcardService.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/services/aiFlashcardService.ts))**: Cập nhật hàm `buildAiPrompt` để hướng dẫn AI phân bổ đồng đều số lượng thẻ theo đúng các dạng người dùng đã chọn.

### Architectural Decisions
- Tách logic phân bổ tỷ lệ thẻ thành mô-đun thuần túy [flashcardRatioHelper.ts](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/flashcardRatioHelper.ts) có test suite riêng biệt để đảm bảo tính toán luôn chính xác toán học 100%, không xảy ra sai lệch số thẻ.

## [1.3.5] - 2026-10-15T21:53:00+07:00

### Changed
- **Gỡ bỏ dòng mô tả phụ trong Banner chia sẻ ([ShareLinkBanner.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/ShareLinkBanner.tsx))**:
  - Gỡ bỏ dòng chữ in nghiêng *"Hiển thị tự động dưới link khi gửi qua Zalo, Messenger, Facebook"* phía dưới thẻ xem trước liên kết tài liệu theo yêu cầu người dùng.
  - Căn chỉnh lại cụm nút hành động (`Tải ảnh Banner`, `Sao chép kèm Banner`, `Chia sẻ`) gọn gàng sang bên phải.

## [1.3.4] - 2026-10-15T21:52:00+07:00

### Changed & Fixed
- **Loại bỏ khối cấu hình 5 luồng Groq API khỏi giao diện Tạo Flashcard ([FlashcardGeneratorModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardGeneratorModal.tsx))**:
  - Gỡ bỏ hoàn toàn bảng quản lý 5 luồng API, tab chuyển đổi luồng và ô nhập khóa API khỏi màn hình người dùng theo yêu cầu.
  - Tự động hóa 100% việc kết nối AI ngầm: hệ thống tự động đọc khóa từ `.env` (`VITE_GROQ_API_KEY_1..5`) hoặc bộ nhớ đã lưu để gọi Groq LPU Llama 3.3 70B siêu tốc (~500 tps).
  - Tự động chuyển đổi (fallback) sang bộ máy phân tích nội bộ nếu chưa có API key mà không gây lỗi chặn người dùng.
- **Khắc phục lỗi hiển thị & lật thẻ 3D Flashcard ([FlashcardStudyModal.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/flashcard/FlashcardStudyModal.tsx), [index.css](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/index.css))**:
  - Gỡ bỏ `transform: translate3d(0,0,0)` trong `.backface-hidden` tránh xung đột ma trận GPU làm xuyên thấu nội dung 2 mặt thẻ.
  - Sử dụng nền đặc (`opaque`) và cơ chế quản lý trạng thái hiển thị (`opacity-0` / `pointer-events-none`) cho mặt đang ẩn, ngăn chặn hoàn toàn hiện tượng bóng mờ và thao tác nhầm.
  - Tích hợp [RichText](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/components/RichText.tsx) (KaTeX/mhchem) giúp công thức Toán, Lý, Hóa học hiển thị đẹp mắt, chuẩn khoa học.
  - Tối ưu lại thanh điều khiển chân thẻ thành 3 nhóm linh hoạt, chống vỡ dòng và tràn nút trên thiết bị di động/laptop.

### Architectural Decisions
- Ẩn chi tiết kỹ thuật (API keys, quota, slots) khỏi UI người dùng thông thường để giữ giao diện tối giản và thân thiện, chuyển toàn bộ việc quản lý kết nối Groq về tầng dịch vụ nền.

## [1.3.3] - 2026-10-15T18:54:00+07:00

### Fixed
- **Khắc phục lỗi đè chữ của nút "Xóa bộ nhớ" (KPI Storage Card Layout Fix)**:
  - Tái cấu trúc 4 thẻ thống kê KPI trong [DocumentManagementPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/DocumentManagementPage.tsx) sang bố cục 2 tầng hiện đại (`flex flex-col justify-between`):
    - **Tầng trên (Top row)**: Icon phân loại bên trái và nút hành động tác vụ "Xóa bộ nhớ" độc lập ở góc trên bên phải.
    - **Tầng dưới (Bottom row)**: Chỉ số dung lượng (`991.6 KB`) và nhãn mô tả (`Dung lượng bộ nhớ`) sở hữu 100% chiều rộng của thẻ.
  - Loại bỏ hoàn toàn tình trạng nút "Xóa bộ nhớ" đè lên con số dung lượng hoặc nhãn văn bản ở mọi độ phân giải màn hình.

### Architectural Decisions
- Chuyển từ bố cục ngang đơn lẻ (`flex items-center justify-between`) sang bố cục 2 tầng (`flex flex-col`) cho thẻ KPI giúp tách biệt rõ ràng khu vực hiển thị số liệu và khu vực thao tác hành động, loại bỏ hiện tượng tràn viền (flex overflow collision) khi chia 4 cột trên desktop.

## [1.3.2] - 2026-10-15T18:18:00+07:00

### Changed
- **Tối ưu hóa bố cục Lưới thẻ tài liệu & Flashcard (Grid Cards View)**:
  - Điều chỉnh cấu hình lưới từ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5` thành `grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 min-[1800px]:grid-cols-4 gap-4.5 sm:gap-5` trong [DocumentManagementPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/DocumentManagementPage.tsx).
  - Tăng chiều rộng ô thẻ từ ~210px-260px (dạng ô vuông chật chội) lên ~350px-400px (dạng thẻ chữ nhật dài, thoáng và sang trọng).
  - Khắc phục triệt để hiện tượng chữ "Chia sẻ" bị ngắt thành 2 dòng ("Chia" trên "sẻ" dưới) nhờ bổ sung `whitespace-nowrap` và `shrink-0` cho các nút tác vụ chân thẻ.
  - Đồng bộ tỉ lệ mở rộng tương tự cho tab "Kho Flashcard 3D" để giao diện thống nhất, liền mạch.

### Architectural Decisions
- Giới hạn số cột hiển thị tối đa trên màn hình laptop/desktop thông dụng từ 4–5 cột xuống 3 cột, giúp tận dụng không gian ngang, loại bỏ khoảng trống thừa và mang lại tỉ lệ vàng cho các thẻ tài liệu.

## [1.3.1] - 2026-10-15T18:12:00+07:00

### Added
- **Quản lý chọn nhiều & Xóa dung lượng bộ nhớ**:
  - Bổ sung nút **"Xóa bộ nhớ"** trực tiếp trên thẻ thống kê "Dung lượng bộ nhớ" trong trang Quản lý tài liệu ([DocumentManagementPage.tsx](file:///c:/Users/Admin/Desktop/12-4-ltvquiz/packages/web/src/pages/DocumentManagementPage.tsx)), cho phép người dùng giải phóng ngay lập tức toàn bộ tài liệu và đưa dung lượng về 0 KB.
  - Bổ sung thanh công cụ thao tác hàng loạt (Batch Action Toolbar) với tính năng **Chọn tất cả**, đếm số lượng tài liệu đã chọn và tính toán dung lượng sẽ giải phóng trong thời gian thực.
  - Bổ sung ô tích chọn (checkbox) trên từng tài liệu ở cả 2 chế độ hiển thị: Lưới thẻ (Grid view) và Danh sách (List view) kèm viền sáng trực quan khi được chọn.
  - Tích hợp các hàm `StorageService.deleteDocuments` và `StorageService.clearAllDocuments` giúp xóa sạch tệp nhị phân trong IndexedDB lẫn các bản ghi đính kèm trong LocalStorage.

### Architectural Decisions
- Đảm bảo giải phóng bộ nhớ triệt để bằng cách xóa dữ liệu đồng bộ cả trong LocalStorage và IndexedDB blob store.

## [1.3.0] - 2026-10-15T18:00:00+07:00

### Added
- **Xuất kết quả bài thi dạng Excel theo từng học sinh**:
  - Tích hợp hàm `generateStudentResultCsv` và `exportStudentResultToCsv` với UTF-8 BOM (`\uFEFF`) giúp Microsoft Excel trên Windows/macOS mở trực tiếp không bị lỗi font tiếng Việt.
  - Báo cáo kết quả chi tiết từng học sinh gồm: Thông tin thí sinh (Họ tên, lớp), tổng điểm, tỷ lệ %, chuỗi streak, trạng thái giám sát chống gian lận, và bảng đối chiếu từng câu hỏi (nội dung câu hỏi, câu trả lời thí sinh, đáp án đúng, đánh giá Đúng/Sai, điểm đạt).
  - Nút "Xuất Excel" trực tiếp trên từng dòng thí sinh tại trang Kết quả thi (`/dashboard/results`), Báo cáo đề thi (`/report/:id`), và danh sách làm bài gần đây tại Tổng quan phòng thi (`/dashboard`).
  - Nút "Xuất Excel danh sách / toàn bộ" cho giáo viên xuất nhanh toàn bộ thí sinh.
- **Tùy chọn mật mã phòng thi (Passcode Protection)**:
  - Bổ sung trường `accessPassword?: string;` vào `QuizSettings` tại `@ltvquiz/shared`.
  - Cung cấp toggle và input nhập mật mã tại `PublishModal` (khi xuất bản) và `QuizSettingsDrawer` (trong thanh cài đặt đề thi).
  - Hỗ trợ xem/ẩn mật mã và nút "Sao chép link & mã" tiện lợi cho giáo viên chia sẻ lên Zalo/Messenger/Classroom.
  - Cổng bảo mật tại `StudentQuizPage`: Kiểm tra mật mã phòng thi trước khi mở đề và tính giờ. Giao diện thông báo lỗi nếu nhập sai mật mã và lưu phiên làm bài vào `sessionStorage`.

### Architectural Decisions
- Sử dụng chuẩn CSV với UTF-8 BOM (`\uFEFF`) thay vì thư viện bên ngoài nặng nề, đảm bảo tương thích 100% với Microsoft Excel, tốc độ tạo tức thì và không làm phình kích thước bundle.
- Mật mã phòng thi được xác thực ở phía client với trạng thái phiên lưu trong `sessionStorage` để bảo vệ chống gian lận trong khi cho phép học sinh tải lại trang nếu mạng chập chờn mà không bị khóa bài.
