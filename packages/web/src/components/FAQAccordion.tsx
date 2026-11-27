import { useState } from 'react';
import { useLanguage } from '../i18n';

interface FAQItem {
  question: string;
  answer: string;
}

const faqsVi: FAQItem[] = [
  {
    question: 'LTVQuiz hỗ trợ những định dạng tài liệu nào?',
    answer: 'LTVQuiz hỗ trợ các định dạng phổ biến như PDF, DOCX (Word), TXT và Markdown. Hệ thống tự động bóc tách cấu trúc câu hỏi và phương án trả lời chỉ trong vài giây.'
  },
  {
    question: 'Tôi có thể chỉnh sửa câu hỏi sau khi trích xuất không?',
    answer: 'Có! Bạn có thể chỉnh sửa nội dung, công thức toán học, thêm bớt phương án lựa chọn, đảo đáp án đúng và xem trước giao diện thi thực tế.'
  },
  {
    question: 'LTVQuiz có hỗ trợ câu hỏi Đúng/Sai không?',
    answer: 'Có, hệ thống hỗ trợ đầy đủ dạng câu hỏi Đúng/Sai 4 ý (a, b, c, d) theo chuẩn cấu trúc đề thi mới nhất của Bộ GD&ĐT.'
  },
  {
    question: 'Làm thế nào để tạo và quản lý bài kiểm tra?',
    answer: 'Sau khi rà soát và hoàn thiện câu hỏi, bạn có thể lưu, phân loại và xuất bản bài kiểm tra tại khu vực Quản lý bài kiểm tra tập trung.'
  },
  {
    question: 'Wiki LTVQuiz dùng để làm gì?',
    answer: 'Wiki là kho tri thức lưu trữ các hướng dẫn sử dụng chi tiết, mẹo soạn đề và giải đáp thắc mắc giúp giáo viên và học sinh tận dụng tối đa hệ thống.'
  },
  {
    question: 'Tôi liên hệ hỗ trợ qua Zalo bằng cách nào?',
    answer: 'Bạn có thể nhấn vào nút "Liên hệ Zalo" hoặc quét mã QR trong mục Cộng đồng ở trang chủ để tham gia nhóm hỗ trợ trực tiếp.'
  },
  {
    question: 'Tôi nên làm gì khi gặp lỗi trong quá trình xử lý tài liệu?',
    answer: 'Bạn nên kiểm tra lại định dạng file (đảm bảo câu hỏi có tiền tố Câu 1, Câu 2... và các lựa chọn A, B, C, D rõ ràng), hoặc liên hệ hỗ trợ qua Zalo để được trợ giúp ngay.'
  }
];

const faqsEn: FAQItem[] = [
  {
    question: 'What document formats does LTVQuiz support?',
    answer: 'LTVQuiz supports popular formats including PDF, DOCX (Word), TXT, and Markdown. The system automatically parses question structures and choices in seconds.'
  },
  {
    question: 'Can I edit questions after extraction?',
    answer: 'Yes! You can edit question text, mathematical formulas, add/remove options, toggle correct answers, and preview the real student interface.'
  },
  {
    question: 'Does LTVQuiz support True/False questions?',
    answer: 'Yes, the platform fully supports 4-statement True/False questions (a, b, c, d) following modern standardized exam guidelines.'
  },
  {
    question: 'How do I create and manage quizzes?',
    answer: 'After reviewing questions, you can save, categorize, and publish quizzes in your centralized Quiz Management Dashboard.'
  },
  {
    question: 'What is the LTVQuiz Wiki used for?',
    answer: 'The Wiki provides comprehensive guides, question crafting tips, and troubleshooting documentation to help you get the most out of the platform.'
  },
  {
    question: 'How can I contact support via Zalo?',
    answer: 'You can click "Contact via Zalo" or scan the QR code in the Community section on the homepage to join our direct support group.'
  },
  {
    question: 'What should I do if an error occurs while processing documents?',
    answer: 'Check your file formatting (ensure questions start with Question 1, Question 2... and options A, B, C, D are distinct), or contact our support team via Zalo for immediate assistance.'
  }
];

export function FAQAccordion() {
  const { lang } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = lang === 'en' ? faqsEn : faqsVi;

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {faqs.map((faq, index) => (
        <div key={`${lang}-${index}`} className="border border-[var(--color-border)] rounded-xl bg-[var(--color-background)] overflow-hidden transition-colors hover:border-[var(--color-primary)]/50">
          <button
            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none cursor-pointer"
            onClick={() => toggle(index)}
            aria-expanded={openIndex === index}
          >
            <span className="font-semibold text-[var(--color-text)] pr-4">{faq.question}</span>
            <div className="text-[var(--color-text-secondary)] flex-shrink-0 w-5 h-5 relative flex items-center justify-center">
              <div className={`absolute w-3.5 h-[2px] bg-current rounded-full transform-gpu transition-transform duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${openIndex === index ? 'rotate-180' : 'rotate-0'}`} />
              <div className={`absolute w-3.5 h-[2px] bg-current rounded-full transform-gpu transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${openIndex === index ? 'rotate-180 opacity-0' : 'rotate-90 opacity-100'}`} />
            </div>
          </button>
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
              openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-5 text-[var(--color-text-secondary)] leading-relaxed text-sm">
                {faq.answer}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
