import React from "react";

interface OnOffSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export const OnOffSwitch: React.FC<OnOffSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex items-center shrink-0 w-11 h-6 rounded-full transition-colors duration-[240ms] ease-[cubic-bezier(0.32,0.72,0,1)] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 active:scale-[0.96] ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${
        checked
          ? "bg-[#00c853]"
          : "bg-gray-300 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow-sm transform-gpu transition-transform duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
};
