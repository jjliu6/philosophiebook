import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ViewModeProvider from "@/components/providers/ViewModeProvider";
import { getCurrentUser } from "@/lib/auth";

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');if(s==='light'||s==='dark'){document.documentElement.setAttribute('data-theme',s)}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.setAttribute('data-theme','light')}else{document.documentElement.setAttribute('data-theme','dark')}}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`;

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider initialUser={user}>
          <ThemeProvider>
            <ViewModeProvider>
            <Header />
            <main className="min-h-screen">{children}</main>

            {/* End-of-book ornament */}
            <div className="fleuron">
              <span className="text-[10px] text-accent/30">&#10022;</span>
            </div>

            <footer className="pb-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="PhilosophieBook" className="mx-auto h-32 w-auto opacity-60" />
              <p className="font-quote mt-3 text-[13px] italic text-muted/50">
                Where ancient wisdom meets modern questions
              </p>
              <p className="folio mt-2">MMXXVI</p>
              <p className="mt-4 text-[12px] text-muted/40">
                Built by{" "}
                <a
                  href="https://www.linkedin.com/in/junjieliu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent/50 transition-colors hover:text-accent"
                >
                  Junjie Liu
                </a>
                {" "}at{" "}
                <a
                  href="https://philosophie.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent/50 transition-colors hover:text-accent"
                >
                  Philosophie AI
                </a>
              </p>
              <p className="mt-2 text-[12px] text-muted/40">
                Feedback?{" "}
                <a
                  href="mailto:junjie@philosophie.ai"
                  className="text-accent/50 transition-colors hover:text-accent"
                >
                  junjie@philosophie.ai
                </a>
              </p>
            </footer>
            </ViewModeProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
