import { useRef } from "react";
import { EXAM_TEMPLATES, type ExamTemplate } from "../../data/examTemplates";

interface AzotaCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function AzotaCodeEditor({ value, onChange }: AzotaCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Calculate lines
  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 1);

  // Sync scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleSelectTemplate = (template: ExamTemplate) => {
    if (
      value.trim().length > 0 &&
      !window.confirm(
        `Bạn có muốn thay thế nội dung hiện tại bằng "${template.name}: ${template.description}" không?`,
      )
    ) {
      return;
    }
    onChange(template.content);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] select-none">
      {/* Editor Main Canvas with Line Numbers */}
      <div className="flex-1 relative flex overflow-hidden font-mono text-xs sm:text-[13px] bg-[var(--color-background)]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="w-12 sm:w-14 py-3 bg-[var(--color-surface)] border-r border-[var(--color-border)] text-[var(--color-text-secondary)] text-right pr-2.5 select-none overflow-hidden shrink-0 opacity-70 leading-6"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="Dán hoặc soạn thảo đề thi tại đây...
[!b:$PHẦN I$]
Câu 1. [!b:$ Công việc của một kĩ sư thiết kế điện là$]
A. thi công, lắp đặt thiết bị điện
*B. thiết kế sơ đồ mạch điện (dấu * là đáp án đúng)
C. sửa chữa thiết bị điện
D. chế tạo thiết bị điện"
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-[var(--color-text)] outline-none resize-none leading-6 overflow-y-auto custom-scrollbar whitespace-pre font-mono"
        />
      </div>

      {/* Bottom Template Quick Picker Bar (Azota style) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border-t border-[var(--color-border)] overflow-x-auto custom-scrollbar text-xs shrink-0">
        <span className="font-bold text-[11px] text-[var(--color-text-secondary)] shrink-0">
          Nội dung mẫu:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {EXAM_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-background)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text)] hover:text-[var(--color-primary)] text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-98 shadow-2xs"
              title={tmpl.description}
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
