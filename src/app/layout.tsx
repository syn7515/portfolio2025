import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Libre_Caslon_Text } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/InterVariable.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/InterVariable-Italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-inter",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const libreCaslonText = Libre_Caslon_Text({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-libre-caslon",
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
  colorScheme: 'light dark',
};

export const metadata: Metadata = {
  title: "Sue Park",
  description: "Sue Park — Portfolio",
  icons: {
    icon: '/favicon.svg',
  },
  metadataBase: new URL("https://suepark.xyz"),
  openGraph: {
    title: "Sue Park",
    description: "Sue Park — Portfolio",
    url: "https://suepark.xyz",
    siteName: "Sue Park",
    images: [
      {
        url: "https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sue Park Portfolio Open Graph Image",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sue Park",
    description: "Sue Park — Portfolio",
    images: [
      "https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/og-image.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="preconnect" href="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com" />
      {/* Google tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-BBV28P3EE7"
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BBV28P3EE7');
          `,
        }}
      />
      {/* End Google tag (gtag.js) */}
      {/* Google Tag Manager */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WCZNNH57');`,
        }}
      />
      {/* End Google Tag Manager */}
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${libreCaslonText.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function setTC(){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var m=document.querySelector('meta[name="theme-color"][data-d]');if(!m){m=document.createElement('meta');m.name='theme-color';m.setAttribute('data-d','');document.head.appendChild(m);}m.content=d?'#18181b':'#ffffff';}setTC();window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',setTC);})();`,
          }}
        />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WCZNNH57"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}