import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { AnalyticsProvider } from "../shared/providers/analytics-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <AnalyticsProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </AnalyticsProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
