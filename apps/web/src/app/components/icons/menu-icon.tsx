"use client";

import { useId } from "react";

export default function MenuIcon() {
  const titleId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>メニューアイコン</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6h16M4 12h16m-7 6h7"
      />
    </svg>
  );
}
