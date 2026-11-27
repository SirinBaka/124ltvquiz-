import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`group relative min-h-11 min-w-11 md:min-h-0 md:min-w-0 shrink-0 p-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/50 transform-gpu transition-[transform,color,border-color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 shadow-xs flex items-center justify-center cursor-pointer ${className}`}
      title={isDark ? "Chuyển sang chế độ Sáng (Light mode)" : "Chuyển sang chế độ Tối (Dark mode)"}
      aria-label="Đổi giao diện Sáng / Tối"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-blue-400 fill-blue-400/20 transform-gpu group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500 fill-amber-500/20 transform-gpu group-hover:rotate-45 group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
      )}
      <span className="sr-only">Đổi giao diện</span>
    </button>
  );
}
