import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import Link from "next/link";
import { getExtracted } from "next-intl/server";

import { routing } from "../shared/i18n/routing";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted({
    locale: routing.defaultLocale,
    namespace: "NotFoundPage",
  });

  return {
    title: t("404 – Page not found"),
    description: t("The page you're looking for doesn't exist."),
  };
}

export default async function GlobalNotFound() {
  const t = await getExtracted({
    locale: routing.defaultLocale,
    namespace: "NotFoundPage",
  });

  return (
    <html
      lang={routing.defaultLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-background text-foreground">
        <p className="text-6xl font-semibold">404</p>
        <p className="text-muted-foreground">{t("The page you're looking for doesn't exist.")}</p>
        <Link href="/" className="text-primary underline underline-offset-4 hover:text-primary/80">
          {t("Go home")}
        </Link>
      </body>
    </html>
  );
}
