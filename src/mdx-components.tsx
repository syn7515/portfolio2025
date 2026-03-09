import type { MDXComponents } from 'mdx/types'
import { InlineLinkPreview } from '@/components/ui/inline-link-preview'

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    a: ({ href, children, className, imageUrl, explanation, ...rest }) => {
      if (!href) return <a href={href} className={className} {...rest}>{children}</a>
      return (
        <InlineLinkPreview href={href} variant="intro-link" className={className} imageUrl={imageUrl} explanation={explanation}>
          {children}
        </InlineLinkPreview>
      )
    },
    ...components,
  }
}
