import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IOCL Safety Vision — Fire, Smoke & Steam Detection",
  description: "Real-time computer vision-based fire, smoke, and steam leak detection system for IOCL industrial safety monitoring.",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
