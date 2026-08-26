import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader"
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteFooter";
import { ToastTapDismiss } from "@/components/ToastTapDismiss";
import { DesktopOptimisedBanner } from "@/components/DesktopOptimisedBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

// Read .next/BUILD_ID at SSR time and surface it as a data-attribute on
// <html> so DeployStatus can verify the loaded HTML response matches the
// current build. If .next/BUILD_ID is unreadable (e.g. dev server before
// the first build), we fall back to "unknown" and DeployStatus treats the
// verification as inconclusive rather than mismatching.
function getBuildId(): string {
  try {
    return (
      readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

const buildId = getBuildId();

export const viewport: Viewport = {
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://psalter.gsdlabs.dev'),
  title: "CPRC Psalter",
  description: "Scottish Psalter for CPRC congregation and precentors",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CPRC Psalter',
  },
  other: {
    // appleWebApp.capable above already auto-emits the unprefixed
    // "mobile-web-app-capable=yes" tag. This adds the apple-prefixed
    // variant for older iOS Safari, which does not recognize the
    // unprefixed name. Do NOT add the unprefixed key again here —
    // that would duplicate the auto-generated tag.
    'apple-mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-build-id={buildId}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          {/* 260717-mwv checkpoint round 2 (item A): SingingView's fixed
              GlassBottomBar (h-11/h-13 + safe-area padding) was overlapping
              the default bottom-right toast position, blocking interaction
              with the bar underneath. Verified against sonner's source that
              clicking the toast BODY does not dismiss it by default — only
              the closeButton's own X and swipe gestures do — so
              ToastTapDismiss adds tap-anywhere-on-the-toast dismissal on top
              of the visible closeButton affordance. */}
          <Toaster richColors closeButton offset={{ bottom: '88px' }} mobileOffset={{ bottom: '88px' }} />
          <ToastTapDismiss />
          <SiteFooter />
          {/* Quick task 260817-p17: fixed-positioned, so its place in the
              tree does not affect layout — placing it last keeps it above
              other content in paint order. */}
          <DesktopOptimisedBanner />
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
