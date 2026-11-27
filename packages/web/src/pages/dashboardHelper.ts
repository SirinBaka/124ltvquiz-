import type { Quiz, Attempt } from "@ltvquiz/shared";

export type DashboardTab = "quizzes" | "attempts";

export type DashboardSummary = {
  totalQuizzes: number;
  publishedCount: number;
  draftCount: number;
  totalAttempts: number;
  averageScore: number;
};

export function formatAttemptTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}p ${secs}s`;
}

export function getScoreColorClass(score: number, totalPoints: number): string {
  if (totalPoints <= 0) return "text-[var(--color-primary)]";
  const ratio = score / totalPoints;
  if (ratio >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (ratio >= 0.5) return "text-blue-600 dark:text-blue-400";
  return "text-amber-600 dark:text-amber-400";
}

export function filterQuizzesBySearch(
  quizzes: Quiz[],
  searchQuery: string,
): Quiz[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return quizzes;
  return quizzes.filter((q) => q.title.toLowerCase().includes(query));
}

export function filterAttemptsBySearch(
  attempts: Attempt[],
  quizMap: Map<string, string>,
  searchQuery: string,
): Attempt[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return attempts;

  return attempts.filter((att) => {
    const studentMatch = (att.studentName || "").toLowerCase().includes(query);
    const classMatch = (att.studentClass || "").toLowerCase().includes(query);
    const quizTitle = (quizMap.get(att.quizId) || "").toLowerCase();
    const quizMatch = quizTitle.includes(query);

    return studentMatch || classMatch || quizMatch;
  });
}

export function calculateDashboardSummary(
  quizzes: Quiz[],
  attempts: Attempt[],
): DashboardSummary {
  const totalQuizzes = quizzes.length;
  let publishedCount = 0;
  let draftCount = 0;

  for (const q of quizzes) {
    if (q.status === "published") publishedCount++;
    else if (q.status === "draft") draftCount++;
  }

  const totalAttempts = attempts.length;
  let scoreSum = 0;
  for (const att of attempts) {
    scoreSum += att.score;
  }
  const averageScore =
    totalAttempts > 0 ? Number((scoreSum / totalAttempts).toFixed(1)) : 0;

  return {
    totalQuizzes,
    publishedCount,
    draftCount,
    totalAttempts,
    averageScore,
  };
}

export interface ScoreDistribution {
  excellent: number; // >= 8.0 (80%)
  good: number;      // 6.5 - 7.9 (65% - 79%)
  average: number;   // 5.0 - 6.4 (50% - 64%)
  poor: number;      // < 5.0 (< 50%)
  total: number;
  percentages: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export function calculateScoreDistribution(
  attempts: Attempt[],
): ScoreDistribution {
  let excellent = 0;
  let good = 0;
  let average = 0;
  let poor = 0;
  const total = attempts.length;

  for (const att of attempts) {
    const totalPoints = att.totalPoints > 0 ? att.totalPoints : 10;
    const ratio = att.score / totalPoints;

    if (ratio >= 0.8) {
      excellent++;
    } else if (ratio >= 0.65) {
      good++;
    } else if (ratio >= 0.5) {
      average++;
    } else {
      poor++;
    }
  }

  const getPercent = (count: number) =>
    total > 0 ? Math.round((count / total) * 100) : 0;

  return {
    excellent,
    good,
    average,
    poor,
    total,
    percentages: {
      excellent: getPercent(excellent),
      good: getPercent(good),
      average: getPercent(average),
      poor: getPercent(poor),
    },
  };
}

export interface AntiCheatStats {
  cleanAttempts: number;
  violationAttempts: number;
  totalViolations: number;
  honestPercent: number;
}

export function calculateAntiCheatStats(attempts: Attempt[]): AntiCheatStats {
  let violationAttempts = 0;
  let totalViolations = 0;

  for (const att of attempts) {
    const count = att.violationCount || 0;
    if (count > 0) {
      violationAttempts++;
      totalViolations += count;
    }
  }

  const total = attempts.length;
  const cleanAttempts = total - violationAttempts;
  const honestPercent =
    total > 0 ? Number(((cleanAttempts / total) * 100).toFixed(1)) : 100;

  return {
    cleanAttempts,
    violationAttempts,
    totalViolations,
    honestPercent,
  };
}

export function calculateUniqueStudentsAndClasses(attempts: Attempt[]): {
  studentCount: number;
  classCount: number;
} {
  const students = new Set<string>();
  const classes = new Set<string>();

  for (const att of attempts) {
    if (att.studentName && att.studentName.trim()) {
      students.add(att.studentName.trim().toLowerCase());
    }
    if (att.studentClass && att.studentClass.trim()) {
      classes.add(att.studentClass.trim().toUpperCase());
    }
  }

  return {
    studentCount: students.size,
    classCount: classes.size,
  };
}

export function formatSubmissionDate(dateStr?: string): string {
  if (!dateStr) return "Vừa xong";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Gần đây";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Gần đây";
  }
}
