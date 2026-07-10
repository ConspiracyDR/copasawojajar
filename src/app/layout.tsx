import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copa Sawo Jajar 03",
  description: "Tournament Management PWA",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#082254",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-brand-50 text-gray-950 antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
