import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyFantaLeague — La tua lega, viva tutti i giorni",
  description:
    "Il companion della tua lega di fantacalcio: la Gazzetta AI, l'Agente di mercato e la gestione della rosa, ogni giorno della settimana.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} ${oswald.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
