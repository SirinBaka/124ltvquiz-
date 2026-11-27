import { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  UserCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Shuffle,
  Layers,
  Hash,
  Users,
} from 'lucide-react';
import { Button } from '../Button';
import type { Question } from '@ltvquiz/shared';
import { KahootLoader } from '../KahootLoader';
import { QrCodeView } from '../QrCodeView';
import { ShareLinkBanner } from '../ShareLinkBanner';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onPublish: () => void;
  isPublished?: boolean;
  quizId: string;
  quizTitle?: string;
  requireStudentInfo?: boolean;
  onToggleRequireStudentInfo?: (val: boolean) => void;
  enableAntiCheat?: boolean;
  onToggleAntiCheat?: (val: boolean) => void;
  accessPassword?: string;
  onChangeAccessPassword?: (val: string) => void;
  shuffleQuestions?: boolean;
  onToggleShuffleQuestions?: (val: boolean) => void;
  shuffleOptions?: boolean;
  onToggleShuffleOptions?: (val: boolean) => void;
  assignExamCode?: boolean;
  onToggleAssignExamCode?: (val: boolean) => void;
  maxStudentsLimit?: number | null;
  onChangeMaxStudentsLimit?: (val: number | null) => void;
}

export function PublishModal({
  isOpen,
  onClose,
  questions,
  onPublish,
  isPublished,
  quizId,
  quizTitle,
  requireStudentInfo = false,
  onToggleRequireStudentInfo,
  enableAntiCheat = true,
  onToggleAntiCheat,
  accessPassword,
  onChangeAccessPassword,
  shuffleQuestions = false,
  onToggleShuffleQuestions,
  shuffleOptions = false,
  onToggleShuffleOptions,
  assignExamCode = false,
  onToggleAssignExamCode,
  maxStudentsLimit = null,
  onChangeMaxStudentsLimit,
}: PublishModalProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const errors = questions.filter(q => q.validation.status === 'error').length;
  const warnings = questions.filter(q => q.validation.status === 'warning').length;

  const canPublish = errors === 0;
  
  const publicLink = `${window.location.origin}/test/${quizId}`;

  const handlePublish = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      onPublish();
    }, 500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFullInfo = () => {
    const fullText = accessPassword
      ? `${quizTitle || "Bài kiểm tra"}\n🔗 Link làm bài: ${publicLink}\n🔑 Mật mã phòng thi: ${accessPassword}`
      : `${quizTitle || "Bài kiểm tra"}\n🔗 Link làm bài: ${publicLink}`;
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
      {isPublishing && <KahootLoader text="Đang xuất bản bài kiểm tra..." />}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--color-surface)] rounded-2xl shadow-2xl border border-[var(--color-border)] z-50 overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {isPublished ? 'Đã xuất bản thành công' : 'Xác nhận xuất bản bài thi'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-background)] rounded-full text-[var(--color-text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isPublished ? (
            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text)]">Bài kiểm tra đã sẵn sàng!</h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Học sinh có thể truy cập qua liên kết hoặc quét mã QR dưới đây.
                </p>
              </div>
              
              {/* Share link input */}
              <div className="bg-[var(--color-background)] p-3.5 rounded-xl border border-[var(--color-border)] text-left">
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Liên kết bài kiểm tra
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 flex items-center text-xs font-mono text-[var(--color-text)] truncate">
                    <LinkIcon size={14} className="mr-2 shrink-0 text-[var(--color-primary)]" />
                    <span className="truncate">{publicLink}</span>
                  </div>
                  <Button variant="secondary" className="px-3 text-xs shrink-0" onClick={handleCopyLink}>
                    <Copy size={15} />
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </Button>
                </div>
              </div>

              {/* Passcode banner if enabled */}
              {accessPassword && (
                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/40 text-left flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        Mật mã phòng thi
                      </div>
                      <div className="text-sm font-mono font-bold text-amber-900 dark:text-amber-100">
                        {accessPassword}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="px-2.5 py-1 text-xs shrink-0"
                    onClick={handleCopyFullInfo}
                  >
                    <Copy size={13} />
                    <span>{copiedAll ? 'Đã chép link & mã' : 'Chép link & mã'}</span>
                  </Button>
                </div>
              )}

              {/* Share Link Banner with Logo and 'A4 LTVQuiz - Nền tảng luyện thi cho học sinh' */}
              <ShareLinkBanner
                url={publicLink}
                title={quizTitle || 'Bài kiểm tra trực tuyến'}
                subtitle="Bài kiểm tra trắc nghiệm trực tuyến"
              />

              {/* QR Code Section */}
              <QrCodeView
                url={publicLink}
                title={quizTitle || 'Bài kiểm tra'}
                defaultFileName="bai-thi"
                description="Quét mã QR bằng điện thoại hoặc tải ảnh QR về máy để gửi cho học sinh"
              />
            </div>
          ) : (
            <div className="space-y-3.5">
              {errors > 0 ? (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
                  <h3 className="font-bold flex items-center gap-2 mb-1.5">
                    <X size={18} /> Không thể xuất bản
                  </h3>
                  <p className="text-xs">Còn {errors} lỗi cần sửa trong danh sách câu hỏi. Vui lòng kiểm tra và khắc phục trước khi xuất bản.</p>
                </div>
              ) : warnings > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                  <h3 className="font-bold flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={18} /> Cảnh báo
                  </h3>
                  <p className="text-xs">Có {warnings} cảnh báo. Bạn vẫn có thể xuất bản bài kiểm tra nếu chắc chắn.</p>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text)]">
                  Bạn có chắc chắn muốn xuất bản bài kiểm tra này? Sau khi xuất bản, học sinh có thể truy cập liên kết và bắt đầu làm bài.
                </p>
              )}

              {/* Student info requirement toggle */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireStudentInfo}
                    onChange={(e) => onToggleRequireStudentInfo?.(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <UserCheck size={14} className="text-[var(--color-primary)]" />
                      <span>Yêu cầu nhập Họ tên & Lớp khi làm bài</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Học sinh bắt buộc phải điền tên và lớp trước khi làm bài. Dữ liệu thí sinh sẽ được lưu và thống kê đầy đủ.
                    </p>
                  </div>
                </label>
              </div>

              {/* Anti-cheat toggle */}
              <div className="p-3 bg-red-50/70 dark:bg-red-950/30 rounded-xl border border-red-200/80 dark:border-red-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableAntiCheat}
                    onChange={(e) => onToggleAntiCheat?.(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <ShieldAlert size={14} className="text-red-500" />
                      <span>Bảo vệ chống gian lận (Anti-cheat)</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Phát hiện chuyển tab, mở app khác hoặc lớp phủ đè lên màn hình thi. Cảnh báo và tự nộp nếu vi phạm quá 3 lần.
                    </p>
                  </div>
                </label>
              </div>

              {/* Passcode toggle */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!accessPassword}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChangeAccessPassword?.(accessPassword || "123456");
                      } else {
                        onChangeAccessPassword?.("");
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Lock size={14} className="text-amber-500" />
                      <span>Đặt mật mã phòng thi (Passcode)</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Học sinh bắt buộc phải nhập đúng mật mã này mới có thể mở đề thi và tính giờ làm bài.
                    </p>
                    {!!accessPassword && (
                      <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={accessPassword}
                          onChange={(e) => onChangeAccessPassword?.(e.target.value)}
                          placeholder="Nhập mật mã phòng thi..."
                          className="h-8 px-2.5 text-xs font-mono font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 text-[var(--color-text)]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1 text-xs cursor-pointer"
                          title={showPassword ? "Ẩn mật mã" : "Hiện mật mã"}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Shuffle questions */}
              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200/80 dark:border-purple-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => onToggleShuffleQuestions?.(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Shuffle size={14} className="text-purple-500" />
                      <span>Xáo trộn câu hỏi</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Thứ tự các câu hỏi sẽ được đảo ngẫu nhiên cho mỗi học sinh khi vào thi, tránh nhìn bài nhau.
                    </p>
                  </div>
                </label>
              </div>

              {/* Shuffle options */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => onToggleShuffleOptions?.(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Layers size={14} className="text-indigo-500" />
                      <span>Xáo trộn đáp án (A, B, C, D)</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Đảo ngẫu nhiên vị trí các lựa chọn trả lời trong từng câu hỏi trắc nghiệm.
                    </p>
                  </div>
                </label>
              </div>

              {/* Assign exam code */}
              <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200/80 dark:border-teal-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignExamCode}
                    onChange={(e) => onToggleAssignExamCode?.(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Hash size={14} className="text-teal-500" />
                      <span>Thêm mã đề cho mỗi học sinh</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Tự động cấp mã đề riêng biệt (ví dụ: 101, 102...) cho mỗi học sinh khi bắt đầu bài thi.
                    </p>
                  </div>
                </label>
              </div>

              {/* Max students limit */}
              <div className="p-3 bg-orange-50/70 dark:bg-orange-950/30 rounded-xl border border-orange-200/80 dark:border-orange-800/40">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maxStudentsLimit !== null && maxStudentsLimit !== undefined && maxStudentsLimit > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChangeMaxStudentsLimit?.(maxStudentsLimit && maxStudentsLimit > 0 ? maxStudentsLimit : 40);
                      } else {
                        onChangeMaxStudentsLimit?.(null);
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] text-orange-600 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text)]">
                      <Users size={14} className="text-orange-500" />
                      <span>Giới hạn lượng thí sinh làm đề</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
                      Tự động đóng bài thi khi số thí sinh nộp bài đạt tới giới hạn này.
                    </p>
                    {maxStudentsLimit !== null && maxStudentsLimit !== undefined && maxStudentsLimit > 0 && (
                      <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-[var(--color-text-secondary)]">Số lượng tối đa:</span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={maxStudentsLimit}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            onChangeMaxStudentsLimit?.(val);
                          }}
                          className="h-7 px-2.5 text-xs font-mono font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 w-24 text-[var(--color-text)]"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">thí sinh</span>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="bg-[var(--color-background)] rounded-xl p-3.5 space-y-2 border border-[var(--color-border)]">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">Tổng số câu hỏi:</span>
                  <span className="font-bold text-[var(--color-text)]">{questions.length} câu</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">Tổng điểm:</span>
                  <span className="font-bold text-[var(--color-text)]">{totalPoints} điểm</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--color-background)] border-t border-[var(--color-border)] flex justify-end gap-3 shrink-0">
          {isPublished ? (
            <Button variant="primary" onClick={onClose}>Hoàn tất</Button>
          ) : errors > 0 ? (
            <Button variant="primary" onClick={onClose}>Quay lại kiểm tra</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>{warnings > 0 ? 'Quay lại kiểm tra' : 'Hủy'}</Button>
              <Button 
                variant="primary" 
                onClick={handlePublish}
                disabled={!canPublish || isPublishing}
                className={!canPublish || isPublishing ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {warnings > 0 ? 'Vẫn xuất bản' : 'Xuất bản ngay'}
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
