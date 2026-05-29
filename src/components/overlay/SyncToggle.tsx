import { useState } from "react";

interface SyncToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function SyncToggle({ isEnabled, onToggle }: SyncToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group fixed top-20 right-3 z-30
        flex items-center rounded-full
        transition-all duration-300 ease-out
        ${isHovered ? "px-3 py-1.5 gap-2" : "px-2.5 py-1.5 gap-0"}
        ${
          isEnabled
            ? "bg-white/10 hover:bg-white/15"
            : "bg-white/5 hover:bg-white/10"
        }
      `}
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {/* Green dot - always centered */}
      <span
        className={`block w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
          isEnabled ? "bg-green-500" : "bg-white/20"
        }`}
      />

      {/* Text with slide animation */}
      <span
        className={`
          text-[11px] font-medium whitespace-nowrap
          overflow-hidden transition-all duration-300 ease-out
          ${isHovered ? "max-w-[60px] opacity-100" : "max-w-0 opacity-0"}
          ${isEnabled ? "text-white/70" : "text-white/30"}
        `}
      >
        {isEnabled ? "Sync On" : "Sync Off"}
      </span>
    </button>
  );
}
