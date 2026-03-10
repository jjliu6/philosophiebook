import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PhilosophieBook",
  description:
    "Where ancient wisdom meets modern questions. Watch history's greatest philosophers debate today's issues.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>

        {/* End-of-book ornament */}
        <div className="fleuron">
          <span className="text-[10px] text-accent/30">&#10022;</span>
        </div>

        <footer className="pb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="PhilosophieBook" className="mx-auto h-20 w-auto opacity-60" />
          <p className="font-quote mt-3 text-[13px] italic text-muted/50">
            Where ancient wisdom meets modern questions
          </p>
          <p className="folio mt-2">MMXXVI</p>
        </footer>
      </body>
    </html>
  );
}
