import { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "react-day-picker/dist/style.css";
import "./globals.css";
import { UserProvider } from "./user-context";
import { BranchProvider } from "./branch-context";
import { NotificationProvider } from "./notification-context";
import { NotificationDemo } from "./notification-demo";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ServiceWorkerRegistration from "../components/service-worker-registration";

// Load Formula 1 fonts with optimized settings
const formula1 = localFont({
  src: [
    {
      path: "../public/fonts/Formula1-Regular-1.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Formula1-Bold-4.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Formula1-Black.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-formula1",
  display: "swap", // Use 'swap' to ensure text remains visible during font loading
  preload: true, // Preload the font
  fallback: ["system-ui", "sans-serif"], // Fallback fonts
  adjustFontFallback: "Arial", // Automatically adjust the fallback font
});

// Load Formula 1 Wide font separately for special uses
const formula1Wide = localFont({
  src: [
    {
      path: "../public/fonts/Formula1-Wide.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-formula1-wide",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

// Keep Inter as a fallback
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HNS Automotive",
  description: "HNS Automotive Oil change & Service Center",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="preload"
          href="/fonts/Formula1-Regular-1.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Formula1-Bold-4.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Formula1-Black.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Formula1-Wide.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="orientation" content="portrait" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
          /* Apply fullscreen adjustments for standalone mode */
          @media all and (display-mode: standalone) {
            html, body {
              height: 100%;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            
            /* Ensure content within the app is scrollable */
            #app-root {
              height: 100%;
              width: 100%;
              overflow: auto;
              -webkit-overflow-scrolling: touch;
            }
          }
          
          /* Formula 1 font adjustments */
          body {
            letter-spacing: -0.02em;
            font-feature-settings: "kern" 1, "liga" 1;
          }
          
          h1, h2, h3, h4, h5, h6 {
            letter-spacing: -0.03em;
            font-weight: 700;
          }
          
          /* Reduce the boldness appearance */
          b, strong {
            font-weight: 700;
          }
          
          /* Adjust button text */
          button, .button {
            letter-spacing: -0.01em;
            font-weight: 400;
          }
        `,
          }}
        />
      </head>
      <body
        className={`${formula1.variable} ${formula1Wide.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <UserProvider>
          <BranchProvider>
            <NotificationProvider>
              <div
                id="app-root"
                style={{ height: "100%", width: "100%", overflow: "auto" }}
              >
                {children}
              </div>
              <NotificationDemo />
            </NotificationProvider>
          </BranchProvider>
        </UserProvider>
        <SpeedInsights />
        <Analytics />
        <ServiceWorkerRegistration />
        {/* Load fullscreen handler script */}
        <script src="/fullscreen.js" async />
      </body>
    </html>
  );
}
