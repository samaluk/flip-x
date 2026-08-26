import { Suspense } from "react";

import { OfflineBanner } from "@/shared/connectivity/offline-feedback";
import { ConvexClientProvider } from "@/shared/providers/convex-client-provider";
import { LanguageSwitcher } from "@/shared/language-switcher";
import { routing } from "@/shared/i18n/routing";
import { Geist, Geist_Mono } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getExtracted, getLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { AnalyticsProvider } from "../../shared/providers/analytics-provider";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  const t = await getExtracted("Metadata");
  return {
    title: t("flip-x"),
    description: t("Shared-table web app for playing flip-x with live scoring."),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AnalyticsProvider>
          <NuqsAdapter>
            <NextIntlClientProvider messages={messages}>
              <OfflineBanner />
              <Suspense
                fallback={
                  <div
                    aria-hidden
                    className="fixed inset-e-4 top-4 z-50 h-9 w-24 rounded-full border border-border bg-background/80"
                  />
                }
              >
                <LanguageSwitcher />
              </Suspense>
              <Suspense
                fallback={
                  <div
                    aria-busy="true"
                    className="flex min-h-0 flex-1 items-center justify-center"
                  />
                }
              >
                <ConvexClientProvider>{children}</ConvexClientProvider>
              </Suspense>
            </NextIntlClientProvider>
          </NuqsAdapter>
        </AnalyticsProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
