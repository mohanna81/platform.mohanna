import "./globals.css";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ConsortiumProvider } from "../lib/context/ConsortiumContext";
import { ReactNode } from "react";
import { ToastContainer } from "../components/common";
import type { Metadata } from 'next';

// Use environment variable for favicon version, fallback to timestamp
const faviconVersion = process.env.NEXT_PUBLIC_FAVICON_VERSION || Date.now();

export const metadata: Metadata = {
  title: "Risk Sharing Platform",
  description: "Risk Sharing Platform for Humanitarian Organizations",
  icons: {
    icon: [
      {
        url: `/favicon.png?v=${faviconVersion}`,
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: `/favicon.png?v=${faviconVersion}`,
        type: 'image/png',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Use process.env.NEXT_PUBLIC_APP_URL or similar if SSR, but for static check, use window only in client components
  // Instead, check if children is the login page by using a convention: pass a prop or use a segment
  // But Next.js app directory does not support usePathname in layout.tsx (server component)
  // So, as a workaround, only wrap in Layout if not on the main page
  // The only page that should NOT have layout is / (main page)
  // Next.js does not provide route info in root layout, so use a convention: in /page.tsx, wrap in a fragment
  // and in all other pages, layout will be applied
  // So, move Layout into each page except /page.tsx
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={`/favicon.png?v=${faviconVersion}`} type="image/png" />
        <link rel="apple-touch-icon" href={`/favicon.png?v=${faviconVersion}`} />
        <meta name="msapplication-TileImage" content={`/favicon.png?v=${faviconVersion}`} />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <ConsortiumProvider>
            {children}
            <ToastContainer />
          </ConsortiumProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
