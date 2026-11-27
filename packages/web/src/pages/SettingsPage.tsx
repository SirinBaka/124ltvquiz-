import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { 
  User, 
  FilePlus2, 
  List, 
  Users, 
  Bell, 
  Palette, 
  Shield, 
  Check, 
  Lock, 
  Smartphone, 
  Laptop, 
  Plus, 
  Trash2, 
  Volume2, 
  AlertTriangle, 
  KeyRound, 
  School, 
  Phone, 
  Mail, 
  Sun,
  Moon,
  Monitor,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useTheme } from '../components/theme/ThemeProvider';

interface ClassItem {
  id: string;
  name: string;
  school: string;
  studentsCount: number;
  code: string;
}

export function SettingsPage() {
  useDocumentTitle('A4 LTVQuiz - Cài đặt');
  const [activeTab, setActiveTab] = useState('account');
  const { theme, setTheme } = useTheme();

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // 1. Account State
  const [accountName, setAccountName] = useState('Lê Việt Tân');
  const [accountEmail] = useState('admin@ltvquiz.edu.vn');
  const [accountPhone, setAccountPhone] = useState('0901105860');
  const [showPhone, setShowPhone] = useState(false);
  const [accountSchool, setAccountSchool] = useState('');
  const [accountRole, setAccountRole] = useState('Quản trị viên');
  const [accountBio, setAccountBio] = useState('Phát triển nền tảng tạo bài kiểm tra tự động LTVQuiz cho học sinh và giáo viên.');

  // 2. Quiz Defaults State
  const [defaultDuration, setDefaultDuration] = useState(45);
  const [defaultAttempts, setDefaultAttempts] = useState('1');
  const [defaultScoreScale, setDefaultScoreScale] = useState('10');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [autoSubmitOnBlur, setAutoSubmitOnBlur] = useState(true);
  const [blurLimit, setBlurLimit] = useState(3);
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [autoSaveProgress, setAutoSaveProgress] = useState(true);

  // 3. Results Defaults State
  const [showScoreImmediately, setShowScoreImmediately] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [anonymousLeaderboard, setAnonymousLeaderboard] = useState(false);
  const [passingScore, setPassingScore] = useState(5.0);

  // 4. Students & Classes State
  const [classes, setClasses] = useState<ClassItem[]>([
    { id: '1', name: 'Lớp 12A4', school: '', studentsCount: 38, code: '12A4' },
    { id: '2', name: 'Lớp 12 Toán', school: '', studentsCount: 35, code: 'TOAN12' },
    { id: '3', name: 'Kíp 3 - Luyện thi TSA 2026', school: 'Khối dự thi TSA', studentsCount: 52, code: 'TSA2026' }
  ]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [showAddClass, setShowAddClass] = useState(false);

  // 5. Notifications State
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifyZaloGroup, setNotifyZaloGroup] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [ocrWarningNotify, setOcrWarningNotify] = useState(true);

  // 6. Appearance State
  const [accentColor, setAccentColor] = useState('blue');
  const [fontSize, setFontSize] = useState('normal');
  const [smoothAnimations, setSmoothAnimations] = useState(true);

  // 7. Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Load saved settings from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ltvquiz_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accountName) setAccountName(parsed.accountName);
        if (parsed.accountPhone) setAccountPhone(parsed.accountPhone);
        if (parsed.accountSchool) setAccountSchool(parsed.accountSchool);
        if (parsed.accountRole) setAccountRole(parsed.accountRole);
        if (parsed.accountBio) setAccountBio(parsed.accountBio);
        if (parsed.defaultDuration !== undefined) setDefaultDuration(parsed.defaultDuration);
        if (parsed.defaultAttempts) setDefaultAttempts(parsed.defaultAttempts);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
        if (parsed.fontSize) setFontSize(parsed.fontSize);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleSaveSettings = (sectionName: string) => {
    try {
      const settingsToSave = {
        accountName,
        accountPhone,
        accountSchool,
        accountRole,
        accountBio,
        defaultDuration,
        defaultAttempts,
        defaultScoreScale,
        shuffleQuestions,
        shuffleOptions,
        autoSubmitOnBlur,
        blurLimit,
        disableCopyPaste,
        showScoreImmediately,
        allowReview,
        showCorrectAnswers,
        showLeaderboard,
        anonymousLeaderboard,
        passingScore,
        notifyOnSubmission,
        soundEnabled,
        notifyZaloGroup,
        weeklyDigest,
        accentColor,
        fontSize,
        smoothAnimations,
        twoFactorEnabled
      };
      localStorage.setItem('ltvquiz_settings', JSON.stringify(settingsToSave));
      showToast(`Đã lưu thành công cài đặt ${sectionName}!`);
    } catch {
      showToast(`Lưu cài đặt ${sectionName} thất bại.`);
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const code = newClassCode.trim() || `LTV${Math.floor(1000 + Math.random() * 9000)}`;
    const newClass: ClassItem = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      school: accountSchool || '',
      studentsCount: 0,
      code: code.toUpperCase()
    };
    setClasses([...classes, newClass]);
    setNewClassName('');
    setNewClassCode('');
    setShowAddClass(false);
    showToast(`Đã tạo lớp ${newClass.name} với mã ${newClass.code}`);
  };

  const handleDeleteClass = (id: string, name: string) => {
    setClasses(classes.filter(c => c.id !== id));
    showToast(`Đã xóa lớp ${name}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép: ${text}`);
  };

  const tabs = [
    { id: 'account', label: 'Tài khoản', icon: <User size={18} /> },
    { id: 'quizzes', label: 'Bài kiểm tra', icon: <FilePlus2 size={18} /> },
    { id: 'results', label: 'Kết quả', icon: <List size={18} /> },
    { id: 'students', label: 'Học sinh & Lớp học', icon: <Users size={18} /> },
    { id: 'notifications', label: 'Thông báo', icon: <Bell size={18} /> },
    { id: 'appearance', label: 'Giao diện', icon: <Palette size={18} /> },
    { id: 'security', label: 'Bảo mật', icon: <Shield size={18} /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl px-4 py-3 rounded-xl text-sm font-medium text-[var(--color-text)] animate-fade-in-up">
          <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
            <Check size={13} />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">Cài đặt & Tùy chọn hệ thống</h1>
        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">Quản lý thông tin tài khoản giáo viên, thiết lập mặc định phòng thi và giao diện.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1 bg-[var(--color-surface)] p-1.5 rounded-xl border border-[var(--color-border)] shadow-2xs custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer select-none ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-primary)] text-white font-semibold shadow-2xs'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Settings Content */}
        <div className="flex-1 max-w-3xl space-y-6">

          {/* TAB 1: TÀI KHOẢN */}
          {activeTab === 'account' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Thông tin tài khoản</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Thông tin này sẽ được hiển thị khi bạn tạo và chia sẻ đề thi.</p>
              </div>

              <Card className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8 pb-6 border-b border-[var(--color-border)]">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--color-primary)] to-blue-400 text-white text-3xl font-extrabold flex items-center justify-center shadow-md">
                    {accountName ? accountName.charAt(0) : 'T'}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" className="h-9 px-4 text-xs font-semibold" onClick={() => showToast('Chức năng tải ảnh hồ sơ đang sẵn sàng.')}>
                        Đổi ảnh đại diện
                      </Button>
                      <Button variant="secondary" className="h-9 px-3 text-xs text-red-500 hover:text-red-600" onClick={() => showToast('Đã đặt lại avatar mặc định.')}>
                        Gỡ ảnh
                      </Button>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Định dạng JPG, PNG hoặc GIF. Dung lượng tối đa 2MB.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5">Họ và tên</label>
                    <input 
                      type="text" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5 flex items-center gap-1.5">
                      <Mail size={13} /> Email tài khoản
                    </label>
                    <input 
                      type="email" 
                      value={accountEmail} 
                      disabled 
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-gray-100 dark:bg-gray-800/60 text-gray-400 text-sm cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase flex items-center gap-1.5">
                        <Phone size={13} /> Số điện thoại / Zalo
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPhone(!showPhone)}
                        className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
                      >
                        {showPhone ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showPhone ? 'Ẩn số' : 'Hiện số'}
                      </button>
                    </div>
                    <input 
                      type={showPhone ? 'text' : 'password'} 
                      value={accountPhone}
                      onChange={(e) => setAccountPhone(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all font-mono" 
                    />
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                      Số điện thoại đang được bảo mật và ẩn trên hồ sơ công khai
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5 flex items-center gap-1.5">
                      <School size={13} /> Trường học / Đơn vị
                    </label>
                    <input 
                      type="text" 
                      value={accountSchool}
                      onChange={(e) => setAccountSchool(e.target.value)}
                      placeholder="Nhập trường học / đơn vị..."
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5">Vai trò / Bộ môn</label>
                    <input 
                      type="text" 
                      value={accountRole}
                      onChange={(e) => setAccountRole(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase mb-1.5">Giới thiệu ngắn</label>
                    <textarea 
                      rows={3}
                      value={accountBio}
                      onChange={(e) => setAccountBio(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-all" 
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => handleSaveSettings('tài khoản')}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: BÀI KIỂM TRA (DEFAULTS) */}
          {activeTab === 'quizzes' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Cài đặt mặc định bài kiểm tra</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Các giá trị này sẽ tự động điền khi bạn tạo đề kiểm tra mới.</p>
              </div>

              <Card className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Thời gian làm bài mặc định (phút)</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input 
                      type="number" 
                      value={defaultDuration} 
                      onChange={(e) => setDefaultDuration(Number(e.target.value))}
                      className="w-32 h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]" 
                    />
                    {[15, 45, 60, 90, 120].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDefaultDuration(preset)}
                        className={`h-10 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          defaultDuration === preset 
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                        }`}
                      >
                        {preset} phút
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Số lần làm tối đa</label>
                    <select
                      value={defaultAttempts}
                      onChange={(e) => setDefaultAttempts(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="1">1 lần duy nhất</option>
                      <option value="2">2 lần</option>
                      <option value="3">3 lần</option>
                      <option value="unlimited">Không giới hạn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--color-text)] mb-2">Thang điểm chuẩn</label>
                    <select
                      value={defaultScoreScale}
                      onChange={(e) => setDefaultScoreScale(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="10">Thang 10 điểm (Chuẩn GD&ĐT)</option>
                      <option value="100">Thang 100 điểm</option>
                      <option value="tsa">Thang 100 điểm (Kỳ thi Đánh giá tư duy TSA)</option>
                      <option value="hsa">Thang 150 điểm (Kỳ thi Đánh giá năng lực HSA)</option>
                    </select>
                  </div>
                </div>

                <hr className="border-[var(--color-border)]" />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Quy tắc trộn đề & Giám sát</h3>
                  
                  <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">Tự động xáo trộn câu hỏi</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Mỗi học sinh sẽ nhận được thứ tự câu hỏi khác nhau.</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={shuffleQuestions} 
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">Tự động xáo trộn các phương án A/B/C/D</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Vị trí đáp án đúng sẽ thay đổi ngẫu nhiên giữa các thí sinh.</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={shuffleOptions} 
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">Cấm sao chép nội dung & Khóa chuột phải</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Ngăn học sinh sao chép nội dung câu hỏi để tra cứu bên ngoài.</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={disableCopyPaste} 
                      onChange={(e) => setDisableCopyPaste(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>

                  <div className="p-3 rounded-xl border border-[var(--color-border)] space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text)]">Tự động nộp bài khi chuyển tab quá số lần</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">Giám sát khi học sinh rời khỏi giao diện làm bài.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={autoSubmitOnBlur} 
                        onChange={(e) => setAutoSubmitOnBlur(e.target.checked)}
                        className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                      />
                    </label>
                    {autoSubmitOnBlur && (
                      <div className="flex items-center gap-3 pt-2 border-t border-[var(--color-border)]">
                        <span className="text-xs text-[var(--color-text-secondary)]">Số lần cảnh báo trước khi tự động nộp:</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={10} 
                          value={blurLimit}
                          onChange={(e) => setBlurLimit(Number(e.target.value))}
                          className="w-16 h-8 px-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-background)] text-center font-bold" 
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">lần</span>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-background)] transition-colors cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text)]">Tự động lưu tiến độ làm bài mỗi 10 giây</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Hạn chế tối đa rủi ro mất bài khi mất kết nối mạng.</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoSaveProgress} 
                      onChange={(e) => setAutoSaveProgress(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => handleSaveSettings('bài kiểm tra')}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: KẾT QUẢ & CHẤM THI */}
          {activeTab === 'results' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Mặc định hiển thị kết quả & Chấm thi</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Kiểm soát thông tin học sinh được xem sau khi hoàn thành bài nộp.</p>
              </div>

              <Card className="p-6 space-y-4">
                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Hiển thị điểm ngay sau khi nộp</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Học sinh biết ngay số điểm đạt được khi nhấn nút nộp bài.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showScoreImmediately} 
                    onChange={(e) => setShowScoreImmediately(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Cho phép xem lại toàn bộ bài làm</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Học sinh xem lại các phương án đã chọn trong từng câu hỏi.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={allowReview} 
                    onChange={(e) => setAllowReview(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Hiển thị đáp án đúng và lời giải chi tiết</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Cung cấp hướng dẫn giải bài để học sinh tự ôn tập và rút kinh nghiệm.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={showCorrectAnswers} 
                    onChange={(e) => setShowCorrectAnswers(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <hr className="border-[var(--color-border)]" />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Bảng xếp hạng & Tiêu chuẩn điểm</h3>
                  
                  <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-text)]">Bật bảng xếp hạng vinh danh</span>
                      <p className="text-xs text-[var(--color-text-secondary)]">Hiển thị danh sách top điểm cao nhất của bài thi.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={showLeaderboard} 
                      onChange={(e) => setShowLeaderboard(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-text)]">Chế độ xếp hạng ẩn danh</span>
                      <p className="text-xs text-[var(--color-text-secondary)]">Ẩn họ tên thật của học sinh, chỉ hiện mã dự thi hoặc biệt danh.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={anonymousLeaderboard} 
                      onChange={(e) => setAnonymousLeaderboard(e.target.checked)}
                      className="w-5 h-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer" 
                    />
                  </label>

                  <div className="p-3.5 border border-[var(--color-border)] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-text)]">Điểm đạt tối thiểu (Thang 10)</span>
                      <p className="text-xs text-[var(--color-text-secondary)]">Học sinh đạt từ mức điểm này trở lên sẽ tính là "Đạt".</p>
                    </div>
                    <input 
                      type="number" 
                      step="0.5" 
                      min="1" 
                      max="10" 
                      value={passingScore} 
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="w-20 h-9 px-2 text-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm font-bold text-[var(--color-primary)]" 
                    />
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => handleSaveSettings('kết quả')}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}

          {/* TAB 4: HỌC SINH & LỚP HỌC */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text)]">Quản lý Lớp học & Học sinh</h2>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tổ chức lớp học và phân phối mã làm bài cho từng nhóm học sinh.</p>
                </div>
                <Button variant="primary" className="h-9 px-3.5 text-xs flex items-center gap-1.5" onClick={() => setShowAddClass(!showAddClass)}>
                  <Plus size={15} /> Thêm lớp mới
                </Button>
              </div>

              {/* Form thêm lớp mới */}
              {showAddClass && (
                <Card className="p-5 border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5 animate-fade-in-up">
                  <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">Tạo lớp học mới</h3>
                  <form onSubmit={handleAddClass} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Tên lớp học</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: Lớp 12A4 Ôn tập" 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        required
                        className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Mã lớp (Tùy chọn)</label>
                      <input 
                        type="text" 
                        placeholder="VD: LTV12" 
                        value={newClassCode}
                        onChange={(e) => setNewClassCode(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm uppercase" 
                      />
                    </div>
                    <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                      <Button variant="secondary" type="button" className="h-8 px-3 text-xs" onClick={() => setShowAddClass(false)}>
                        Hủy
                      </Button>
                      <Button variant="primary" type="submit" className="h-8 px-4 text-xs">
                        Xác nhận tạo lớp
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Danh sách lớp */}
              <div className="space-y-3">
                {classes.map((cls) => (
                  <Card key={cls.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[var(--color-primary)]/40 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-base shrink-0">
                        <School size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[var(--color-text)] text-sm">{cls.name}</h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                            Mã: {cls.code}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{cls.school ? `${cls.school} • ` : ''}{cls.studentsCount} học sinh</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button 
                        variant="secondary" 
                        className="h-8 px-2.5 text-xs flex items-center gap-1"
                        onClick={() => copyToClipboard(cls.code)}
                        title="Sao chép mã lớp"
                      >
                        <Copy size={13} /> Sao chép mã
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="h-8 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                        title="Xóa lớp"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-bold text-[var(--color-text)]">Quyền tham gia của học sinh</h3>
                <label className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)]">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text)]">Cho phép học sinh tự ghi danh bằng mã lớp</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Học sinh nhập mã lớp để tự động được thêm vào danh sách.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[var(--color-primary)]" />
                </label>
                <label className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)]">
                  <div>
                    <span className="text-sm font-medium text-[var(--color-text)]">Yêu cầu xác nhận phê duyệt thành viên mới</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Giáo viên cần duyệt trước khi học sinh có thể tham gia làm bài.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 rounded text-[var(--color-primary)]" />
                </label>
              </Card>
            </div>
          )}

          {/* TAB 5: THÔNG BÁO */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Cài đặt thông báo & Cảnh báo</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Tùy chỉnh các kênh và thời điểm bạn muốn nhận tin báo từ LTVQuiz.</p>
              </div>

              <Card className="p-6 space-y-4">
                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Thông báo khi có học sinh nộp bài mới</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Hiển thị thông báo tức thời ngay trên giao diện giáo viên.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifyOnSubmission} 
                    onChange={(e) => setNotifyOnSubmission(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-text)]">Phát âm thanh thông báo</span>
                      <p className="text-xs text-[var(--color-text-secondary)]">Phát chuông nhẹ nhàng khi có học sinh nộp bài kiểm tra.</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={soundEnabled} 
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Gửi kết quả đồng bộ qua Zalo</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Gửi thông báo tổng hợp lên nhóm Zalo lớp học LTVQuiz.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifyZaloGroup} 
                    onChange={(e) => setNotifyZaloGroup(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Báo cáo tổng hợp hàng tuần qua Email</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Nhận email thống kê số lượt làm bài và phổ điểm các kỳ thi mỗi thứ Hai.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={weeklyDigest} 
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Cảnh báo lỗi tài liệu OCR</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Thông báo khi tài liệu PDF hoặc hình ảnh có câu hỏi nhận diện chưa trọn vẹn.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={ocrWarningNotify} 
                    onChange={(e) => setOcrWarningNotify(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => handleSaveSettings('thông báo')}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}

          {/* TAB 6: GIAO DIỆN & TRẢI NGHIỆM */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Tùy biến giao diện & Hiển thị</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Cá nhân hóa giao diện làm việc theo sở thích của bạn.</p>
              </div>

              <Card className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">Chủ đề giao diện (Theme)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                        theme === 'light'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                      }`}
                    >
                      <Sun size={20} />
                      <span className="text-xs">Sáng (Light)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                        theme === 'dark'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                      }`}
                    >
                      <Moon size={20} />
                      <span className="text-xs">Tối (Dark)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                        theme === 'system'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                      }`}
                    >
                      <Monitor size={20} />
                      <span className="text-xs">Theo hệ thống</span>
                    </button>
                  </div>
                </div>

                <hr className="border-[var(--color-border)]" />

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">Màu sắc chủ đạo (Accent Color)</label>
                  <div className="flex items-center gap-4">
                    {[
                      { id: 'blue', name: 'Xanh LTV', bg: 'bg-[#0068ff]' },
                      { id: 'emerald', name: 'Xanh ngọc', bg: 'bg-[#10b981]' },
                      { id: 'violet', name: 'Tím hiện đại', bg: 'bg-[#8b5cf6]' },
                      { id: 'amber', name: 'Cam Kahoot', bg: 'bg-[#f59e0b]' }
                    ].map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setAccentColor(color.id);
                          showToast(`Đã chọn màu chủ đạo: ${color.name}`);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          accentColor === color.id
                            ? 'border-[var(--color-text)] bg-[var(--color-background)] shadow-sm'
                            : 'border-[var(--color-border)] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${color.bg}`} />
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-[var(--color-border)]" />

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text)] mb-3">Kích thước cỡ chữ nội dung đề thi</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'compact', label: 'Nhỏ gọn (14px)' },
                      { id: 'normal', label: 'Tiêu chuẩn (16px)' },
                      { id: 'large', label: 'Lớn dễ đọc (18px)' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFontSize(item.id)}
                        className={`py-2.5 px-3 rounded-lg border text-xs text-center transition-all ${
                          fontSize === item.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 border border-[var(--color-border)] rounded-xl cursor-pointer hover:bg-[var(--color-background)] transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-[var(--color-text)]">Hiệu ứng chuyển cảnh động (Micro-animations)</span>
                    <p className="text-xs text-[var(--color-text-secondary)]">Bật hoạt ảnh lướt trang mượt mà khi thao tác.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={smoothAnimations} 
                    onChange={(e) => setSmoothAnimations(e.target.checked)}
                    className="w-5 h-5 rounded text-[var(--color-primary)] cursor-pointer" 
                  />
                </label>
              </Card>

              <div className="flex justify-end">
                <Button variant="primary" onClick={() => handleSaveSettings('giao diện')}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          )}

          {/* TAB 7: BẢO MẬT & PHIÊN ĐĂNG NHẬP */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
              <div className="border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-text)]">Bảo mật tài khoản & Phiên đăng nhập</h2>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Bảo vệ thông tin cá nhân và quản lý các thiết bị đang truy cập.</p>
              </div>

              {/* Đổi mật khẩu */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={18} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--color-text)]">Đổi mật khẩu</h3>
                </div>
                
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Mật khẩu hiện tại</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Tối thiểu 8 ký tự" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">Xác nhận mật khẩu mới</label>
                    <input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu mới" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-sm" 
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    className="mt-2 text-xs h-9 px-4"
                    onClick={() => {
                      if (!currentPassword || !newPassword) {
                        showToast('Vui lòng nhập đầy đủ mật khẩu.');
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        showToast('Mật khẩu mới không trùng khớp.');
                        return;
                      }
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      showToast('Đã đổi mật khẩu thành công!');
                    }}
                  >
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </Card>

              {/* 2FA */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text)]">Xác thực hai yếu tố (2FA)</h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Bảo vệ tài khoản qua mã OTP Zalo / SMS số {accountPhone ? `${accountPhone.slice(0, 4)}••••${accountPhone.slice(-2)}` : '••••••••••'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      showToast(twoFactorEnabled ? 'Đã tắt 2FA' : 'Đã kích hoạt 2FA');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      twoFactorEnabled 
                        ? 'bg-green-500/10 text-green-600 border-green-500/30'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300'
                    }`}
                  >
                    {twoFactorEnabled ? 'Đang kích hoạt' : 'Đã tắt'}
                  </button>
                </div>
              </Card>

              {/* Active Sessions */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-[var(--color-text)]">Các thiết bị đang đăng nhập</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-background)]">
                    <div className="flex items-center gap-3">
                      <Laptop size={18} className="text-[var(--color-primary)]" />
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                          Windows 11 • Trình duyệt Chrome 
                          <span className="text-[10px] text-green-600 font-normal bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                            Thiết bị này
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-secondary)]">TP. Hồ Chí Minh • Đang hoạt động</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} className="text-gray-400" />
                      <div>
                        <div className="text-xs font-bold text-[var(--color-text)]">iPhone 15 Pro • Safari Mobile</div>
                        <p className="text-[11px] text-[var(--color-text-secondary)]">TP. Hồ Chí Minh • Hoạt động 2 giờ trước</p>
                      </div>
                    </div>
                    <Button variant="secondary" className="h-8 px-2.5 text-xs text-red-500" onClick={() => showToast('Đã đăng xuất thiết bị iPhone.')}>
                      Đăng xuất
                    </Button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="secondary" className="text-xs h-9" onClick={() => showToast('Đã đăng xuất khỏi tất cả thiết bị khác.')}>
                    Đăng xuất khỏi tất cả thiết bị khác
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Danger Zone (Hiển thị ở tab Security và Account) */}
          {(activeTab === 'security' || activeTab === 'account') && (
            <div className="mt-12 pt-8 border-t border-red-200 dark:border-red-900/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Khu vực nguy hiểm</h2>
              </div>
              <Card className="p-6 border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center pb-4 border-b border-red-200/60 dark:border-red-900/20">
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Xóa dữ liệu thi và bài làm nháp</h3>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Đặt lại toàn bộ các bài thi đã tạo về trạng thái trắng.</p>
                  </div>
                  <Button 
                    variant="danger" 
                    className="shrink-0 h-9 text-xs"
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn xóa tất cả bài thi và kết quả không?')) {
                        localStorage.removeItem('ltvquiz_quizzes');
                        localStorage.removeItem('ltvquiz_attempts');
                        showToast('Đã dọn dẹp dữ liệu bài thi.');
                      }
                    }}
                  >
                    Dọn dữ liệu
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Xóa vĩnh viễn tài khoản</h3>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">Toàn bộ hồ sơ giáo viên, đề thi và dữ liệu học sinh sẽ bị hủy.</p>
                  </div>
                  <Button 
                    variant="danger" 
                    className="shrink-0 h-9 text-xs"
                    onClick={() => {
                      if (confirm('Hành động này KHÔNG THỂ HOÀN TÁC. Bạn có chắc muốn xóa tài khoản không?')) {
                        showToast('Yêu cầu xóa tài khoản đã được ghi nhận.');
                      }
                    }}
                  >
                    Xóa tài khoản
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
