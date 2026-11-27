import { AdvancedDocumentParser } from './AdvancedDocumentParser';
import { describe, it, expect } from 'vitest';

describe('AdvancedDocumentParser', () => {
  it('parses a basic multiple choice question (Test 1)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Nội dung? Đáp án: A

A. Một
B. Hai
C. Ba
D. Bốn
    `;

    const questions = parser.parse(content);
    
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('multiple_choice');
    expect(questions[0].question[0].content).toBe('Nội dung?');
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[0].content[0].content).toBe('Một');
    expect(questions[0].validation.status).toBe('valid');
  });

  it('parses questions with parentheses markers (Test 2)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1: Nội dung?

A) Một
B) Hai
C) Ba
D) Bốn
    `;

    const questions = parser.parse(content);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[3].label).toBe('D');
  });

  it('parses questions without "Câu" (Test 3)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
1. Nội dung?

A. Một
B. Hai
C. Ba
D. Bốn
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].question[0].content).toBe('Nội dung?');
  });

  it('parses multi-line questions (Test 4)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Cho hàm số f(x) xác định trên R.
Biết rằng f'(x) > 0 với mọi x thuộc R.
Mệnh đề nào sau đây đúng?

A. Hàm số đồng biến trên R.
B. Hàm số nghịch biến trên R.
C. Hàm số không đổi trên R.
D. Không thể kết luận.
    `;

    const questions = parser.parse(content);
    expect(questions[0].question[0].content).toContain("Mệnh đề nào sau đây đúng?");
    expect(questions[0].question[0].content).toContain("Biết rằng");
  });

  it('parses multi-line options (Test 5)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Hỏi gì đó?

A. Dòng 1
Dòng 2
B. Dòng B
C. Dòng C
D. Dòng D
    `;

    const questions = parser.parse(content);
    expect(questions[0].options[0].content[0].content).toContain("Dòng 1");
    expect(questions[0].options[0].content[0].content).toContain("Dòng 2");
  });

  it('parses inline options (Test 6)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `Câu 1. Hỏi gì đó? A. Đáp A B. Đáp B C. Đáp C D. Đáp D`;
    const questions = parser.parse(content);
    
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[0].content[0].content).toBe('Đáp A');
    expect(questions[0].options[3].label).toBe('D');
    expect(questions[0].options[3].content[0].content).toBe('Đáp D');
  });

  it('parses separate answer section (Test 7)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Hỏi?
A. A
B. B
C. C
D. D

ĐÁP ÁN
1. B
    `;
    const questions = parser.parse(content);
    
    expect(questions[0].correctAnswer.length).toBeGreaterThan(0);
    // Find the option labeled B
    const correctOpt = questions[0].options.find(o => o.label === 'B');
    expect(questions[0].correctAnswer[0]).toBe(correctOpt?.id);
  });

  it('flags warning when missing an option (Test 10)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 2. Missing option C?
A. Option A
B. Option B
D. Option D
    `;

    const questions = parser.parse(content);
    
    expect(questions).toHaveLength(1);
    expect(questions[0].validation.status).toBe('warning');
    expect(questions[0].options).toHaveLength(3);
  });

  it('correctly ignores exam header preamble before Câu 1 (Test 11)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI
TRƯỜNG THPT CHUYÊN HÀ NỘI
ĐỀ THI THỬ TỐT NGHIỆP THPT NĂM 2026
MÃ ĐỀ: 101

Câu 1. Thủ đô của Việt Nam là gì?
A. Hà Nội
B. Huế
C. Đà Nẵng
D. TP Hồ Chí Minh
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].question[0].content).toBe('Thủ đô của Việt Nam là gì?');
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].content[0].content).toBe('Hà Nội');
  });

  it('parses grid table answers correctly (Test 12)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Câu 1?
A. 1A
B. 1B
C. 1C
D. 1D

Câu 2. Câu 2?
A. 2A
B. 2B
C. 2C
D. 2D

BẢNG ĐÁP ÁN
1  2
B  C
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(2);
    const q1B = questions[0].options.find(o => o.label === 'B');
    const q2C = questions[1].options.find(o => o.label === 'C');
    expect(questions[0].correctAnswer[0]).toBe(q1B?.id);
    expect(questions[1].correctAnswer[0]).toBe(q2C?.id);
  });

  it('recognizes options in red as the correct answers (Test 13)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Hàm số nào sau đây đồng biến trên R?
A. y = x^2
[RED]B. y = 2x + 1[/RED]
C. y = -x + 3
D. y = 1/x

Câu 2. Đâu là thủ đô của Pháp?
A. London
B. Berlin
<span style="color: red">C. Paris</span>
D. Rome
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(2);
    
    // Question 1: Option B was in [RED]
    const q1B = questions[0].options.find(o => o.label === 'B');
    expect(questions[0].correctAnswer).toEqual([q1B?.id]);
    expect(questions[0].options[1].content[0].content).toBe('y = 2x + 1'); // clean text

    // Question 2: Option C was in red style
    const q2C = questions[1].options.find(o => o.label === 'C');
    expect(questions[1].correctAnswer).toEqual([q2C?.id]);
    expect(questions[1].options[2].content[0].content).toBe('Paris'); // clean text
  });

  it('recognizes 2025-2026 exam sections: Phần I, Phần II, Phần III (Test 14)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.
Câu 1. Nguyên hàm của hàm số f(x) = 2x là?
A. x^2 + C
B. 2x^2 + C
C. x + C
D. 2 + C

PHẦN II. Câu trắc nghiệm đúng sai.
Câu 2. Cho hình chóp S.ABCD có đáy là hình vuông.
a) SA vuông góc với đáy.
b) AC vuông góc với BD.
c) Tam giác SBC là tam giác đều.
d) Thể tích khối chóp là 1/3.
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(2);
    expect(questions[0].type).toBe('multiple_choice');
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');

    expect(questions[1].type).toBe('true_false_multiple');
    expect(questions[1].options).toHaveLength(4);
    expect(questions[1].options[0].label).toBe('a');
    expect(questions[1].options[1].label).toBe('b');
  });

  it('recognizes underline, bold, and asterisk marked correct answers (Test 15)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Đâu là kim loại nhẹ nhất?
[UNDERLINE]A. Li[/UNDERLINE]
B. Na
C. K
D. Cs

Câu 2. Chất nào là chất điện li mạnh?
A. CH3COOH
*B. HCl
C. H2O
D. HF

Câu 3. Công thức tính diện tích hình tròn bán kính R?
A. S = 2*pi*R
B. S = 4*pi*R^2
[BOLD]C. S = pi*R^2[/BOLD]
D. S = pi*R
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(3);

    // Q1: Option A underlined
    const q1A = questions[0].options.find(o => o.label === 'A');
    expect(questions[0].correctAnswer).toEqual([q1A?.id]);
    expect(questions[0].options[0].content[0].content).toBe('Li');

    // Q2: Option B has asterisk
    const q2B = questions[1].options.find(o => o.label === 'B');
    expect(questions[1].correctAnswer).toEqual([q2B?.id]);
    expect(questions[1].options[1].content[0].content).toBe('HCl');

    // Q3: Option C is bold
    const q3C = questions[2].options.find(o => o.label === 'C');
    expect(questions[2].correctAnswer).toEqual([q3C?.id]);
    expect(questions[2].options[2].content[0].content).toBe('S = pi*R^2');
  });

  it('recognizes True/False answers with format 1: Đ S Đ S (Test 16)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Xét các mệnh đề sau:
a) 2 là số nguyên tố.
b) 4 là số nguyên tố.
c) 6 là số chẵn.
d) 9 là số chẵn.

BẢNG ĐÁP ÁN
1: Đ S Đ S
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].type).toBe('true_false_multiple');
    const optA = questions[0].options.find(o => o.label === 'a');
    const optB = questions[0].options.find(o => o.label === 'b');
    const optC = questions[0].options.find(o => o.label === 'c');
    const optD = questions[0].options.find(o => o.label === 'd');

    // a is True (Đ), b is False (S), c is True (Đ), d is False (S)
    expect(questions[0].correctAnswer).toContain(optA?.id);
    expect(questions[0].correctAnswer).not.toContain(optB?.id);
    expect(questions[0].correctAnswer).toContain(optC?.id);
    expect(questions[0].correctAnswer).not.toContain(optD?.id);
  });

  it('filters page header/footer noise out of question text (Test 17)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Giá trị của 2 + 2 là?
Trang 1/5 - Mã đề thi 102
A. 1
B. 2
C. 3
D. 4
    `;

    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].question[0].content).not.toContain('Trang 1/5');
    expect(questions[0].question[0].content).not.toContain('Mã đề thi 102');
  });

  it('parses multi-column options on the same line (Test 18)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Tìm x biết x + 1 = 2.
A. x = 1        B. x = 2
C. x = 3        D. x = 4
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[1].label).toBe('B');
    expect(questions[0].options[2].label).toBe('C');
    expect(questions[0].options[3].label).toBe('D');
  });

  it('parses circle option markers (Test 19)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Cho hàm số y = f(x).
Ⓐ 1
Ⓑ 2
Ⓒ 3
Ⓓ 4
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].label).toBe('A');
    expect(questions[0].options[3].label).toBe('D');
  });

  it('extracts trailing explanation and sets correct answer from Lời giải (Test 20)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Tính 5 + 5.
A. 8
B. 10
C. 12
D. 15
Lời giải chi tiết: Ta có 5 + 5 = 10. Chọn B.
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].options[3].content[0].content).toBe('15');
    const optB = questions[0].options.find(o => o.label === 'B');
    expect(questions[0].correctAnswer).toContain(optB?.id);
  });

  it('parses Azota format with section header and asterisk correct answers (Test 21)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
[!b:$PHẦN I$]
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
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(2);
    expect(questions[0].sectionTitle).toBe('PHẦN I');
    expect(questions[0].options).toHaveLength(4);
    const q1B = questions[0].options.find(o => o.label === 'B');
    expect(questions[0].correctAnswer).toEqual([q1B?.id]);
    expect(questions[0].validation.status).toBe('valid');

    expect(questions[1].sectionTitle).toBe('PHẦN I');
    const q2D = questions[1].options.find(o => o.label === 'D');
    expect(questions[1].correctAnswer).toEqual([q2D?.id]);
    expect(questions[1].validation.status).toBe('valid');
  });

  it('extracts images with multiline alt text, escaped base64 +, underscores, and <img> attribute orders (Test 22)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Quan sát đồ thị dưới đây:
![Đồ thị hàm số
Dòng thứ hai](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg\\+Test\\_Val==)
Tính giá trị cực đại?
A. <img alt="Đồ thị A" src="https://example.com/a__1.png">
B. ![opt B](data:image/jpeg;base64,/9j/4AAQ\\+SkZJRg==)
C. 2
D. 3
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);

    const qBlocks = questions[0].question;
    const imgBlock = qBlocks.find(b => b.type === 'image');
    expect(imgBlock).toBeDefined();
    expect(imgBlock?.content).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg+Test_Val==');
    expect(qBlocks.some(b => b.type === 'text' && b.content.includes('Tính giá trị cực đại'))).toBe(true);

    const optAImg = questions[0].options[0].content.find(b => b.type === 'image');
    expect(optAImg?.content).toBe('https://example.com/a__1.png');
    expect(optAImg?.alt).toBe('Đồ thị A');

    const optBImg = questions[0].options[1].content.find(b => b.type === 'image');
    expect(optBImg?.content).toBe('data:image/jpeg;base64,/9j/4AAQ+SkZJRg==');
  });

  it('masks image alt/title tokens so alt text like "Câu 2" or "B." and markdown titles never corrupt splitting (Test 23)', () => {
    const parser = new AdvancedDocumentParser();
    const content = `
Câu 1. Quan sát đồ thị sau:
![Hình Câu 2: A. B. Đáp án](data:image/png;base64,AAA+BBB== "Chart Title")
A.![opt A](data:image/png;base64,IMG_A)B.![opt B](data:image/png;base64,IMG_B)
C. 3
D. 4
    `;
    const questions = parser.parse(content);
    expect(questions).toHaveLength(1);
    expect(questions[0].question.some(b => b.type === 'image' && b.content === 'data:image/png;base64,AAA+BBB==')).toBe(true);
    expect(questions[0].options).toHaveLength(4);
    expect(questions[0].options[0].content[0]).toMatchObject({ type: 'image', content: 'data:image/png;base64,IMG_A' });
    expect(questions[0].options[1].content[0]).toMatchObject({ type: 'image', content: 'data:image/png;base64,IMG_B' });
  });
});

