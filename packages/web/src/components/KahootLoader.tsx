import { createPortal } from "react-dom";
import { AlertCircle, RotateCw } from "lucide-react";
import {
  getLoaderBackdropClass,
  getLoaderSizeClasses,
  useSlowLoadingNotice,
  DEFAULT_LOADER_TIMEOUT_MS,
  LOADER_TIMEOUT_WARNING_TEXT,
} from "./loaderHelper";
import type { BlurLevel, LoaderSize } from "./loaderHelper";

export interface KahootLoaderProps {
  text?: string;
  type?: "general" | "start" | "finish";
  fullscreen?: boolean;
  blur?: BlurLevel;
  size?: LoaderSize;
  timeoutMs?: number;
  showTimeoutWarning?: boolean;
  onReload?: () => void;
}

const APP_VERSION = "v1.0.0";

function Arc({ className = "", style, ...props }: React.ComponentProps<"div">) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-arc-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        className={`rounded-full border-[var(--color-primary)]/20 border-t-[var(--color-primary)] transform-gpu ${className}`}
        style={{
          animationName: "loading-ui-arc-spin",
          animationDuration: "var(--duration, 0.85s)",
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          willChange: "transform",
          backfaceVisibility: "hidden",
          ...style,
        }}
        {...props}
      />
    </>
  );
}

export function KahootLoader({
  text = "Đang tải...",
  fullscreen = false,
  blur = "lg",
  size = "md",
  timeoutMs = DEFAULT_LOADER_TIMEOUT_MS,
  showTimeoutWarning = true,
  onReload,
}: KahootLoaderProps) {
  const isSlow = useSlowLoadingNotice(true, timeoutMs);

  const handleReload = () => {
    if (onReload) {
      onReload();
    } else {
      window.location.reload();
    }
  };

  const backdropClass = getLoaderBackdropClass({ fullscreen, blur });
  const sizeStyles = getLoaderSizeClasses(size);

  const loaderOverlay = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in select-none ${backdropClass} ${
        fullscreen ? "" : "bg-black/55"
      }`}
    >
      <div
        className={`${sizeStyles.card} flex flex-col items-center justify-center text-center mx-4 animate-scale-up transform-gpu`}
      >
        <div className="mb-4 flex items-center justify-center text-[var(--color-primary-text)]">
          <Arc
            aria-hidden="true"
            className={`${sizeStyles.spinner} ${sizeStyles.spinnerBorder}`}
          />
        </div>

        <h2
          className={`${sizeStyles.title} ${
            fullscreen ? "text-[var(--color-text)]" : "text-white"
          } tracking-tight`}
        >
          {text}
        </h2>

        <p
          className={`${
            fullscreen ? "text-[var(--color-text-secondary)]" : "text-zinc-200"
          } ${sizeStyles.subtext} flex items-center justify-center mt-1 font-medium`}
        >
          <span>{APP_VERSION}</span>
        </p>

        {/* Slow network / latency notice */}
        {showTimeoutWarning && isSlow && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/90 border border-red-400/50 max-w-xs sm:max-w-sm text-center animate-notice-enter">
            <div className="flex items-center justify-center gap-1.5 text-red-200 mb-1">
              <AlertCircle size={14} aria-hidden="true" className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Mạng phản hồi chậm
              </span>
            </div>
            <p className="text-red-100 text-xs font-medium leading-relaxed">
              {LOADER_TIMEOUT_WARNING_TEXT}
            </p>
            <button
              type="button"
              onClick={handleReload}
              className="mt-3 min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-red-700 hover:bg-red-600 active:scale-[0.98] text-white cursor-pointer transition-colors"
            >
              <RotateCw size={13} aria-hidden="true" />
              <span>Khởi động lại ngay (F5)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(loaderOverlay, document.body);
  }

  return loaderOverlay;
}
