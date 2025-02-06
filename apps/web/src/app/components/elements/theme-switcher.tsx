"use client";

import DarkModeIcon from "@/app/components/icons/dark-mode-icon";
import LightModeIcon from "@/app/components/icons/light-mode-icon";
import { useTheme } from "@/app/contexts/theme-provider";
import { useId } from "react";

export default function ThemeSwitcher() {
  const themeToggleId = useId();
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <label
        className="flex cursor-pointer gap-2 mr-4"
        aria-label="テーマ切り替えスイッチ"
        htmlFor={themeToggleId}
      >
        <LightModeIcon />
        <input
          type="checkbox"
          className="toggle"
          value="dark"
          id={themeToggleId}
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
        <DarkModeIcon />
      </label>
      <span className="sr-only" role="status" aria-live="polite">
        {theme === "dark"
          ? "ダークモードが有効になりました"
          : "ライトモードが有効になりました"}
      </span>
    </div>
  );
}
