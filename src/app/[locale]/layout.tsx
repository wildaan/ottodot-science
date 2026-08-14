import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import "../globals.css";

const locales = ['en', 'id'] as const;

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({ 
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Ottodot",
    default: "Ottodot - Science & Math Trial Class Booking",
  },
  description: "Register for interactive STEM, science, and math trial classes at Ottodot.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${lexend.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-800">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
