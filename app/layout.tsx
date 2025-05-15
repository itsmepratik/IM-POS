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

// Load General Sans Variable font with optimized settings
const generalSans = localFont({
  src: [
    {
      path: "../public/fonts/GeneralSans-Variable.ttf",
      weight: "300 700",
      style: "normal",
    },
    {
      path: "../public/fonts/GeneralSans-VariableItalic.ttf",
      weight: "300 700",
      style: "italic",
    },
  ],
  variable: "--font-general-sans",
  display: "swap", // Use 'swap' to ensure text remains visible during font loading
  preload: true, // Preload the font
  fallback: ["system-ui", "sans-serif"], // Fallback fonts
  adjustFontFallback: "Arial", // Automatically adjust the fallback font
});

// Keep Inter as a fallback
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hossain & Sons",
  description: "Hossain & Sons Oil change & Service Center",
  themeColor: "#ffffff",
  manifest: "/manifest.json",
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
          href="/fonts/GeneralSans-Variable.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeneralSans-VariableItalic.ttf"
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
          /* PWA standalone mode: ensure full height and scrolling */
          @media all and (display-mode: standalone) {
            html, body {
              height: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: auto !important; /* Enable scrolling */
              position: static !important; /* Prevent fixed positioning issues */
              overscroll-behavior-y: contain; /* Optional: prevent overscroll effects like pull-to-refresh if desired */
            }
            body {
              /* Ensure body specifically allows scrolling */
              overflow-y: auto !important;
              overflow-x: hidden !important;
            }
          }
        `,
          }}
        />
      </head>
      <body
        className={`${generalSans.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <UserProvider>
          <BranchProvider>
            <NotificationProvider>
              {children}
              <NotificationDemo />
            </NotificationProvider>
          </BranchProvider>
        </UserProvider>
        <SpeedInsights />
        <Analytics />
        {/* Register Service Worker & PWA class */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
              
              window.addEventListener('load', function() {
                if (window.matchMedia('(display-mode: standalone)').matches || 
                    window.navigator.standalone) {
                  document.body.classList.add('pwa-standalone-mode');
                }
              });
            `,
          }}
        />
        {/* fullscreen.js is now empty, so this script tag doesn't do much but can be kept or removed */}
        <script src="/fullscreen.js" async />
      </body>
    </html>
  );
}
