'use client';

import { MDXProvider } from '@mdx-js/react';
import { useMDXComponents } from '@/components/mdx-components';

export function MDXProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MDXProvider components={useMDXComponents({})}>
      {children}
    </MDXProvider>
  );
}
