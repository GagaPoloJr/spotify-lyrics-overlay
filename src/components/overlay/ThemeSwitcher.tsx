import { useState } from "react";
import { themes } from "../../config/themes";

interface ThemeSwitcherProps {
  currentTheme: string;
  onThemeChange: (name: string) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-5 h-5 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/70 transition-all"
        title="Change Theme"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="6" cy="6" r="4" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => {
                onThemeChange(key);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-1.5 text-left text-[11px] flex items-center gap-2 transition-colors ${
                key === currentTheme
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: theme.activeLineColor }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
