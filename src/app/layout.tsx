import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "英語辞書",
  description: "英語学習者向けWeb辞書アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
