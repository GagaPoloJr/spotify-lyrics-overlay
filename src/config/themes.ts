export interface Theme {
  name: string;
  backgroundColor: string;
  textColor: string;
  activeLineColor: string;
  activeLineGlow: string;
  dimTextColor: string;
  accentColor: string;
}

export const themes: Record<string, Theme> = {
  dark: {
    name: "Dark",
    backgroundColor: "#0a0a0a",
    textColor: "rgba(255, 255, 255, 0.9)",
    activeLineColor: "#ffffff",
    activeLineGlow: "rgba(255, 255, 255, 0.2)",
    dimTextColor: "rgba(255, 255, 255, 0.15)",
    accentColor: "#22c55e", // green-500
  },
  midnight: {
    name: "Midnight",
    backgroundColor: "#0f172a",
    textColor: "rgba(248, 250, 252, 0.9)",
    activeLineColor: "#38bdf8",
    activeLineGlow: "rgba(56, 189, 248, 0.3)",
    dimTextColor: "rgba(248, 250, 252, 0.15)",
    accentColor: "#38bdf8", // sky-400
  },
  purple: {
    name: "Purple",
    backgroundColor: "#1a1025",
    textColor: "rgba(245, 243, 255, 0.9)",
    activeLineColor: "#c084fc",
    activeLineGlow: "rgba(192, 132, 252, 0.3)",
    dimTextColor: "rgba(245, 243, 255, 0.15)",
    accentColor: "#c084fc", // purple-400
  },
  sunset: {
    name: "Sunset",
    backgroundColor: "#1c1917",
    textColor: "rgba(255, 247, 237, 0.9)",
    activeLineColor: "#fb923c",
    activeLineGlow: "rgba(251, 146, 60, 0.3)",
    dimTextColor: "rgba(255, 247, 237, 0.15)",
    accentColor: "#fb923c", // orange-400
  },
  rose: {
    name: "Rose",
    backgroundColor: "#1a1018",
    textColor: "rgba(255, 241, 242, 0.9)",
    activeLineColor: "#fb7185",
    activeLineGlow: "rgba(251, 113, 133, 0.3)",
    dimTextColor: "rgba(255, 241, 242, 0.15)",
    accentColor: "#fb7185", // rose-400
  },
};

export const defaultTheme = themes.dark;
