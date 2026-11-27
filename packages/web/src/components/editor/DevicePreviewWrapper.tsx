import React from "react";

export type ViewportMode = "split" | "desktop" | "tablet" | "mobile" | "editor";

interface DevicePreviewWrapperProps {
  mode: ViewportMode;
  onChangeMode?: (mode: ViewportMode) => void;
  previewContent: React.ReactNode;
  editorContent: React.ReactNode;
}

export function DevicePreviewWrapper({
  mode,
  previewContent,
  editorContent,
}: DevicePreviewWrapperProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--color-background)] overflow-hidden">
      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex">
        {/* Split Mode: 50% Preview on Left, 50% Editor on Right */}
        {mode === "split" && (
          <div key="view-split" className="w-full h-full grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-y-auto lg:overflow-hidden animate-panel-enter">
            {/* Left Pane: Preview Cards */}
            <div className="lg:col-span-6 min-h-[50vh] lg:min-h-0 lg:h-full overflow-hidden flex flex-col bg-[var(--color-background)]">
              {previewContent}
            </div>

            {/* Right Pane: Code Editor */}
            <div className="lg:col-span-6 min-h-[50vh] lg:min-h-0 lg:h-full overflow-hidden flex flex-col bg-[var(--color-surface)] border-t lg:border-t-0 border-[var(--color-border)]">
              {editorContent}
            </div>
          </div>
        )}

        {/* Desktop View: Full Width Preview */}
        {mode === "desktop" && (
          <div key="view-desktop" className="w-full h-full overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6 flex justify-center bg-[var(--color-background)] animate-panel-enter">
            <div className="w-full max-w-4xl bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-md overflow-hidden flex flex-col">
              <div className="px-4 py-2 bg-[var(--color-background)]/80 border-b border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] flex items-center justify-between">
                <span>Xem trước danh sách câu hỏi</span>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-semibold">
                  Toàn màn hình
                </span>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[400px]">
                {previewContent}
              </div>
            </div>
          </div>
        )}

        {/* Tablet View: 768px Mockup Frame */}
        {mode === "tablet" && (
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 flex justify-center items-start bg-[var(--color-background)]/90">
            <div className="w-[768px] max-w-full bg-[var(--color-surface)] rounded-[2.5rem] border-[12px] border-gray-800 dark:border-gray-900 shadow-2xl overflow-hidden flex flex-col my-auto transition-all">
              {/* Tablet Top Bezel */}
              <div className="h-6 bg-gray-800 dark:bg-gray-900 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-700/80" />
              </div>

              {/* Tablet Screen */}
              <div className="h-[750px] overflow-y-auto custom-scrollbar flex flex-col bg-[var(--color-background)]">
                {previewContent}
              </div>

              {/* Tablet Bottom Bezel */}
              <div className="h-4 bg-gray-800 dark:bg-gray-900" />
            </div>
          </div>
        )}

        {/* Mobile View: 375px Mockup Frame */}
        {mode === "mobile" && (
          <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 flex justify-center items-start bg-[var(--color-background)]/90">
            <div className="w-[375px] max-w-full bg-[var(--color-surface)] rounded-[3rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden flex flex-col my-auto transition-all">
              {/* Smartphone Notch / Dynamic Island */}
              <div className="h-7 bg-gray-900 flex items-center justify-center">
                <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end pr-2">
                  <div className="w-2 h-2 rounded-full bg-blue-900/60" />
                </div>
              </div>

              {/* Mobile Screen */}
              <div className="h-[680px] overflow-y-auto custom-scrollbar flex flex-col bg-[var(--color-background)]">
                {previewContent}
              </div>

              {/* Mobile Home Bar */}
              <div className="h-5 bg-gray-900 flex items-center justify-center">
                <div className="w-28 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Editor Only View: 100% Code Editor */}
        {mode === "editor" && (
          <div key="view-editor" className="w-full h-full overflow-hidden flex flex-col animate-panel-enter">
            {editorContent}
          </div>
        )}
      </div>
    </div>
  );
}
