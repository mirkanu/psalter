import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader"
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPRC Psalter",
  description: "Scottish Psalter for CPRC congregation and precentors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <Toaster richColors />
          <SiteFooter />
          {process.env.NEXT_PUBLIC_PSALTER_UMAMI_WEBSITE_ID && (
            <Script
              src="https://umami.gsdlabs.dev/script.js"
              data-website-id={process.env.NEXT_PUBLIC_PSALTER_UMAMI_WEBSITE_ID}
              strategy="afterInteractive"
            />
          )}
        </Providers>
      </body>
    </html>
  );
}
