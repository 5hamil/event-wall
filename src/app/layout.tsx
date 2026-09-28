import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";

const inter = localFont({
  src: "./fonts/InterVariable.woff2",
  variable: "--font-body",
  weight: "100 900",
});
const dmSans = localFont({
  src: "./fonts/DMSansVariable.woff2",
  variable: "--font-heading",
  weight: "100 1000",
});

export const metadata: Metadata = {
  ...(process.env.SITE_URL ? { metadataBase: new URL(process.env.SITE_URL) } : {}),
  title: "Event Wall | Campus events, all in one place",
  description: "Discover what is happening across campus with Event Wall.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
