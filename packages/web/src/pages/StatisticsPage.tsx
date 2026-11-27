import { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { BarChart3, Users, Flame, Award, TrendingUp, ArrowRight } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { StorageService } from '../services/storageService';
import type { Quiz, Attempt } from '@ltvquiz/shared';
import { useNavigate, Link } from 'react-router-dom';

export function StatisticsPage() {
  useDocumentTitle('A4 LTVQuiz - Thống kê số liệu');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setQuizzes(StorageService.getQuizzes());
    setAttempts(StorageService.getAttempts());
  }, []);

  const totalQuizzes = quizzes.length;
  const totalAttempts = attempts.length;

  const averageScore = useMemo(() => {
    if (attempts.length === 0) return '0.0';
    const sum = attempts.reduce((acc, a) => acc + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 10 : 0), 0);
    return (sum / attempts.length).toFixed(1);
  }, [attempts]);

  const scoreDistribution = useMemo(() => {
    const dist = { poor: 0, average: 0, good: 0, excellent: 0 };
    if (attempts.length === 0) return dist;

    attempts.forEach(a => {
      const scaledScore = a.totalPoints > 0 ? (a.score / a.totalPoints) * 10 : 0;
      if (scaledScore < 5) dist.poor++;
      else if (scaledScore < 6.5) dist.average++;
      else if (scaledScore < 8.0) dist.good++;
      else dist.excellent++;
    });

    return dist;
  }, [attempts]);

  const maxStreakRecord = useMemo(() => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.maxStreak || 0));
  }, [attempts]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            Thống kê & Phân tích phòng thi
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
            Tổng quan hiệu quả các bài kiểm tra, phổ điểm số và phân bố năng lực học sinh.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/dashboard/results')}
          >
            <span>Bảng điểm chi tiết</span>
          </Button>
        </div>
      </div>

      {/* 4 Summary Stat Panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Tổng số bài kiểm tra
            </span>
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <BarChart3 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] tabular-nums tracking-tight">
              {totalQuizzes}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Đề thi trong hệ thống
            </p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Tổng lượt làm bài
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
              {totalAttempts}
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Bài nộp được ghi nhận
            </p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Điểm trung bình
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Award size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
              {totalAttempts > 0 ? averageScore : '--'}
              <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">
                / 10
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Quy đổi thang điểm 10
            </p>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Kỷ lục chuỗi đúng
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight flex items-center gap-1.5">
              <Flame size={20} className="fill-amber-500 text-amber-500" />
              <span>{maxStreakRecord}</span>
              <span className="text-xs font-normal text-[var(--color-text-muted)]">câu liên tiếp</span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              Thành tích cao nhất lớp
            </p>
          </div>
        </Card>
      </div>

      {/* Main Charts & Analytics Area */}
      {totalAttempts === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-background)] flex items-center justify-center mb-3 text-[var(--color-text-secondary)]">
            <BarChart3 size={18} />
          </div>
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-1">
            Chưa có đủ dữ liệu thống kê
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            Sau khi học sinh vào làm bài và nộp bài kiểm tra, biểu đồ phổ điểm số và danh sách đề thi nổi bật sẽ tự động hiển thị tại đây.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Score Distribution Chart */}
          <Card className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="font-semibold text-sm text-[var(--color-text)]">
                  Phổ điểm bài thi
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Phân bố điểm số theo các mức học lực
                </p>
              </div>
              <Badge status="primary">
                {totalAttempts} lượt nộp
              </Badge>
            </div>

            <div className="space-y-4 pt-1">
              {[
                { label: 'Giỏi & Xuất sắc (8.0 - 10.0)', count: scoreDistribution.excellent, color: 'bg-emerald-500' },
                { label: 'Khá (6.5 - 7.9)', count: scoreDistribution.good, color: 'bg-blue-500' },
                { label: 'Trung bình (5.0 - 6.4)', count: scoreDistribution.average, color: 'bg-amber-500' },
                { label: 'Dưới trung bình (< 5.0)', count: scoreDistribution.poor, color: 'bg-rose-500' },
              ].map(item => {
                const percentage = totalAttempts > 0 ? ((item.count / totalAttempts) * 100).toFixed(0) : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[var(--color-text)]">{item.label}</span>
                      <span className="text-[var(--color-text-secondary)] font-semibold tabular-nums">
                        {item.count} HS ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden border border-[var(--color-border)]">
                      <div 
                        className={`h-full ${item.color} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Quizzes by Participation */}
          <Card className="lg:col-span-6 p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h3 className="font-semibold text-sm text-[var(--color-text)]">
                  Đề thi tham gia nhiều nhất
                </h3>
                <p className="text-[11px] text-[var(--color-text-secondary)]">
                  Xếp hạng theo tổng số lượt học sinh nộp bài
                </p>
              </div>
              <Link
                to="/dashboard/quizzes"
                className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {quizzes.slice(0, 5).map(quiz => {
                const count = attempts.filter(a => a.quizId === quiz.id).length;
                return (
                  <div key={quiz.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/editor/${quiz.id}`}
                        className="font-semibold text-xs sm:text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate block"
                      >
                        {quiz.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        <span>{quiz.questions.length} câu hỏi</span>
                        <span>•</span>
                        {quiz.status === 'published' ? (
                          <Badge status="success">Xuất bản</Badge>
                        ) : (
                          <Badge status="default">Bản nháp</Badge>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-bold text-xs text-[var(--color-text)] tabular-nums block">
                        {count} lượt nộp
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
