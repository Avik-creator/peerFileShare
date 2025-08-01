import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeerShare - Secure P2P File Sharing & Video Calls",
  description: "Share files instantly and make HD video calls without servers. Secure, private, peer-to-peer connections with end-to-end encryption. No file size limits, no registration required.",
  keywords: [
    "file sharing",
    "peer to peer",
    "P2P",
    "video calls",
    "WebRTC",
    "secure sharing",
    "private sharing",
    "end-to-end encryption",
    "no servers",
    "instant transfer"
  ],
  authors: [{ name: "Avik Mukherjee", url: "https://avikmukherjee.me" }],
  creator: "Avik Mukherjee",
  publisher: "Avik Mukherjee",
  metadataBase: new URL("https://peershare.avikmukherjee.me"),
  alternates: {
    canonical: "https://peershare.avikmukherjee.me",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://peershare.avikmukherjee.me",
    siteName: "PeerShare",
    title: "PeerShare - Secure P2P File Sharing & Video Calls",
    description: "Share files instantly and make HD video calls without servers. Secure, private, peer-to-peer connections with end-to-end encryption. No file size limits, no registration required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PeerShare - Secure Peer-to-Peer File Sharing",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@avikm744",
    creator: "@avikm744",
    title: "PeerShare - Secure P2P File Sharing & Video Calls",
    description: "Share files instantly and make HD video calls without servers. Secure, private, peer-to-peer connections with end-to-end encryption.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "technology",
  classification: "Web Application",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PeerShare",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#3b82f6",
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
        <Toaster />
      </body>
    </html>
  );
}
