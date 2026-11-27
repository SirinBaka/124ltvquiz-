export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: "mau-1",
    name: "Mẫu 1",
    description: "Trắc nghiệm chuẩn 4 lựa chọn A-B-C-D với * là đáp án đúng",
    content: `[!b:$PHẦN I: TRẮC NGHIỆM KHÁCH QUAN$]
Câu 1. [!b:$Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam là:$]
*A. Hà Nội
B. Thành phố Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ

Câu 2. [!b:$Số nào sau đây là số nguyên tố chẵn duy nhất?$]
A. 0
*B. 2
C. 4
D. 6

Câu 3. [!b:$Hành tinh nào gần Mặt Trời nhất trong Hệ Mặt Trời?$]
*A. Sao Thủy (Mercury)
B. Sao Kim (Venus)
C. Trái Đất (Earth)
D. Sao Hỏa (Mars)`
  },
  {
    id: "mau-2",
    name: "Mẫu 2",
    description: "Toán học & Công thức KaTeX ($...$)",
    content: `[!b:$PHẦN I: TOÁN HỌC VÀ CÔNG THỨC$]
Câu 1. [!b:$Cho hàm số $y = f(x)$ xác định trên $\\mathbb{R}$. Đạo hàm của hàm số $y = x^3 - 3x + 1$ là:$]
*A. $y' = 3x^2 - 3$
B. $y' = 3x^2 + 3$
C. $y' = x^2 - 3$
D. $y' = 3x^2 - 1$

Câu 2. [!b:$Nghiệm của phương trình $\\log_2(x - 1) = 3$ là:$]
A. $x = 7$
*B. $x = 9$
C. $x = 8$
D. $x = 10$

Câu 3. [!b:$Giá trị tích phân $I = \\int_{0}^{1} (2x + 1)\\,dx$ bằng:$]
*A. 2
B. 1
C. 3
D. 4`
  },
  {
    id: "mau-3",
    name: "Mẫu 3 (Có điền từ)",
    description: "Câu hỏi điền khuyết / Điền từ vào chỗ trống",
    content: `[!b:$PHẦN I: CÂU HỎI ĐIỀN KHUYẾT$]
Câu 1. [!b:$Điền từ thích hợp vào chỗ trống: "Nước sôi ở nhiệt độ [...] độ C ở điều kiện áp suất khí quyển tiêu chuẩn."$]
A. 80
B. 90
*C. 100
D. 120

Câu 2. [!b:$Điền từ vào định luật bảo toàn: "Năng lượng không tự nhiên sinh ra cũng không tự nhiên mất đi, nó chỉ [...] từ dạng này sang dạng khác."$]
*A. chuyển hóa
B. phân hủy
C. biến mất
D. ngưng tụ`
  },
  {
    id: "mau-4",
    name: "Mẫu 4",
    description: "Đoạn văn đọc hiểu & Phân tích ngữ liệu",
    content: `[!b:$PHẦN I: ĐỌC HIỂU NGỮ LIỆU$]
Câu 1. [!b:$Đọc đoạn trích: "Tre giữ làng, giữ nước, giữ mái nhà tranh, giữ đồng lúa chín." Biện pháp tu từ nổi bật trong câu văn là gì?$]
A. So sánh và nhân hóa
*B. Điệp từ ngữ kết hợp liệt kê
C. Ẩn dụ chuyển đổi cảm giác
D. Hoán dụ lấy bộ phận chỉ toàn thể

Câu 2. [!b:$Đoạn văn trên được trích từ tác phẩm nào dưới đây?$]
*A. Cây tre Việt Nam (Thép Mới)
B. Lặng lẽ Sa Pa (Nguyễn Thành Long)
C. Mùa xuân nho nhỏ (Thanh Hải)
D. Chiếc lược ngà (Nguyễn Quang Sáng)`
  },
  {
    id: "mau-5",
    name: "Mẫu 5 (Có câu Đúng-Sai)",
    description: "Câu hỏi Đúng / Sai 4 ý (a, b, c, d)",
    content: `[!b:$PHẦN II: CÂU HỎI ĐÚNG - SAI$]
Câu 1. [!b:$Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$. Xét tính Đúng / Sai của các khẳng định sau:$]
*a. $SA \\perp BC$
*b. $BC \\perp (SAB)$
c. $BD \\perp (SAC)$ và độ dài $BD = 2a$
*d. Thể tích của khối chóp $S.ABCD$ bằng $\\frac{a^3\\sqrt{2}}{3}$`
  },
  {
    id: "mau-6",
    name: "Mẫu 6 (Tổng hợp)",
    description: "Đề thi mẫu Công nghệ 12 theo chuẩn Azota",
    content: `[!b:$PHẦN I$]
Câu 1. [!b:$ Công việc của một kĩ sư thiết kế điện là$]
A. thi công, lắp đặt thiết bị điện từ các thiết bị rời rạc theo hồ sơ thiết kế.
*B. thiết kế sơ đồ mạch điện và các tài liệu kĩ thuật mô tả có liên quan.
C. sửa chữa thiết bị điện khi phát hiện có hỏng hóc hoặc sự cố trong hệ thống điện.
D. chế tạo thiết bị điệntừ các vật liệu, linh kiện ban đầu theo quy trình sản xuất.
Câu 2. [!b:$ Trong trường hợp tủ điện phân phối tổng bị hỏng, điều gì sẽ xảy ra?$]
A. Chỉ có các thiết bị điện gần tủ điện phân phối tổng bị ảnh hưởng
B. Các tủ điện phân phối khu vực và hộ gia đình vẫn hoạt động bình thường
C. Các tủ điện phân phối khu vực sẽ nhận điện trực tiếp từ lưới điện phân phối
*D. Toàn bộ mạng điện sẽ ngừng hoạt động
Câu 3. [!b:$Sản xuất điện là$]
*A. chuyển đổi các dạng năng lượng khác nhau thành năng lượng điện
B. đưa điện từ nguồn (nhà máy điện) tới nơi tiêu thụ thông qua lưới điện
C. nghiên cứu, thiết kế, chế tạo, sử dụng các thiết bị điện và các bộ điều khiển để biến đổi điện năng thành các dạng năng lượng khác phục vụ sản xuất và đời sống
D. nghiên cứu, chế tạo các loại vật liệu composite thích hợp để làm dây dẫn điện`
  }
];
