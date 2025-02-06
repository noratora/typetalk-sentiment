"use client";

import { useTheme } from "@/app/contexts/theme-provider";

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  return <div data-theme={theme}>{children}</div>;
}
