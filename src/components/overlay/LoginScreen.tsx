import { useState } from "react";

interface LoginScreenProps {
  onLogin: () => void;
  onManualCode: (code: string) => void;
}

export function LoginScreen({ onLogin, onManualCode }: LoginScreenProps) {
  const [showManual, setShowManual] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onManualCode(code.trim());
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] select-none flex flex-col overflow-hidden">
      {/* App Bar */}
      <div
        data-tauri-drag-region
        className="flex items-center h-10 px-4 bg-[#111111] backdrop-blur-xl border-b border-white/5 cursor-move shrink-0"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <span className="text-white/60 text-[11px] font-medium">
            Spotify Lyrics
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        {/* Spotify Icon */}
        <svg className="w-12 h-12 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>

        <div className="text-white/90 text-base text-center font-medium">
          Login to Spotify to see lyrics
        </div>

        <button
          onClick={onLogin}
          className="px-8 py-2.5 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-full transition-colors text-sm"
        >
          Login with Spotify
        </button>

        <button
          onClick={() => setShowManual(!showManual)}
          className="text-white/40 text-xs hover:text-white/70 transition-colors"
        >
          {showManual ? "Hide" : "Having trouble? Manual code entry"}
        </button>

        {showManual && (
          <div className="w-full max-w-[380px] space-y-3 mt-2">
            <div className="text-white/30 text-[11px] text-left space-y-1 bg-white/5 rounded-lg p-3">
              <p>1. Click "Login with Spotify" above</p>
              <p>2. Authorize in browser</p>
              <p>3. Code will be sent automatically</p>
              <p>4. If not, copy code from browser URL and paste below</p>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste authorization code"
                className="flex-1 px-3 py-2 bg-white/5 text-white text-sm rounded-lg border border-white/10 focus:border-green-500/50 focus:outline-none placeholder:text-white/20"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Submit
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
