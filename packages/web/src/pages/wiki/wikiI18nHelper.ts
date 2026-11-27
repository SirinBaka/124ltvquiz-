import type { Language } from "../../i18n";
import { WIKI_CATEGORIES } from "../../data/wikiArticles";

export const CATEGORY_EN_MAP: Record<string, string> = {
  "c-getting-started": "Getting Started",
  "c-documents": "Documents & Upload",
  "c-extraction": "Question Extraction",
  "c-editing": "Question Editing",
  "c-media": "Images & Math Formulas",
  "c-true-false": "True/False Questions",
  "c-management": "Quiz Management",
  "c-results": "Taking Quizzes & Results",
  "c-sharing": "Document Sharing",
  "c-data": "Data Management",
  "c-troubleshooting": "Troubleshooting",
  "c-glossary": "LTVQuiz Glossary",
};

export function getCategoryName(id: string, lang: Language): string {
  if (lang === "en") {
    return CATEGORY_EN_MAP[id] || "Other";
  }
  const found = WIKI_CATEGORIES.find((c) => c.id === id);
  return found?.name || "Khác";
}

export function getLocalizedStatus(status: string, lang: Language): string {
  if (lang === "en") {
    switch (status) {
      case "verified":
        return "Verified";
      case "conditional":
        return "Conditional";
      case "needs_verification":
        return "Needs Verification";
      case "unavailable":
        return "Unavailable";
      default:
        return status;
    }
  }
  switch (status) {
    case "verified":
      return "Đã xác minh";
    case "conditional":
      return "Theo điều kiện";
    case "needs_verification":
      return "Cần xác minh";
    case "unavailable":
      return "Không khả dụng";
    default:
      return status;
  }
}

export function getLocalizedMatchType(
  matchType: string,
  lang: Language,
): string {
  if (lang === "en") {
    if (matchType === "Trùng khớp tiêu đề") return "Title match";
    if (matchType === "Trùng khớp nội dung") return "Content match";
    return "Related";
  }
  return matchType;
}

export type WikiCategoryCard = {
  title: string;
  desc: string;
  links: string[];
};

export function getWikiHomeCategories(lang: Language): WikiCategoryCard[] {
  if (lang === "en") {
    return [
      {
        title: "1. LTVQuiz Overview",
        desc: "Learn about the platform, goals, core components, and how LTVQuiz powers your workflow.",
        links: [
          "What is LTVQuiz?",
          "Vision & Roadmap",
          "System Architecture",
          "LTVQuiz Glossary",
        ],
      },
      {
        title: "2. Getting Started",
        desc: "Guide for new users to get familiar with the interface and first steps.",
        links: [
          "Quickstart Guide",
          "Interface Tour",
          "Create Your First Quiz",
          "Preparing Documents",
        ],
      },
      {
        title: "3. Documents & Processing",
        desc: "Comprehensive information on uploading, reading, parsing, and managing study materials.",
        links: [
          "Document Management",
          "Supported Formats",
          "Uploading Materials",
          "Extracting Content",
        ],
      },
      {
        title: "4. Questions & Editing",
        desc: "Understand question structures, answer verification, and rich formatting.",
        links: [
          "Question Anatomy",
          "Multiple Choice",
          "Question Editor",
          "Images & Formulas",
        ],
      },
      {
        title: "5. Quiz Management",
        desc: "Documentation for creating, editing, previewing, and managing exam sets.",
        links: [
          "Create Quiz",
          "Preview Mode",
          "Exam Status",
          "Publishing & Closing",
        ],
      },
      {
        title: "6. Taking Quizzes & Results",
        desc: "Guides for quiz participants, auto-grading, and analytics for creators.",
        links: [
          "Student Interface",
          "Answering Questions",
          "Automated Grading",
          "Result Analytics",
        ],
      },
    ];
  }

  return [
    {
      title: "1. Tổng quan về LTVQuiz",
      desc: "Giới thiệu nền tảng, mục tiêu phát triển, các thành phần chính và cách LTVQuiz hỗ trợ quy trình.",
      links: [
        "LTVQuiz là gì?",
        "Mục tiêu và định hướng",
        "Tổng quan hệ thống",
        "Thuật ngữ LTVQuiz",
      ],
    },
    {
      title: "2. Bắt đầu sử dụng",
      desc: "Hướng dẫn người dùng mới làm quen với giao diện và các bước đầu tiên.",
      links: [
        "Hướng dẫn bắt đầu",
        "Làm quen với giao diện",
        "Tạo bài kiểm tra đầu tiên",
        "Chuẩn bị tài liệu",
      ],
    },
    {
      title: "3. Tài liệu và xử lý",
      desc: "Tập hợp thông tin về tải lên, đọc, xử lý và quản lý tài liệu.",
      links: [
        "Quản lý tài liệu",
        "Các định dạng hỗ trợ",
        "Tải tài liệu lên",
        "Trích xuất nội dung",
      ],
    },
    {
      title: "4. Câu hỏi và biên tập",
      desc: "Giải thích cấu trúc câu hỏi, cách chỉnh sửa và kiểm tra tính chính xác.",
      links: [
        "Cấu trúc câu hỏi",
        "Câu hỏi trắc nghiệm",
        "Trình biên tập câu hỏi",
        "Hình ảnh & công thức",
      ],
    },
    {
      title: "5. Quản lý bài kiểm tra",
      desc: "Tài liệu về quá trình tạo, chỉnh sửa, xem trước và quản lý đề thi.",
      links: [
        "Tạo bài kiểm tra",
        "Xem trước",
        "Trạng thái bài thi",
        "Xuất bản và đóng bài",
      ],
    },
    {
      title: "6. Làm bài và kết quả",
      desc: "Thông tin dành cho người tham gia bài kiểm tra và người quản lý kết quả.",
      links: [
        "Giao diện làm bài",
        "Trả lời câu hỏi",
        "Chấm điểm tự động",
        "Thống kê kết quả",
      ],
    },
  ];
}

export type WikiFaqItem = {
  q: string;
  link: string;
  ans: string;
};

export function getWikiFaqs(lang: Language): WikiFaqItem[] {
  if (lang === "en") {
    return [
      {
        q: "How to create a quiz from a PDF file?",
        link: "cach-tai-tai-lieu-pdf-len",
        ans: "Upload your PDF through the Create Quiz page. The parser scans and extracts questions automatically.",
      },
      {
        q: "Why are questions split incorrectly during extraction?",
        link: "cach-xu-ly-ket-qua-trich-xuat-khong-chinh-xac",
        ans: "Usually caused by non-standard numbering formats or scanned PDF pages with low contrast.",
      },
      {
        q: "Can I edit questions after processing the document?",
        link: "cach-chinh-sua-noi-dung-cau-hoi",
        ans: "Yes. You have complete control to add, edit, delete questions, and update answer choices.",
      },
      {
        q: "How do I add or replace images in questions?",
        link: "cach-them-hinh-anh-thu-cong-vao-cau-hoi",
        ans: "In the question editor, click the Image icon in the toolbar to upload or replace illustrations.",
      },
      {
        q: "Why were my changes not saved?",
        link: "cach-kiem-tra-thay-doi-da-duoc-luu",
        ans: "Verify your internet connection and make sure to click Save before leaving the editor.",
      },
      {
        q: "How can I share documents with others?",
        link: "cach-chia-se-tai-lieu-bang-lien-ket",
        ans: "Click the Share button, adjust permissions, and copy the link or QR code to send.",
      },
    ];
  }

  return [
    {
      q: "Làm sao để tạo bài kiểm tra từ PDF?",
      link: "cach-tai-tai-lieu-pdf-len",
      ans: "Tải tệp PDF lên qua giao diện Tạo đề thi. Hệ thống sẽ quét và nhận diện câu hỏi.",
    },
    {
      q: "Tại sao câu hỏi bị tách sai khi trích xuất?",
      link: "cach-xu-ly-ket-qua-trich-xuat-khong-chinh-xac",
      ans: "Nguyên nhân thường do cấu trúc đánh số không chuẩn hoặc PDF ảnh mờ.",
    },
    {
      q: "Có thể sửa câu hỏi sau khi xử lý tài liệu không?",
      link: "cach-chinh-sua-noi-dung-cau-hoi",
      ans: "Có. Bạn có toàn quyền thêm, sửa, xóa, thay đổi đáp án sau khi trích xuất.",
    },
    {
      q: "Làm sao để thêm hoặc thay thế hình ảnh?",
      link: "cach-them-hinh-anh-thu-cong-vao-cau-hoi",
      ans: "Trong trình biên tập, nhấn vào nút hình ảnh để tải lên thay thế.",
    },
    {
      q: "Tại sao thay đổi của tôi chưa được lưu?",
      link: "cach-kiem-tra-thay-doi-da-duoc-luu",
      ans: "Đảm bảo có kết nối mạng và nhấn nút Lưu trước khi thoát khỏi trang.",
    },
    {
      q: "Làm sao để chia sẻ tài liệu cho người khác?",
      link: "cach-chia-se-tai-lieu-bang-lien-ket",
      ans: "Nhấn vào nút Chia sẻ, chọn quyền truy cập và gửi link cho người nhận.",
    },
  ];
}

export type WikiFeaturedItem = {
  title: string;
  desc: string;
};

export function getWikiFeaturedArticles(lang: Language): WikiFeaturedItem[] {
  if (lang === "en") {
    return [
      {
        title: "What is LTVQuiz?",
        desc: "Discover the purpose, inner workings, and core architecture.",
      },
      {
        title: "Getting Started Guide",
        desc: "Get comfortable with the interface and the quiz generation pipeline.",
      },
      {
        title: "Extracting Questions from Documents",
        desc: "How the intelligent engine detects and parses questions.",
      },
      {
        title: "Question Editor",
        desc: "Review, edit, and fine-tune questions with formulas before publishing.",
      },
      {
        title: "Quiz Management",
        desc: "Organize exam banks, assignments, and test sessions effectively.",
      },
    ];
  }

  return [
    {
      title: "LTVQuiz là gì?",
      desc: "Tìm hiểu mục đích, cách hoạt động và thành phần chính.",
    },
    {
      title: "Hướng dẫn bắt đầu",
      desc: "Làm quen hệ thống và quy trình tạo bài kiểm tra.",
    },
    {
      title: "Trích xuất câu hỏi từ tài liệu",
      desc: "Cách hệ thống nhận diện câu hỏi từ nội dung.",
    },
    {
      title: "Trình biên tập câu hỏi",
      desc: "Cách rà soát và chỉnh sửa trước khi xuất bản.",
    },
    {
      title: "Quản lý bài kiểm tra",
      desc: "Cách tổ chức các đề thi trong hệ thống.",
    },
  ];
}

export function getWikiSearchSuggestions(lang: Language): string[] {
  if (lang === "en") {
    return [
      "How to create a quiz from PDF?",
      "Why is PDF question recognition failing?",
      "Editing answers after extraction",
      "Adding images and math formulas",
      "Creating True/False questions",
      "Sharing documents via link or QR code",
      "Why are my changes not saving?",
    ];
  }

  return [
    "Làm thế nào để tạo bài kiểm tra?",
    "Tại sao PDF không nhận diện được câu hỏi?",
    "Cách chỉnh sửa đáp án sau khi trích xuất",
    "Cách thêm hình ảnh vào câu hỏi",
    "Cách tạo câu hỏi Đúng/Sai",
    "Làm sao để chia sẻ tài liệu bằng liên kết?",
    "Tại sao thay đổi của tôi chưa được lưu?",
  ];
}

const MARKDOWN_TRANSLATIONS: [RegExp, string][] = [
  [/## Mục đích/g, "## Purpose"],
  [/## Yêu cầu chuẩn bị/g, "## Prerequisites"],
  [/## Hướng dẫn thực hiện/g, "## Step-by-step Instructions"],
  [/## Kết quả dự kiến/g, "## Expected Results"],
  [/## Định nghĩa/g, "## Definition"],
  [/## Giải thích chi tiết/g, "## Detailed Explanation"],
  [/## Mối liên hệ trong LTVQuiz/g, "## Relationship with LTVQuiz"],
  [/\*\*Truy cập chức năng:\*\*/g, "**Access feature:**"],
  [/\*\*Chọn thao tác:\*\*/g, "**Select action:**"],
  [
    /\*\*Điền thông tin hoặc cấu hình:\*\*/g,
    "**Fill information or configuration:**",
  ],
  [/\*\*Kiểm tra và lưu:\*\*/g, "**Review and save:**"],
  [/Đăng nhập vào tài khoản LTVQuiz\./g, "Log in to your LTVQuiz account."],
  [
    /Mở đúng giao diện liên quan đến chức năng\./g,
    "Navigate to the relevant feature page.",
  ],
  [
    /Chắc chắn rằng tài liệu và dữ liệu đã sẵn sàng\./g,
    "Ensure that your documents and data are ready.",
  ],
  [
    /Mở menu và tìm đến khu vực quản lý tương ứng\./g,
    "Open the navigation menu and go to the corresponding section.",
  ],
  [
    /Nhấn vào nút chức năng theo hướng dẫn trên màn hình\./g,
    "Click the action button as guided on screen.",
  ],
  [
    /Cung cấp các thông tin cần thiết mà hệ thống yêu cầu\./g,
    "Provide necessary details required by the system.",
  ],
  [
    /Rà soát lại dữ liệu và nhấn Lưu để xác nhận thay đổi\./g,
    "Review the information and click Save to confirm changes.",
  ],
  [
    /Sau khi hoàn tất, hệ thống sẽ cập nhật trạng thái mới hoặc hiển thị thông báo thành công\. Bạn có thể kiểm tra lại trong danh sách quản lý\./g,
    "Once complete, the system will update the state or display a success alert. You can inspect it in the management list.",
  ],
];

export function translateArticleContent(
  content: string,
  lang: Language,
): string {
  if (lang !== "en" || !content) return content;

  let result = content;
  for (const [regex, replacement] of MARKDOWN_TRANSLATIONS) {
    result = result.replace(regex, replacement);
  }
  return result;
}
