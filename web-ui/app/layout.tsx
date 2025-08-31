import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/layouts/AppShell";
import { ThemeProvider } from "./theme-provider";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Agents - Web UI",
  description: "Advanced trading analysis platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <Providers>
            <AppShell>
              {children}
            </AppShell>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
