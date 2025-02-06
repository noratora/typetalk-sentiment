"use client";

import ErrorAlert from "@/app/components/error/error-alert";
import { useReload } from "@/app/hooks/use-reload";
import { useEffect } from "react";

export default function ErrorHandler({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const reload = useReload(reset);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorAlert reset={reload} />;
}
