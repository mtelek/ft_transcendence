import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header/Header";
import SessionWrapper from "@/components/SessionWrapper";
import { getExistingUserSessionOrNull } from "@/lib/existingUserSession";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "42 School final project",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Seed client state only with a session that still maps to an existing DB user.
  const existingSessionResult = await getExistingUserSessionOrNull();
  const session = existingSessionResult?.session ?? null;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper initialSession={session}>
          <Header />
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
