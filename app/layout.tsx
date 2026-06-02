import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./service-worker-register";
import { getBaseUrl } from "@/lib/base-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const APP_NAME = "비밀투표";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  applicationName: APP_NAME,
  title: {
    default: "비밀투표 · VoteSecret",
    template: "%s · 비밀투표",
  },
  description:
    "링크 하나로 익명 투표. 결과는 관리자만 볼 수 있는 비밀투표 앱.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="aurora" aria-hidden />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
