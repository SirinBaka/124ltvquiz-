import { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Search, CheckCircle2, Flame, Clock, ShieldAlert, ShieldCheck, FileSpreadsheet, X } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StorageService } from '../services/storageService';
import type { Quiz, Attempt } from '@ltvquiz/shared';
import { exportStudentResultToCsv } from '../services/studentExportHelper';
import { getScoreColorClass } from './dashboardHelper';

export function ResultsPage() {
  useDocumentTitle('A4 LTVQuiz - Kết quả làm bài');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('all');

  useEffect(() => {
    setQuizzes(StorageService.getQuizzes());
    setAttempts([...StorageService.getAttempts()].reverse());
  }, []);

  const quizMap = useMemo(() => {
    const map = new Map<string, string>();
    quizzes.forEach(q => map.set(q.id, q.title));
    return map;
  }, [quizzes]);

  const handleExportStudent = (att: Attempt) => {
    const targetQuiz: Quiz | null = quizzes.find(q => q.id === att.quizId) || StorageService.getQuiz(att.quizId);
    if (targetQuiz) {
      exportStudentResultToCsv(att, targetQuiz);
    } else {
      alert('Không tìm thấy dữ liệu đề thi của bài làm này.');
    }
  };

  const filteredAttempts = useMemo(() => {
    return attempts.filter(att => {
      const matchSearch = search.trim() === '' || 
        att.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (att.studentClass && att.studentClass.toLowerCase().includes(search.toLowerCase())) ||
        (att.examCode && att.examCode.toLowerCase().includes(search.toLowerCase()));

      const matchQuiz = selectedQuizId === 'all' || att.quizId === selectedQuizId;

      return matchSearch && matchQuiz;
    });
  }, [attempts, search, selectedQuizId]);

  const handleExportCsv = () => {
    if (filteredAttempts.length === 0) {
      alert('Không có dữ liệu kết quả để xuất.');
      return;
    }

    const headers = ['Họ và tên thí sinh', 'Lớp', 'Mã đề', 'Bài kiểm tra', 'Điểm', 'Tổng điểm', 'Chuỗi Streak', 'Số lần vi phạm gian lận', 'Thời gian làm (giây)', 'Ngày nộp'];
    const rows = filteredAttempts.map(att => [
      `"${att.studentName.replace(/"/g, '""')}"`,
      `"${(att.studentClass || '').replace(/"/g, '""')}"`,
      `"${(att.examCode || '—').replace(/"/g, '""')}"`,
      `"${(quizMap.get(att.quizId) || 'Bài kiểm tra').replace(/"/g, '""')}"`,
      att.score.toFixed(1),
      att.totalPoints,
      att.maxStreak || 0,
      att.violationCount || 0,
      att.timeSpent,
      `"${new Date(att.createdAt).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ket_qua_thi_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Kết quả làm bài thi
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Theo dõi chi tiết kết quả, thời gian hoàn thành và dữ liệu giám sát tính trung thực của thí sinh.
          </p>
        </div>
        
        <Button 
          variant="secondary" 
          size="md"
          onClick={handleExportCsv} 
          disabled={filteredAttempts.length === 0}
          title="Xuất toàn bộ kết quả đang lọc ra file Excel"
        >
          <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>Xuất Excel danh sách</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none" size={14} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học sinh hoặc tên lớp..." 
            className="w-full h-9 pl-9 pr-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder-[var(--color-text-secondary)] text-xs focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
        
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:max-w-[60%]">
          <div className="relative min-w-0 flex-1 basis-full sm:basis-44">
            <select 
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              aria-label="Lọc kết quả theo bài kiểm tra"
              className="w-full min-h-11 sm:min-h-9 pl-3 pr-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs cursor-pointer font-medium"
            >
              <option value="all">Tất cả bài kiểm tra ({quizzes.length})</option>
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-[var(--color-text-secondary)] font-medium tabular-nums px-1">
            Tổng: <strong className="text-[var(--color-text)]">{filteredAttempts.length}</strong> bài nộp
          </span>
        </div>
      </Card>

      {/* Results Table Area */}
      {filteredAttempts.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] flex items-center justify-center mb-3 text-[var(--color-text-secondary)]">
            <CheckCircle2 size={18} />
          </div>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-1">
            Chưa có kết quả nộp bài nào phù hợp
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            {attempts.length === 0 
              ? 'Kết quả bài thi của học sinh sẽ tự động hiển thị tại đây ngay khi có bài nộp đầu tiên.' 
              : 'Không tìm thấy kết quả nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'}
          </p>
        </Card>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table role="table" aria-label="Danh sách kết quả làm bài" className="responsive-table w-full text-left text-xs md:min-w-[780px]">
              <thead role="rowgroup" className="bg-[var(--color-background)] border-b border-[var(--color-border)] text-[var(--color-text-secondary)] select-none">
                <tr role="row">
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[180px]">
                    Thí sinh
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Lớp
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Mã đề
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap min-w-[200px]">
                    Bài kiểm tra
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Điểm số
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Chuỗi Streak
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Giám sát phòng thi
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    Thời gian làm
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-right">
                    Ngày nộp
                  </th>
                  <th role="columnheader" scope="col" className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap text-center">
                    Phiếu điểm
                  </th>
                </tr>
              </thead>
              <tbody role="rowgroup" className="divide-y divide-[var(--color-border)]">
                {filteredAttempts.map((att) => {
                  const quizTitle = quizMap.get(att.quizId) || 'Bài kiểm tra';
                  const isStreakMaster = (att.maxStreak || 0) >= 3;
                  const hasViolation = (att.violationCount || 0) > 0;
                  return (
                    <tr role="row" key={att.id} className="hover:bg-[var(--color-surface-hover)] transition-colors group">
                      <td role="cell" data-wide className="px-4 py-3.5 font-semibold text-[var(--color-text)] whitespace-nowrap">
                        {att.studentName}
                      </td>
                      <td role="cell" data-label="Lớp" className="px-4 py-3.5 whitespace-nowrap">
                        {att.studentClass ? (
                          <Badge status="info">
                            {att.studentClass}
                          </Badge>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td role="cell" data-label="Mã đề" className="px-4 py-3.5 whitespace-nowrap">
                        {att.examCode ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                            {att.examCode}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                      </td>
                      <td role="cell" data-wide data-label="Bài kiểm tra" className="px-4 py-3.5 text-[var(--color-text)] font-medium truncate max-w-xs" title={quizTitle}>
                        {quizTitle}
                      </td>
                      <td role="cell" data-label="Điểm số" className="px-4 py-3.5 whitespace-nowrap">
                        <span className="tabular-nums">
                          <span className={`font-bold text-xs sm:text-sm ${getScoreColorClass(att.score, att.totalPoints)}`}>
                            {att.score.toFixed(1)}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]"> / {att.totalPoints}</span>
                        </span>
                      </td>
                      <td role="cell" data-label="Chuỗi Streak" className="px-4 py-3.5 whitespace-nowrap">
                        {isStreakMaster ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                            <Flame size={12} className="text-amber-500 fill-amber-500" />
                            <span>Streak {att.maxStreak}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--color-text-secondary)] tabular-nums">
                            {att.maxStreak || 0} câu
                          </span>
                        )}
                      </td>
                      <td role="cell" data-label="Giám sát phòng thi" className="px-4 py-3.5 whitespace-nowrap">
                        {hasViolation ? (
                          <Badge status="danger" className="gap-1">
                            <ShieldAlert size={11} />
                            <span>{att.violationCount} vi phạm</span>
                          </Badge>
                        ) : (
                          <Badge status="success" className="gap-1">
                            <ShieldCheck size={11} />
                            <span>Hợp lệ</span>
                          </Badge>
                        )}
                      </td>
                      <td role="cell" data-label="Thời gian làm" className="px-4 py-3.5 text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} className="opacity-70" />
                          <span>{Math.floor(att.timeSpent / 60)}p {att.timeSpent % 60}s</span>
                        </span>
                      </td>
                      <td role="cell" data-wide data-label="Ngày nộp" className="px-4 py-3.5 text-right text-[11px] text-[var(--color-text-secondary)] whitespace-nowrap tabular-nums">
                        {new Date(att.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td role="cell" data-wide data-actions className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleExportStudent(att)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer active:scale-98"
                          title={`Xuất kết quả bài thi dạng Excel của ${att.studentName}`}
                        >
                          <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Xuất Excel</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
