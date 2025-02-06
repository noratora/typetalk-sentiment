"use client";

import ErrorAlert from "@/app/components/error/error-alert";
import ThemeWrapper from "@/app/contexts/theme-wrapper";
import dynamic from "next/dynamic";
import { Noto_Sans_JP } from "next/font/google";

const ThemeProvider = dynamic(() => import("@/app/contexts/theme-provider"), {
  // Next.js 15 にアップグレードしてからエラーが発生したため、ワークアラウンドを適用
  // https://github.com/PostHog/posthog/issues/26016#issuecomment-2629036307
  // ssr: false,
  ssr: !!false,
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <html lang="ja">
      <body className={notoSansJP.variable}>
        <ThemeProvider>
          <ThemeWrapper>
            <div className="min-h-screen">
              <div className="container mx-auto max-w-screen-md py-10 px-4">
                <ErrorAlert reset={handleReload} />
              </div>
            </div>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
