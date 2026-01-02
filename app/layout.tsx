import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ooloo - Rent the Luggage, Own the Trip",
  description: "Rent premium luggage delivered to your door. No storage, no hassle. Available in Los Angeles, New York, San Francisco, Chicago, Atlanta, Dallas, and Denver.",
  openGraph: {
    title: "ooloo - Rent the Luggage, Own the Trip",
    description: "Rent premium luggage delivered to your door. No storage, no hassle.",
    url: "https://ooloo.vercel.app",
    siteName: "ooloo",
    images: [
      {
        url: "https://ooloo.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ooloo - Rent the Luggage, Own the Trip",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ooloo - Rent the Luggage, Own the Trip",
    description: "Rent premium luggage delivered to your door. No storage, no hassle.",
    images: ["https://ooloo.vercel.app/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}