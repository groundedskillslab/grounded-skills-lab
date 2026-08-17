import type { Metadata } from "next";
import { sofiaPro, bookmania } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grounded Skills Lab",
  description: "Behavior science for building better skills.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${sofiaPro.variable} ${bookmania.variable}`}>
      <body className="min-h-full flex flex-col bg-plane text-ink">{children}</body>
    </html>
  );
}
