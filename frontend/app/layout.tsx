import type { Metadata } from "next";
import "./globals.css";
import { AuthInitializer } from '@/components/AuthInitializer';

export const metadata: Metadata = {
  title: "ReplySystem",
  description: "AI-powered reply system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthInitializer>{children}</AuthInitializer>
      </body>
    </html>
  );
}
