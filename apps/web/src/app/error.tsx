"use client";

import ErrorHandler from "@/app/components/error/error-handler";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto max-w-screen-md p-4">
      <ErrorHandler error={error} reset={reset} />
    </div>
  );
}
