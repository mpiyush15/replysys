'use client';

import type { Metadata } from "next";
import "./globals.css";
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const metadata: Metadata = {
  title: "ReplySystem",
  description: "AI-powered reply system",
};

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeFromStorage } = useAuthStore();

  useEffect(() => {
    // Restore auth from localStorage on app load
    initializeFromStorage();
  }, [initializeFromStorage]);

  return <>{children}</>;
}

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
