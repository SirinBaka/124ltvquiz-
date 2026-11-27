import { FileText, Edit, CheckSquare, Image as ImageIcon, LayoutList, Share } from 'lucide-react';


interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  screenshotPath: string;
  screenshotAlt: string;
  captionTitle: string;
  captionDesc: string;
}

const features: FeatureItem[] = [
  {
    id: 'extract',
    title: 'Chuyển đổi tài liệu thành câu hỏi',
    description: 'Bắt đầu từ tài liệu học tập có sẵn và sử dụng quy trình trích xuất nội dung để chuẩn bị câu hỏi cho bài kiểm tra.',
    icon: FileText,
    screenshotPath: '/assets/features/extract.png',
    screenshotAlt: 'Giao diện tải lên và trích xuất tài liệu',
    captionTitle: 'Từ tài liệu đến câu hỏi',
    captionDesc: 'Rà soát nội dung được trích xuất trước khi đưa vào đề thi.'
  },
  {
    id: 'editor',
    title: 'Biên tập câu hỏi trực quan',
    description: 'Kiểm tra câu hỏi, chỉnh sửa lựa chọn và đáp án, đồng thời hoàn thiện nội dung trước khi sử dụng.',
    icon: Edit,
    screenshotPath: '/assets/features/editor.png',
    screenshotAlt: 'Giao diện chỉnh sửa câu hỏi trực quan',
    captionTitle: 'Chủ động chỉnh sửa nội dung',
    captionDesc: 'Hoàn thiện câu hỏi theo mục tiêu học tập của bạn.'
  },
  {
    id: 'truefalse',
    title: 'Hỗ trợ câu hỏi Đúng/Sai',
    description: 'Tổ chức câu hỏi Đúng/Sai theo cấu trúc rõ ràng, phù hợp với nội dung và dạng bài được hỗ trợ.',
    icon: CheckSquare,
    screenshotPath: '/assets/features/truefalse.png',
    screenshotAlt: 'Giao diện câu hỏi dạng Đúng/Sai',
    captionTitle: 'Đa dạng dạng câu hỏi',
    captionDesc: 'Tạo nội dung phù hợp với cách kiểm tra kiến thức.'
  },
  {
    id: 'math',
    title: 'Hình ảnh và công thức toán học',
    description: 'Hỗ trợ trình bày những nội dung trực quan và công thức cần thiết trong câu hỏi.',
    icon: ImageIcon,
    screenshotPath: '/assets/features/math.png',
    screenshotAlt: 'Hiển thị công thức toán học và hình ảnh trong câu hỏi',
    captionTitle: 'Giữ lại nội dung quan trọng',
    captionDesc: 'Giúp câu hỏi thể hiện đầy đủ thông tin cần thiết.'
  },
  {
    id: 'management',
    title: 'Quản lý bài kiểm tra',
    description: 'Theo dõi, chỉnh sửa và tổ chức các bài kiểm tra theo những trạng thái được hỗ trợ trong hệ thống.',
    icon: LayoutList,
    screenshotPath: '/assets/features/management.png',
    screenshotAlt: 'Trang quản lý danh sách bài kiểm tra',
    captionTitle: 'Quản lý đề thi tập trung',
    captionDesc: 'Dễ dàng theo dõi và tiếp tục hoàn thiện các bài kiểm tra.'
  },
  {
    id: 'share',
    title: 'Chia sẻ và xem tài liệu',
    description: 'Nếu chức năng chia sẻ đã được triển khai, tạo liên kết để người nhận mở và xem tài liệu trực tiếp trên trình duyệt.',
    icon: Share,
    screenshotPath: '/assets/features/share.png',
    screenshotAlt: 'Giao diện xem và chia sẻ tài liệu',
    captionTitle: 'Chia sẻ thuận tiện',
    captionDesc: 'Mở tài liệu qua liên kết khi quyền truy cập cho phép.'
  }
];

export function FeatureShowcase() {
  return (
    <section id="showcase" className="py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)] relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[var(--color-text)]">Khám phá những tính năng của LTVQuiz</h2>
          <p className="mt-4 text-[var(--color-text-secondary)] max-w-3xl mx-auto text-lg leading-relaxed">
            Mỗi công cụ được xây dựng để hỗ trợ một bước trong quá trình tạo, chỉnh sửa và quản lý bài kiểm tra. Cuộn để khám phá.
          </p>
        </div>

        <div className="flex flex-col relative pb-[10vh] max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div key={feature.id} className="contents">
                {/* Sticky Combined Card */}
                <div
                  className="sticky w-full origin-top"
                  style={{ 
                    top: `calc(7rem + ${index * 1.5}rem)`,
                    paddingBottom: index === features.length - 1 ? '5vh' : '40vh',
                    zIndex: index + 10
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 p-8 lg:p-12 rounded-[2rem] border border-[var(--color-border)] w-full bg-[var(--color-surface)] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)]">
                    
                    {/* Left: Text Content */}
                    <div className="lg:w-5/12 flex flex-col justify-center">
                      <div className="w-16 h-16 mb-8 rounded-2xl flex items-center justify-center bg-[var(--color-primary)] text-white shadow-sm">
                        <Icon size={32} />
                      </div>
                      <h3 className="font-bold text-3xl mb-4 text-[var(--color-text)]">
                        {feature.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
                        {feature.description}
                      </p>
                    </div>

                    {/* Right: Screenshot/Image Mockup */}
                    <div className="lg:w-7/12 mt-8 lg:mt-0">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden shadow-inner relative aspect-[4/3] flex flex-col h-full w-full">
                        {/* Fake UI Header */}
                        <div className="h-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-4 gap-2 z-10 relative shrink-0">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>

                        {/* Image Area */}
                        <div className="flex-1 w-full bg-[var(--color-surface)] relative flex items-center justify-center p-6 overflow-hidden">
                          <div className="w-full h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                              <ImageIcon size={40} />
                            </div>
                            <h4 className="font-bold text-lg text-[var(--color-text)] mb-2">Ảnh chụp màn hình cần bổ sung</h4>
                            <code className="text-xs bg-[var(--color-background)] border border-[var(--color-border)] text-rose-500 px-3 py-1.5 rounded-lg mb-3 block font-mono">
                              {feature.screenshotPath}
                            </code>
                            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                              {feature.screenshotAlt}
                            </p>
                          </div>
                        </div>
                        
                        {/* Caption Area */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pt-12 text-white">
                          <h4 className="font-bold text-lg mb-1">{feature.captionTitle}</h4>
                          <p className="text-white/80 text-sm">{feature.captionDesc}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
