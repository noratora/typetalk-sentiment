import { useRouter } from "next/navigation";
import { startTransition, useCallback } from "react";

export function useReload(reset: () => void) {
  const router = useRouter();

  const reload = useCallback(() => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }, [router, reset]);

  return reload;
}
