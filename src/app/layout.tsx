import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Libre_Caslon_Text, Crimson_Pro } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import MotionProvider from "@/components/motion-provider";
import BlogPostMobileMenu from "@/components/blog-post-mobile-menu";
import BlogPostTransitionMask from "@/components/blog-post-transition-mask";
import "./globals.css";

// X and other social crawlers cache card images by URL. Use a content-versioned
// filename so replacing the image always produces a new crawler cache key.
const OG_IMAGE_URL =
  "https://suepark.xyz/og-image-cd63c326.png";

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

const biroScript = localFont({
  src: "../../public/fonts/BiroScript.ttf",
  variable: "--font-biro-script",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Segoe Print", "Bradley Hand", "Comic Sans MS", "cursive"],
  weight: "400",
  style: "normal",
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

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson-pro",
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
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        type: "image/png",
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
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Sue Park Portfolio Open Graph Image",
      },
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
        className={`${inter.variable} ${biroScript.variable} ${geistSans.variable} ${geistMono.variable} ${libreCaslonText.variable} ${crimsonPro.variable} antialiased`}
      >
        {/* Where a document starts, decided before the first frame. Two cases, pulling opposite
            ways:

              - Browser back/forward lands on the top of the destination rather than wherever that
                entry was last scrolled to. The App Router only scrolls to the top for pushed
                navigations — on popstate it renders the restored tree and leaves the scroll
                position to the UA — so `scrollRestoration` goes to 'manual' and the jump is done
                by hand.
              - A reload keeps the reader exactly where they were.

            The UA cannot be left to do the second one, even though it is the case it gets right:
            the mode is read off the session history entry when a navigation *starts*, so an entry
            has one setting for both, and that setting is needed at 'manual' for the back button.
            Handing it back at parse time on a refresh is too late, and leaving it at 'auto' loses
            the back button — its restore lands a frame *after* popstate and overwrites the jump.
            So the position is saved on the way out and re-applied here, on the first frame the
            document is tall enough to hold it, and abandoned the moment the reader scrolls for
            themselves.

            `data-page-reload` marks that refresh for both entrances, which then sit the load out
            (see isPageReload in src/lib/paper-exit-transition.ts): putting someone back in the
            middle of a post and flying a fresh sheet in over it reads as a glitch rather than an
            arrival, and a refresh isn't an arrival. Nothing else is suppressed — every real
            navigation still animates.

            Inline and pre-paint because none of it can wait for the bundle: a back press can land
            before hydration, and the entrances are CSS animations that start on the first painted
            frame. `pageshow` covers the bfcache case, where the document is handed back intact and
            this script never re-runs. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
var key=function(){return 'scroll-position:'+location.pathname;};
var entry=performance.getEntriesByType('navigation')[0];
if('scrollRestoration' in history)history.scrollRestoration='manual';
var toTop=function(){window.scrollTo({top:0,left:0,behavior:'auto'});};
addEventListener('popstate',toTop);
addEventListener('pageshow',function(e){if(e.persisted)toTop();});
var save=function(){try{sessionStorage.setItem(key(),String(Math.round(window.scrollY)));}catch(e){}};
addEventListener('pagehide',save);
addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save();});
if(!entry||entry.type!=='reload')return;
document.documentElement.setAttribute('data-page-reload','');
var target=0;try{target=parseInt(sessionStorage.getItem(key()),10)||0;}catch(e){}
if(target<=0)return;
var settled=false,giveUp=function(){settled=true;};
['wheel','touchstart','keydown','pointerdown'].forEach(function(type){addEventListener(type,giveUp,{once:true,passive:true});});
var deadline=Date.now()+5000;
var restore=function(){
if(settled)return;
if(document.documentElement.scrollHeight-window.innerHeight>=target){window.scrollTo(0,target);settled=true;return;}
if(Date.now()<deadline)requestAnimationFrame(restore);
};
requestAnimationFrame(restore);
}catch(e){}})();`,
          }}
        />
        {/* Restores the one-navigation direction/origin signal after a full document load, before
            anything paints. Both the paper's backwards branch and the responsive rail's Home-origin
            entrance are CSS-driven, so their condition has to be readable on the first frame. On
            client-side navigation the departing link sets the attribute directly.
            A reload is not a navigation, so it drops the signal instead of promoting it — left in
            place, the direction that brought the reader here would replay its transition (the
            backwards one being a whole sheet sliding out) on every refresh. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia('(max-width: 639.98px)').matches||document.documentElement.hasAttribute('data-page-reload')){sessionStorage.removeItem('paper-direction');document.documentElement.removeAttribute('data-paper-nav');return;}var v=sessionStorage.getItem('paper-direction');if(v==='back'||v==='home'){document.documentElement.setAttribute('data-paper-nav',v);}}catch(e){}})();`,
          }}
        />
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
        <BlogPostMobileMenu />
        <BlogPostTransitionMask />
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
