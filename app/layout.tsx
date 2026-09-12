import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { InstallPrompt } from "@/components/pwa/install-prompt";
import { OfflineBadge } from "@/components/pwa/offline-badge";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { EmergencyFab } from "@/components/emergency/emergency-fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MotoLog",
  description: "Personal vehicle maintenance and health logbook",
  applicationName: "MotoLog",
  appleWebApp: {
    capable: true,
    title: "MotoLog",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="safe-top safe-bottom flex min-h-full flex-col">
        <OfflineBadge />
        {children}
        <EmergencyFab />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
