"use client";

import { ProviderRequiredError } from "@/app/lib/errors";
import { createContext, useContext, useEffect, useState } from "react";

interface ContextProps {
  theme: string;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ContextProps | undefined>(undefined);

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  function toggleTheme() {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  }

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * テーマを管理するためのカスタムフック
 * @throws {ProviderRequiredError} ThemeProviderの外部で使用された場合
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new ProviderRequiredError("useTheme", "ThemeProvider");
  }
  return context;
}
