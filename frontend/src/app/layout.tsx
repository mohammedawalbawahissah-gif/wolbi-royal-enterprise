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
    "Technology, healthcare, virtual solutions, and community impact — building Africa's future through purposeful innovation.",
  keywords: ["Wolbi", "NeomatCare", "FarmaSyst", "MAGHAZ Assist", "Ghana technology", "health tech Africa", "agritech Ghana"],
  authors: [{ name: "Wolbi Royal Enterprise" }],
  openGraph: {
    siteName: "Wolbi Royal Enterprise",
    locale: "en_GH",
    type: "website",
  },
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
