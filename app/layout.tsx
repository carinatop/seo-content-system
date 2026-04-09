import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Content System",
  description: "Multi-brand AI SEO content studio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
