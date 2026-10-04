import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Course Platform",
    template: "%s · Course Platform",
  },
  description:
    "A course platform built with Next.js App Router: browse the catalogue, then learn inside a responsive course player.",
  applicationName: "Course Platform",
  openGraph: {
    type: "website",
    siteName: "Course Platform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom is left enabled: disabling it fails WCAG 1.4.4 and there is no UX
  // benefit for a text-heavy learning tool.
  maximumScale: 5,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-body-sm focus:font-medium focus:text-brand-700 focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}