import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Classical AI Tutor",
  description: "AI-powered tutoring for classical rhetoric exercises",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
