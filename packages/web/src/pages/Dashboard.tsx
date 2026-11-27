import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getStaggerDelayMs } from "../components/motion/motionHelper";
import {
  FilePlus2,
  FolderKanban,
  ListOrdered,
  FileText,
  GraduationCap,
  BarChart3,
  Settings,
  Home,
  Calendar,
  Shuffle,
} from "lucide-react";

interface DashboardTile {
  label: string;
  path: string;
  icon: React.ReactNode;
  iconColorClass: string;
  iconBgClass: string;
}

export function Dashboard() {
  useDocumentTitle("A4 LTVQuiz - Bảng điều khiển phòng thi");
  const navigate = useNavigate();

  const currentDateString = useMemo(() => {
    return new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const featureTiles: DashboardTile[] = [
    {
      label: "Tạo đề thi",
      path: "/dashboard/create",
      icon: <FilePlus2 size={26} />,
      iconColorClass: "text-blue-600 dark:text-blue-400",
      iconBgClass: "bg-blue-500/10",
    },
    {
      label: "Xáo mã đề",
      path: "/dashboard/shuffle",
      icon: <Shuffle size={26} />,
      iconColorClass: "text-rose-600 dark:text-rose-400",
      iconBgClass: "bg-rose-500/10",
    },
    {
      label: "Kho đề",
      path: "/dashboard/library",
      icon: <FolderKanban size={26} />,
      iconColorClass: "text-amber-600 dark:text-amber-400",
      iconBgClass: "bg-amber-500/10",
    },
    {
      label: "Quản lý bài thi",
      path: "/dashboard/quizzes",
      icon: <ListOrdered size={26} />,
      iconColorClass: "text-indigo-600 dark:text-indigo-400",
      iconBgClass: "bg-indigo-500/10",
    },
    {
      label: "Tài liệu",
      path: "/dashboard/documents",
      icon: <FileText size={26} />,
      iconColorClass: "text-sky-600 dark:text-sky-400",
      iconBgClass: "bg-sky-500/10",
    },
    {
      label: "Kết quả thí sinh",
      path: "/dashboard/results",
      icon: <GraduationCap size={26} />,
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
      iconBgClass: "bg-emerald-500/10",
    },
    {
      label: "Thống kê số liệu",
      path: "/dashboard/statistics",
      icon: <BarChart3 size={26} />,
      iconColorClass: "text-purple-600 dark:text-purple-400",
      iconBgClass: "bg-purple-500/10",
    },
    {
      label: "Cài đặt",
      path: "/dashboard/settings",
      icon: <Settings size={26} />,
      iconColorClass: "text-zinc-600 dark:text-zinc-300",
      iconBgClass: "bg-zinc-500/10",
    },
    {
      label: "Trang chủ",
      path: "/",
      icon: <Home size={26} />,
      iconColorClass: "text-teal-600 dark:text-teal-400",
      iconBgClass: "bg-teal-500/10",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 pb-10">
      {/* Top Bar */}
      <div className="pb-4 border-b border-[var(--color-border)]">
        <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight">
          Bảng điều khiển phòng thi
        </h1>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mt-1 font-medium capitalize">
          <Calendar size={13} className="opacity-70" />
          <span>{currentDateString}</span>
          <span>•</span>
          <span>Hệ thống luyện thi & Quản lý bài kiểm tra LTVQuiz</span>
        </div>
      </div>

      {/* Square Feature Tiles (~128x128 - 140x140px) */}
      <div className="flex flex-wrap gap-4">
        {featureTiles.map((tile, index) => (
          <button
            key={tile.path}
            type="button"
            onClick={() => navigate(tile.path)}
            style={{ animationDelay: `${getStaggerDelayMs(index, 28, 220)}ms` }}
            className="group animate-fade-in-up w-[132px] h-[132px] sm:w-[140px] sm:h-[140px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary)]/40 shadow-2xs hover:shadow-md flex flex-col items-center justify-center gap-3 p-3 transform-gpu transition-[transform,background-color,border-color,box-shadow] duration-[220ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 active:scale-[0.97] active:duration-[90ms] cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transform-gpu transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 ${tile.iconBgClass} ${tile.iconColorClass}`}
            >
              {tile.icon}
            </div>
            <span className="text-xs sm:text-[13px] font-semibold text-[var(--color-text)] text-center leading-snug line-clamp-2">
              {tile.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
