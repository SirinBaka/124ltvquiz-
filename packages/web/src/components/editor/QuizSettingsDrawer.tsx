import { useState } from 'react';
import { X, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '../Button';
import { OnOffSwitch } from '../OnOffSwitch';
import type { QuizSettings } from '@ltvquiz/shared';

interface QuizSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuizSettings;
  onUpdate: (settings: QuizSettings) => void;
}

export function QuizSettingsDrawer({ isOpen, onClose, settings, onUpdate }: QuizSettingsDrawerProps) {
  const [showPassword, setShowPassword] = useState(false);
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" aria-labelledby="editor-settings-title" className="fixed inset-y-0 right-0 w-full md:w-96 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl z-50 flex flex-col transform transition-transform duration-200 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 id="editor-settings-title" className="text-lg font-bold text-[var(--color-text)]">Cài đặt bài kiểm tra</h2>
          <button 
            type="button"
            aria-label="Đóng cài đặt"
            onClick={onClose}
            className="grid size-11 place-items-center hover:bg-[var(--color-surface-hover)] rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Cấu hình thời gian</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Thời gian làm bài (phút)
              </label>
              <input 
                type="number"
                min="0"
                value={settings.timeLimit || ''}
                onChange={(e) => onUpdate({ ...settings, timeLimit: e.target.value ? Number(e.target.value) : null })}
                placeholder="Không giới hạn"
                className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all"
              />
              <p className="text-xs text-[var(--color-text-muted)]">Để trống nếu không muốn giới hạn thời gian.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Cấu hình câu hỏi</h3>
            
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">Xáo trộn câu hỏi</span>
              <OnOffSwitch
                checked={settings.shuffleQuestions}
                onChange={(val) => onUpdate({ ...settings, shuffleQuestions: val })}
                ariaLabel="Xáo trộn câu hỏi"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--color-text)]">Xáo trộn đáp án</span>
              <OnOffSwitch
                checked={settings.shuffleOptions}
                onChange={(val) => onUpdate({ ...settings, shuffleOptions: val })}
                ariaLabel="Xáo trộn đáp án"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-[var(--color-text)] block">
                  Thêm mã đề cho mỗi học sinh
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Tự động cấp mã đề ngẫu nhiên (101, 102...) cho từng thí sinh
                </span>
              </div>
              <OnOffSwitch
                checked={settings.assignExamCode ?? false}
                onChange={(val) => onUpdate({ ...settings, assignExamCode: val })}
                ariaLabel="Thêm mã đề cho mỗi học sinh"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Quyền làm bài</h3>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Số lần làm tối đa
              </label>
              <input 
                type="number"
                min="1"
                value={settings.maxAttempts}
                onChange={(e) => onUpdate({ ...settings, maxAttempts: Number(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 mt-3">
              <div>
                <span className="text-sm font-medium text-[var(--color-text)] block">
                  Yêu cầu nhập Họ tên & Lớp
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Thí sinh phải nhập thông tin trước khi bắt đầu
                </span>
              </div>
              <OnOffSwitch
                checked={settings.requireStudentInfo ?? false}
                onChange={(val) => onUpdate({ ...settings, requireStudentInfo: val })}
                ariaLabel="Yêu cầu nhập Họ tên và Lớp"
              />
            </div>

            {/* Anti-cheat settings */}
            <div className="pt-3 border-t border-[var(--color-border)] mt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-medium text-[var(--color-text)] block">
                    Chống gian lận phòng thi (Anti-cheat)
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Cảnh báo khi out tab/ứng dụng khác và khóa bài thi
                  </span>
                </div>
                <OnOffSwitch
                  checked={settings.enableAntiCheat !== false}
                  onChange={(val) => onUpdate({ ...settings, enableAntiCheat: val })}
                  ariaLabel="Chống gian lận phòng thi"
                />
              </div>

              {settings.enableAntiCheat !== false && (
                <div className="mt-3 space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] block">
                    Số lần vi phạm tối đa trước khi tự nộp bài:
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    value={settings.maxViolations ?? 3}
                    onChange={(e) => onUpdate({ ...settings, maxViolations: Math.max(1, Number(e.target.value) || 3) })}
                    className="w-24 px-2.5 py-1.5 text-xs border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Max students limit */}
            <div className="pt-3 border-t border-[var(--color-border)] mt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-medium text-[var(--color-text)] block">
                    Giới hạn lượng thí sinh làm đề
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Tự động đóng bài thi khi đạt đủ số lượng
                  </span>
                </div>
                <OnOffSwitch
                  checked={settings.maxStudentsLimit !== null && settings.maxStudentsLimit !== undefined && settings.maxStudentsLimit > 0}
                  onChange={(val) => {
                    if (val) {
                      onUpdate({ ...settings, maxStudentsLimit: settings.maxStudentsLimit && settings.maxStudentsLimit > 0 ? settings.maxStudentsLimit : 40 });
                    } else {
                      onUpdate({ ...settings, maxStudentsLimit: null });
                    }
                  }}
                  ariaLabel="Giới hạn lượng thí sinh làm đề"
                />
              </div>

              {settings.maxStudentsLimit !== null && settings.maxStudentsLimit !== undefined && settings.maxStudentsLimit > 0 && (
                <div className="mt-3 space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] block">
                    Số thí sinh tối đa được nộp bài:
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={1000}
                    value={settings.maxStudentsLimit}
                    onChange={(e) => onUpdate({ ...settings, maxStudentsLimit: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-28 px-2.5 py-1.5 text-xs border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono"
                  />
                </div>
              )}
            </div>

            {/* Passcode Protection */}
            <div className="pt-3 border-t border-[var(--color-border)] mt-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">
                    <Lock size={14} className="text-amber-500" />
                    <span>Mật mã phòng thi (Passcode)</span>
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Yêu cầu học sinh nhập đúng mật mã để vào thi
                  </span>
                </div>
                <OnOffSwitch
                  checked={!!settings.accessPassword}
                  onChange={(val) => {
                    if (val) {
                      onUpdate({ ...settings, accessPassword: settings.accessPassword || "123456" });
                    } else {
                      onUpdate({ ...settings, accessPassword: "" });
                    }
                  }}
                  ariaLabel="Mật mã phòng thi"
                />
              </div>

              {!!settings.accessPassword && (
                <div className="mt-3 space-y-1.5">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                    Mật khẩu truy cập bài thi:
                  </label>
                  <div className="relative flex items-center max-w-xs">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={settings.accessPassword}
                      onChange={(e) => onUpdate({ ...settings, accessPassword: e.target.value })}
                      placeholder="Nhập mã truy cập..."
                      className="w-full pr-9 px-3 py-1.5 text-xs border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono tracking-wider font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 cursor-pointer"
                      title={showPassword ? "Ẩn mật mã" : "Hiện mật mã"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    Chỉ những học sinh có mã này mới có thể bắt đầu làm bài.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-semibold text-[var(--color-text)]">Hiển thị kết quả</h3>
            
            <div className="space-y-2">
              <select 
                value={settings.showResults}
                onChange={(e) => onUpdate({ ...settings, showResults: e.target.value as any })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)] transition-all cursor-pointer"
              >
                <option value="immediately" className="bg-[var(--color-surface)] text-[var(--color-text)]">Ngay sau khi nộp bài</option>
                <option value="after_deadline" className="bg-[var(--color-surface)] text-[var(--color-text)]">Chỉ sau khi hết hạn thi</option>
                <option value="never" className="bg-[var(--color-surface)] text-[var(--color-text)]">Không bao giờ</option>
              </select>
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
          <Button variant="primary" onClick={onClose}>Lưu cài đặt</Button>
        </div>
      </div>
    </>
  );
}
