import { useState, useCallback, useEffect } from "react";
import { Theme, themes, defaultTheme } from "../config/themes";
import { load } from "@tauri-apps/plugin-store";

const THEME_STORAGE_KEY = "app_theme";

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const [themeName, setThemeName] = useState<string>("dark");

  // Load saved theme on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const store = await load("settings.json");
        const saved = await store.get<string>(THEME_STORAGE_KEY);
        if (saved && themes[saved]) {
          setCurrentTheme(themes[saved]);
          setThemeName(saved);
        }
      } catch {
        // Use default theme
      }
    }
    loadTheme();
  }, []);

  const setTheme = useCallback(async (name: string) => {
    if (themes[name]) {
      setCurrentTheme(themes[name]);
      setThemeName(name);

      // Save to store
      try {
        const store = await load("settings.json");
        await store.set(THEME_STORAGE_KEY, name);
        await store.save();
      } catch (e) {
        console.error("[Theme] Failed to save theme:", e);
      }
    }
  }, []);

  const cycleTheme = useCallback(() => {
    const themeNames = Object.keys(themes);
    const currentIndex = themeNames.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    setTheme(themeNames[nextIndex]);
  }, [themeName, setTheme]);

  return {
    currentTheme,
    themeName,
    setTheme,
    cycleTheme,
    availableThemes: Object.keys(themes),
  };
}
