import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sage — scale recipes that don't scale linearly",
  description:
    "Scale a recipe correctly — respecting that salt, aromatics, leavening, and time don't scale linearly — then know what to taste and check.",
  applicationName: "Sage",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Set the theme class before paint to avoid a flash of the wrong mode.
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem("sage-theme");
    if (stored === "dark" || stored === "light") {
      document.documentElement.classList.add(stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
