import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Minecraft 社团暑假项目站",
  description: "项目展示、想法投稿和加入申请",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
