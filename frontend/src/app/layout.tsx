import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Wolbi Royal Enterprise",
    template: "%s | Wolbi Royal Enterprise",
  },
  description:
    "Building the north, together. Technology, health services, virtual solutions, and community impact — one enterprise, four divisions, built in Tamale for Northern Ghana.",
  keywords: ["Wolbi", "NeomatCare", "FarmAsyst", "MAGHAZ Assist", "LaafiTech", "Agrirevolution", "Tamale", "Northern Ghana technology", "health tech Ghana", "agritech Ghana"],
  authors: [{ name: "Wolbi Royal Enterprise" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/brand/site.webmanifest",
  openGraph: {
    siteName: "Wolbi Royal Enterprise",
    locale: "en_GH",
    type: "website",
    images: [{ url: "/brand/og-cover.png", width: 1200, height: 630, alt: "Wolbi Royal Enterprise — Building the north, together." }],
  },
  themeColor: "#0D182A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
