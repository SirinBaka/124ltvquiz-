import type { Quiz, Attempt, Question } from "@ltvquiz/shared";
import { downloadBlob } from "./exportService";

/**
 * Validates student input passcode against the quiz accessPassword setting.
 * Returns true if no password is required or if input matches.
 */
export function validateAccessPassword(
  inputPassword: string,
  expectedPassword?: string
): boolean {
  if (!expectedPassword || expectedPassword.trim() === "") {
    return true;
  }
  return inputPassword.trim() === expectedPassword.trim();
}

/**
 * Extracts plain text from a question's rich content array.
 */
export function extractQuestionPlainText(question: Question): string {
  if (!question || !question.question) return "";
  return question.question
    .filter((c) => c.type === "text")
    .map((c) => c.content)
    .join(" ")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/**
 * Helper to escape CSV cell contents according to RFC 4180.
 */
export function escapeCsvCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Evaluates whether a student's answer for a question is correct,
 * and calculates the points earned.
 */
export function evaluateQuestionAnswer(
  question: Question,
  studentAnswer: any
): { isCorrect: boolean; earnedPoints: number; studentAnswerText: string; correctAnswerText: string } {
  const points = question.points || 1;

  if (question.type === "true_false_multiple") {
    const ansMap = (typeof studentAnswer === "object" && studentAnswer !== null) ? studentAnswer : {};
    let correctCount = 0;
    const totalOptions = question.options.length || 1;

    const studentParts: string[] = [];
    const correctParts: string[] = [];

    question.options.forEach((opt) => {
      const isCorrectExpected = question.correctAnswer.includes(opt.id);
      const studentVal = !!ansMap[opt.id];
      if (studentVal === isCorrectExpected) {
        correctCount++;
      }
      studentParts.push(`${opt.label}: ${studentVal ? "Đúng" : "Sai"}`);
      correctParts.push(`${opt.label}: ${isCorrectExpected ? "Đúng" : "Sai"}`);
    });

    const earned = Number(((correctCount / totalOptions) * points).toFixed(2));
    const isFullyCorrect = correctCount === totalOptions;

    return {
      isCorrect: isFullyCorrect,
      earnedPoints: earned,
      studentAnswerText: studentParts.join("; "),
      correctAnswerText: correctParts.join("; "),
    };
  }

  // Standard multiple choice or single-answer question
  const studentAnsId = typeof studentAnswer === "string" ? studentAnswer : "";
  const correctAnsId = question.correctAnswer?.[0] || "";

  const studentOpt = question.options.find((o) => o.id === studentAnsId);
  const correctOpt = question.options.find((o) => o.id === correctAnsId);

  const studentText = studentOpt
    ? `${studentOpt.label}. ${studentOpt.content.filter((c) => c.type === "text").map((c) => c.content).join(" ")}`
    : "Chưa trả lời";

  const correctText = correctOpt
    ? `${correctOpt.label}. ${correctOpt.content.filter((c) => c.type === "text").map((c) => c.content).join(" ")}`
    : "Không có";

  const isCorrect = studentAnsId !== "" && studentAnsId === correctAnsId;
  const earnedPoints = isCorrect ? points : 0;

  return {
    isCorrect,
    earnedPoints,
    studentAnswerText: studentText,
    correctAnswerText: correctText,
  };
}

/**
 * Generates an Excel-friendly CSV string with UTF-8 BOM (\uFEFF)
 * containing the full detailed report for a single student attempt.
 */
export function generateStudentResultCsv(attempt: Attempt, quiz: Quiz): string {
  const dateFormatted = new Date(attempt.createdAt).toLocaleString("vi-VN");
  const timeSpentFormatted = `${Math.floor(attempt.timeSpent / 60)} phút ${attempt.timeSpent % 60} giây`;
  const percentage = attempt.totalPoints > 0
    ? ((attempt.score / attempt.totalPoints) * 100).toFixed(1) + "%"
    : "0%";

  const antiCheatStatus = (attempt.violationCount || 0) > 0
    ? `Cảnh báo: ${attempt.violationCount} lần vi phạm gian lận`
    : "Hợp lệ - Không phát hiện gian lận";

  const lines: string[] = [
    // Header block
    [escapeCsvCell("BÁO CÁO KẾT QUẢ BÀI THI CHI TIẾT"), ""].join(","),
    [escapeCsvCell("Hệ thống LTVQuiz - Khảo sát & Đánh giá năng lực"), ""].join(","),
    "",
    // Student & Quiz summary
    [escapeCsvCell("Họ và tên thí sinh"), escapeCsvCell(attempt.studentName || "Học sinh Ẩn danh")].join(","),
    [escapeCsvCell("Lớp / Phòng thi"), escapeCsvCell(attempt.studentClass || "Chưa xác định")].join(","),
    [escapeCsvCell("Mã đề thi"), escapeCsvCell(attempt.examCode || "—")].join(","),
    [escapeCsvCell("Tên bài kiểm tra"), escapeCsvCell(quiz.title || "Bài kiểm tra")].join(","),
    [escapeCsvCell("Thời gian nộp bài"), escapeCsvCell(dateFormatted)].join(","),
    [escapeCsvCell("Thời gian làm bài"), escapeCsvCell(timeSpentFormatted)].join(","),
    [escapeCsvCell("Điểm số đạt được"), escapeCsvCell(`${attempt.score.toFixed(1)} / ${attempt.totalPoints}`)].join(","),
    [escapeCsvCell("Tỷ lệ chính xác"), escapeCsvCell(percentage)].join(","),
    [escapeCsvCell("Chuỗi trả lời đúng dài nhất (Streak)"), escapeCsvCell(`${attempt.maxStreak || 0} câu liên tiếp`)].join(","),
    [escapeCsvCell("Giám sát phòng thi"), escapeCsvCell(antiCheatStatus)].join(","),
    "",
    // Detailed questions header
    [
      escapeCsvCell("STT"),
      escapeCsvCell("Nội dung câu hỏi"),
      escapeCsvCell("Câu trả lời của thí sinh"),
      escapeCsvCell("Đáp án chính xác"),
      escapeCsvCell("Kết quả"),
      escapeCsvCell("Điểm đạt"),
      escapeCsvCell("Điểm tối đa"),
    ].join(","),
  ];

  quiz.questions.forEach((q, idx) => {
    const studentAns = attempt.answers ? attempt.answers[q.id] : undefined;
    const evalResult = evaluateQuestionAnswer(q, studentAns);
    const plainTextQuestion = extractQuestionPlainText(q);

    lines.push(
      [
        escapeCsvCell(`Câu ${idx + 1}`),
        escapeCsvCell(plainTextQuestion || `Câu hỏi ${idx + 1}`),
        escapeCsvCell(evalResult.studentAnswerText),
        escapeCsvCell(evalResult.correctAnswerText),
        escapeCsvCell(evalResult.isCorrect ? "ĐÚNG" : "SAI"),
        escapeCsvCell(evalResult.earnedPoints),
        escapeCsvCell(q.points || 1),
      ].join(",")
    );
  });

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel immediately opens with correct Vietnamese diacritics
  return "\uFEFF" + lines.join("\r\n");
}

/**
 * Triggers a browser download of the student's result CSV.
 */
export function exportStudentResultToCsv(attempt: Attempt, quiz: Quiz): void {
  const csvContent = generateStudentResultCsv(attempt, quiz);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const safeStudentName = (attempt.studentName || "HocSinh")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_");

  const safeClass = (attempt.studentClass || "Lop")
    .replace(/[^a-zA-Z0-9]/g, "_");

  const fileName = `Ket_qua_${safeStudentName}_${safeClass}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(blob, fileName);
}
