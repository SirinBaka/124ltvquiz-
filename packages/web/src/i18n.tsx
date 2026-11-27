import { useState, useEffect, createContext, useContext } from "react";

export type Language = "vi" | "en";

export const translations = {
  vi: {
    "nav.home": "Trang chủ",
    "nav.about": "Giới thiệu",
    "nav.founder": "Nhà sáng lập",
    "nav.faq": "FAQ",
    "nav.wiki": "Wiki",
    "nav.community": "Cộng đồng",
    "nav.dashboard": "Tổng quan",
    "nav.create": "Tạo bài kiểm tra",
    "nav.quizzes": "Bài kiểm tra",
    "nav.documents": "Tài liệu",
    "nav.results": "Kết quả",
    "nav.statistics": "Số liệu",
    "nav.settings": "Cài đặt",

    "dashboard.welcome": "Xin chào!",
    "dashboard.desc": "Quản lý bài kiểm tra và tài liệu của bạn.",
    "dashboard.tests": "Bài kiểm tra",
    "dashboard.drafts": "Bản nháp",
    "dashboard.attempts": "Lượt làm",
    "dashboard.recent": "Bài kiểm tra gần đây",
    "dashboard.empty": "Bạn chưa tạo bài kiểm tra nào.",
    "dashboard.start": "Bắt đầu tạo bài đầu tiên",

    "create.title": "Tạo bài kiểm tra",
    "create.desc": "Tạo bài kiểm tra từ tài liệu hoặc nội dung có sẵn.",
    "create.step1": "① Chọn nguồn",
    "create.step2": "② Kiểm tra",
    "create.step3": "③ Cài đặt",
    "create.step4": "④ Xuất bản",
    "create.upload": "Tải tài liệu lên",
    "create.drop": "Thả file để tải lên",
    "create.dragOr": "Kéo thả file vào đây hoặc",
    "create.selectBtn": "Chọn tài liệu",
    "create.support": "Hỗ trợ PDF, DOCX, TXT, Markdown (Tối đa 25MB)",

    "landing.features": "Tính năng",
    "landing.guide": "Hướng dẫn",
    "landing.login": "Đăng nhập",
    "landing.start": "Bắt đầu sử dụng",
    "landing.header.login": "Đăng nhập",
    "landing.header.start": "Bắt đầu ngay",

    "landing.hero.title1": "Từ tài liệu thành bài kiểm tra.",
    "landing.hero.title2": "bài kiểm tra trong vài phút.",
    "landing.hero.desc":
      "Tải lên tài liệu học tập, trích xuất câu hỏi, chỉnh sửa nội dung và tạo bài kiểm tra trên cùng một nền tảng.",
    "landing.hero.btn1": "Tạo bài kiểm tra",
    "landing.hero.btn2": "Khám phá tính năng",
    "landing.hero.scrollCue": "Cuộn xuống để khám phá",
    "landing.hero.previewAlt": "Giao diện LTVQuiz Dashboard",

    "landing.features.title": "Mọi thứ cần thiết để tạo bài kiểm tra",
    "landing.features.desc":
      "Tập trung vào quy trình tạo đề, quản lý nội dung và tổ chức bài kiểm tra trên một nền tảng.",
    "landing.feature1.title": "Nhận diện tự động",
    "landing.feature1.desc":
      "Tải lên file Word hoặc PDF, hệ thống tự động bóc tách câu hỏi và đáp án chính xác.",
    "landing.feature2.title": "Trình soạn thảo trực quan",
    "landing.feature2.desc":
      "Chỉnh sửa lỗi sai, thêm công thức toán học và xem trước giao diện học sinh theo thời gian thực.",
    "landing.feature3.title": "Chia sẻ nhanh chóng",
    "landing.feature3.desc":
      "Xuất bản bài thi với một click. Gửi link cho học sinh làm bài ngay trên mọi thiết bị.",
    "landing.video.title": "Hướng dẫn sử dụng",
    "landing.video.desc":
      "Xem cách 12/4 LTVQuiz giúp bạn tạo bài kiểm tra nhanh chóng và dễ dàng.",

    "landing.explorer.title": "Mọi công cụ cần thiết cho bài kiểm tra hoàn hảo",
    "landing.explorer.tryBtn": "Thử nghiệm ngay",
    "landing.explorer.copyLink": "Sao chép link",
    "landing.explorer.copied": "Đã sao chép!",

    "landing.founder.title": "Nhà phát triển và Đóng góp",
    "landing.founder1.role": "Code Chính",
    "landing.founder1.quote":
      '"LTVQuiz được phát triển với mong muốn giúp quá trình tạo bài kiểm tra từ tài liệu trở nên thuận tiện, rõ ràng và dễ tiếp cận hơn."',
    "landing.founder2.role": "Code phụ",
    "landing.founder2.quote":
      '"Chúng tôi hướng đến việc xây dựng một hệ sinh thái học tập thông minh và thân thiện nhất cho học sinh Việt Nam."',
    "landing.founder.contactZalo": "Liên hệ Zalo",

    "landing.community.title": "Cộng đồng & Hỗ trợ",
    "landing.community.desc":
      '"Chúng tôi luôn ở đây để lắng nghe và hỗ trợ bạn. Quét mã QR hoặc nhấn nút bên dưới để tham gia cộng đồng LTVQuiz nhé!"',
    "landing.community.btn": "Tham gia nhóm Zalo",

    "landing.faq.title": "Câu hỏi thường gặp",

    "landing.cta.title": "Bắt đầu từ tài liệu của bạn",
    "landing.cta.desc":
      "Chuẩn bị nội dung, hoàn thiện câu hỏi và tạo bài kiểm tra theo cách phù hợp với nhu cầu của bạn.",
    "landing.cta.btn": "Tạo bài kiểm tra",
    "landing.loading": "Đang tải hệ thống...",

    "landing.footer.about": "Giới thiệu",
    "landing.footer.community": "Cộng đồng",
    "landing.footer.faq": "FAQ",
    "landing.footer.wiki": "Wiki",

    // Wiki Global & Navigation
    "wiki.title": "A4 LTVQuiz Wiki",
    "wiki.searchPlaceholder": "Tìm kiếm...",
    "wiki.backToQuiz": "Quay lại LTVQuiz",
    "wiki.sidebar.explore": "Khám phá Wiki",
    "wiki.sidebar.featured": "Bài viết nổi bật",
    "wiki.sidebar.recent": "Bài viết mới",
    "wiki.sidebar.popular": "Chủ đề phổ biến",
    "wiki.sidebar.glossary": "Bảng thuật ngữ",
    "wiki.sidebar.ltvquiz": "LTVQuiz",
    "wiki.sidebar.intro": "Giới thiệu LTVQuiz",
    "wiki.sidebar.getStarted": "Bắt đầu sử dụng",
    "wiki.sidebar.createQuiz": "Tạo bài kiểm tra",
    "wiki.sidebar.docManage": "Quản lý tài liệu",
    "wiki.sidebar.examManage": "Quản lý đề thi",
    "wiki.sidebar.info": "Thông tin",
    "wiki.sidebar.history": "Lịch sử phát triển",
    "wiki.sidebar.updates": "Nhật ký thay đổi",
    "wiki.sidebar.faq": "Câu hỏi thường gặp",
    "wiki.sidebar.support": "Liên hệ hỗ trợ",

    // Wiki Footer
    "wiki.footer.desc":
      "Bách khoa toàn thư về nền tảng LTVQuiz, nơi tập hợp kiến thức, hướng dẫn và thông tin tham khảo dành cho người dùng.",
    "wiki.footer.home": "Trang chủ",
    "wiki.footer.categories": "Danh mục",
    "wiki.footer.guide": "Hướng dẫn",
    "wiki.footer.history": "Lịch sử phiên bản",
    "wiki.footer.support": "Hỗ trợ",
    "wiki.footer.intro": "Giới thiệu dự án",
    "wiki.footer.disclaimer":
      "Nội dung Wiki được xây dựng nhằm giúp người dùng hiểu rõ hơn về LTVQuiz. Các chức năng và hướng dẫn có thể thay đổi theo phiên bản sản phẩm.",

    // Wiki Home
    "wiki.home.welcome": "Chào mừng đến với LTVQuiz Wiki",
    "wiki.home.subtitle": "Bách khoa toàn thư về LTVQuiz",
    "wiki.home.searchTitle": "Bạn cần tìm hiểu điều gì?",
    "wiki.home.searchPlaceholder":
      "Bạn đang gặp vấn đề gì? Hãy nhập câu hỏi hoặc từ khóa...",
    "wiki.home.searchBtn": "Tìm",
    "wiki.home.suggestions": "Gợi ý tìm kiếm:",
    "wiki.home.categories": "Các danh mục chính",
    "wiki.home.faq": "Câu hỏi thường gặp",
    "wiki.home.viewDetail": "Xem hướng dẫn chi tiết",
    "wiki.home.featured": "Bài viết nổi bật",
    "wiki.home.updated": "Mới cập nhật",
    "wiki.home.noUpdates": "Chưa có bài viết mới được công bố.",
    "wiki.home.noAnswerTitle": "Bạn chưa tìm thấy câu trả lời?",
    "wiki.home.noAnswerDesc":
      "Hãy tìm kiếm bằng từ khóa khác, duyệt qua các danh mục hoặc liên hệ bộ phận hỗ trợ của LTVQuiz.",
    "wiki.home.supportCenter": "Trung tâm hỗ trợ",

    // Wiki Search
    "wiki.search.title": "Tìm kiếm Wiki",
    "wiki.search.placeholder":
      "Bạn đang gặp vấn đề gì? Hãy nhập câu hỏi hoặc từ khóa...",
    "wiki.search.btn": "Tìm",
    "wiki.search.emptyPrompt":
      "Nhập từ khóa để bắt đầu tìm kiếm trong Bách khoa toàn thư.",
    "wiki.search.noMatchTitle": "Không tìm thấy bài viết phù hợp",
    "wiki.search.noMatchDesc":
      "Thử rút gọn từ khóa, sử dụng từ đồng nghĩa hoặc duyệt qua các danh mục chính.",
    "wiki.search.viewCategories": "Xem danh mục",
    "wiki.search.contactSupport": "Liên hệ hỗ trợ",
    "wiki.search.found": "Tìm thấy",
    "wiki.search.resultsFor": "kết quả cho",

    // Wiki Article
    "wiki.article.back": "Quay lại",
    "wiki.article.read": "Đọc",
    "wiki.article.save": "Lưu bài",
    "wiki.article.relatedSearch": "Tìm kiếm liên quan",
    "wiki.article.lastUpdated": "Cập nhật lần cuối:",
    "wiki.article.notFoundTitle": "Không tìm thấy bài viết",
    "wiki.article.notFoundDesc":
      "Bài viết bạn đang tìm kiếm không tồn tại, đã được di chuyển hoặc địa chỉ truy cập không chính xác.",
    "wiki.article.backHome": "Trở về trang chủ Wiki",
    "wiki.article.browseCategories": "Duyệt danh mục",

    // Status
    "wiki.status.verified": "Đã xác minh",
    "wiki.status.conditional": "Theo điều kiện",
    "wiki.status.needs_verification": "Cần xác minh",
    "wiki.status.unavailable": "Không khả dụng",
  },
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.founder": "Founders",
    "nav.faq": "FAQ",
    "nav.wiki": "Wiki",
    "nav.community": "Community",
    "nav.dashboard": "Dashboard",
    "nav.create": "Create Quiz",
    "nav.quizzes": "Quizzes",
    "nav.documents": "Documents",
    "nav.results": "Results",
    "nav.statistics": "Statistics",
    "nav.settings": "Settings",

    "dashboard.welcome": "Welcome!",
    "dashboard.desc": "Manage your quizzes and documents.",
    "dashboard.tests": "Quizzes",
    "dashboard.drafts": "Drafts",
    "dashboard.attempts": "Attempts",
    "dashboard.recent": "Recent Quizzes",
    "dashboard.empty": "You have not created any quizzes yet.",
    "dashboard.start": "Create your first quiz",

    "create.title": "Create Quiz",
    "create.desc": "Create a quiz from your documents or available content.",
    "create.step1": "① Choose source",
    "create.step2": "② Review",
    "create.step3": "③ Settings",
    "create.step4": "④ Publish",
    "create.upload": "Upload Document",
    "create.drop": "Drop file to upload",
    "create.dragOr": "Drag and drop file here or",
    "create.selectBtn": "Select Document",
    "create.support": "Supports PDF, DOCX, TXT, Markdown (Max 25MB)",

    "landing.features": "Features",
    "landing.guide": "Guide",
    "landing.login": "Log in",
    "landing.start": "Get Started",
    "landing.header.login": "Log in",
    "landing.header.start": "Get Started",

    "landing.hero.title1": "Turn documents into",
    "landing.hero.title2": "quizzes in minutes.",
    "landing.hero.desc":
      "Upload study materials, extract questions, edit content, and create online quizzes all on one platform.",
    "landing.hero.btn1": "Create Quiz",
    "landing.hero.btn2": "Explore Features",
    "landing.hero.scrollCue": "Scroll down to explore",
    "landing.hero.previewAlt": "LTVQuiz Dashboard Interface Preview",

    "landing.features.title": "Creating quizzes has never been easier",
    "landing.features.desc":
      "Every tool you need to manage and organize online exams.",
    "landing.feature1.title": "Automatic Recognition",
    "landing.feature1.desc":
      "Upload Word or PDF files, the system automatically extracts questions and correct answers.",
    "landing.feature2.title": "Visual Editor",
    "landing.feature2.desc":
      "Fix mistakes, add mathematical formulas, and preview the student interface in real time.",
    "landing.feature3.title": "Quick Sharing",
    "landing.feature3.desc":
      "Publish quizzes with one click. Send links to students to take on any device.",
    "landing.video.title": "How to use",
    "landing.video.desc":
      "Watch how 12/4 LTVQuiz helps you create quizzes quickly and easily.",

    "landing.explorer.title": "All the tools you need for the perfect quiz",
    "landing.explorer.tryBtn": "Try it now",
    "landing.explorer.copyLink": "Copy link",
    "landing.explorer.copied": "Copied!",

    "landing.founder.title": "Developers & Contributors",
    "landing.founder1.role": "Lead Developer",
    "landing.founder1.quote":
      '"LTVQuiz was built with the vision to make creating quizzes from documents seamless, intuitive, and accessible to everyone."',
    "landing.founder2.role": "Co-Developer",
    "landing.founder2.quote":
      '"We strive to build the most intelligent and user-friendly learning ecosystem for students and educators."',
    "landing.founder.contactZalo": "Contact via Zalo",

    "landing.community.title": "Community & Support",
    "landing.community.desc":
      '"We are always here to listen and assist you. Scan the QR code or click the button below to join the LTVQuiz community!"',
    "landing.community.btn": "Join Zalo Group",

    "landing.faq.title": "Frequently Asked Questions",

    "landing.cta.title": "Start from your documents",
    "landing.cta.desc":
      "Prepare content, refine questions, and generate quizzes tailored to your needs.",
    "landing.cta.btn": "Create Quiz",
    "landing.loading": "Loading system...",

    "landing.footer.about": "About",
    "landing.footer.community": "Community",
    "landing.footer.faq": "FAQ",
    "landing.footer.wiki": "Wiki",

    // Wiki Global & Navigation
    "wiki.title": "A4 LTVQuiz Wiki",
    "wiki.searchPlaceholder": "Search...",
    "wiki.backToQuiz": "Back to LTVQuiz",
    "wiki.sidebar.explore": "Explore Wiki",
    "wiki.sidebar.featured": "Featured Articles",
    "wiki.sidebar.recent": "Recent Articles",
    "wiki.sidebar.popular": "Popular Topics",
    "wiki.sidebar.glossary": "Glossary",
    "wiki.sidebar.ltvquiz": "LTVQuiz",
    "wiki.sidebar.intro": "About LTVQuiz",
    "wiki.sidebar.getStarted": "Getting Started",
    "wiki.sidebar.createQuiz": "Create Quiz",
    "wiki.sidebar.docManage": "Document Management",
    "wiki.sidebar.examManage": "Quiz Management",
    "wiki.sidebar.info": "Information",
    "wiki.sidebar.history": "Development History",
    "wiki.sidebar.updates": "Release Notes",
    "wiki.sidebar.faq": "FAQ",
    "wiki.sidebar.support": "Contact Support",

    // Wiki Footer
    "wiki.footer.desc":
      "The comprehensive encyclopedia of LTVQuiz, gathering tutorials, reference guides, and documentation for users.",
    "wiki.footer.home": "Home",
    "wiki.footer.categories": "Categories",
    "wiki.footer.guide": "Guides",
    "wiki.footer.history": "Version History",
    "wiki.footer.support": "Support",
    "wiki.footer.intro": "Project Overview",
    "wiki.footer.disclaimer":
      "Wiki content is maintained to assist LTVQuiz users. Features and guides are subject to change according to product updates.",

    // Wiki Home
    "wiki.home.welcome": "Welcome to LTVQuiz Wiki",
    "wiki.home.subtitle": "The Comprehensive LTVQuiz Encyclopedia",
    "wiki.home.searchTitle": "What would you like to learn?",
    "wiki.home.searchPlaceholder":
      "Having an issue? Enter a question or keywords...",
    "wiki.home.searchBtn": "Search",
    "wiki.home.suggestions": "Search suggestions:",
    "wiki.home.categories": "Main Categories",
    "wiki.home.faq": "Frequently Asked Questions",
    "wiki.home.viewDetail": "View detailed guide",
    "wiki.home.featured": "Featured Articles",
    "wiki.home.updated": "Recently Updated",
    "wiki.home.noUpdates": "No new articles published yet.",
    "wiki.home.noAnswerTitle": "Haven't found your answer?",
    "wiki.home.noAnswerDesc":
      "Try different keywords, browse our categories, or contact LTVQuiz support.",
    "wiki.home.supportCenter": "Support Center",

    // Wiki Search
    "wiki.search.title": "Wiki Search",
    "wiki.search.placeholder":
      "Having an issue? Enter a question or keywords...",
    "wiki.search.btn": "Search",
    "wiki.search.emptyPrompt":
      "Enter keywords to start searching the encyclopedia.",
    "wiki.search.noMatchTitle": "No matching articles found",
    "wiki.search.noMatchDesc":
      "Try shorter keywords, use synonyms, or browse main categories.",
    "wiki.search.viewCategories": "Browse Categories",
    "wiki.search.contactSupport": "Contact Support",
    "wiki.search.found": "Found",
    "wiki.search.resultsFor": "results for",

    // Wiki Article
    "wiki.article.back": "Back",
    "wiki.article.read": "Read",
    "wiki.article.save": "Bookmark",
    "wiki.article.relatedSearch": "Related Searches",
    "wiki.article.lastUpdated": "Last updated:",
    "wiki.article.notFoundTitle": "Article Not Found",
    "wiki.article.notFoundDesc":
      "The article you are looking for does not exist, was moved, or the link is incorrect.",
    "wiki.article.backHome": "Back to Wiki Home",
    "wiki.article.browseCategories": "Browse Categories",

    // Status
    "wiki.status.verified": "Verified",
    "wiki.status.conditional": "Conditional",
    "wiki.status.needs_verification": "Needs Verification",
    "wiki.status.unavailable": "Unavailable",
  },
};

export const HERO_PHRASES = {
  vi: [
    "Từ tài liệu thành câu hỏi.",
    "Biến tài liệu thành bài kiểm tra.",
    "Tạo đề nhanh, học hiệu quả.",
    "Soạn đề dễ dàng hơn.",
    "Tạo bài kiểm tra thật nhanh.",
    "Tài liệu của bạn, bài kiểm tra của bạn.",
    "Một tài liệu, một bài kiểm tra.",
    "Tạo đề thông minh hơn mỗi ngày.",
    "Đơn giản hóa việc ra đề.",
  ],
  en: [
    "From documents to smart questions.",
    "Transform docs into online quizzes.",
    "Create tests fast, teach effectively.",
    "Draft exams with effortless ease.",
    "Generate quizzes in minutes.",
    "Your documents, your quizzes.",
    "One document, one complete test.",
    "Create quizzes smarter every day.",
    "Simplifying exam creation for everyone.",
  ],
};

export function getHeroPhrases(lang: Language): string[] {
  return HERO_PHRASES[lang] || HERO_PHRASES.vi;
}

type LanguageContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: keyof (typeof translations)["vi"]) => string;
};

export const LanguageContext = createContext<LanguageContextType>({
  lang: "vi",
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => translations["vi"][key],
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "vi";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === "vi" ? "en" : "vi"));
  };

  const t = (key: keyof (typeof translations)["vi"]) => {
    return translations[lang]?.[key] || translations["vi"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
