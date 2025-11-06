"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function GTM() {
  const [shouldLoadGTM, setShouldLoadGTM] = useState<boolean | null>(null);

  useEffect(() => {
    // Check IP address
    fetch('/api/check-ip')
      .then((res) => res.json())
      .then((data) => {
        // Only load GTM if user should NOT opt out
        setShouldLoadGTM(!data.shouldOptOut);
      })
      .catch(() => {
        // On error, default to loading GTM (fail open)
        setShouldLoadGTM(true);
      });
  }, []);

  // Don't render anything until we know whether to load GTM
  if (shouldLoadGTM === null) {
    return null;
  }

  // If user should opt out, don't load GTM
  if (!shouldLoadGTM) {
    return null;
  }

  return (
    <>
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
    </>
  );
}

export function GTMNoscript() {
  const [shouldLoadGTM, setShouldLoadGTM] = useState<boolean | null>(null);

  useEffect(() => {
    // Check IP address
    fetch('/api/check-ip')
      .then((res) => res.json())
      .then((data) => {
        setShouldLoadGTM(!data.shouldOptOut);
      })
      .catch(() => {
        setShouldLoadGTM(true);
      });
  }, []);

  if (shouldLoadGTM === null || !shouldLoadGTM) {
    return null;
  }

  return (
    <>
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
    </>
  );
}

