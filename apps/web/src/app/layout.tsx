import Header from "@/app/components/layout/header";
import ThemeWrapper from "@/app/contexts/theme-wrapper";
import { ToastProvider } from "@/app/contexts/toast-provider";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: {
    template: "%s | Typetalk Sentiment",
    default: "Typetalk Sentiment",
  },
  description:
    "Typetalk Sentimentは、Typetalkのメッセージを感情分析し、チームのコミュニケーションをより効果的にサポートするアプリケーションです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={notoSansJP.variable}>
        <ThemeProvider>
          <ThemeWrapper>
            <ToastProvider>
              <div className="min-h-screen">
                <Header />
                {children}
              </div>
            </ToastProvider>
          </ThemeWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
