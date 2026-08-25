export type BlogPostMaskDirection = 'previous' | 'next'

export interface BlogPostMaskNavigationDetail {
  href: string
  direction: BlogPostMaskDirection
}

export const BLOG_POST_MASK_NAV_EVENT = 'blog-post-mask-navigation'
export const BLOG_POST_MASK_NAV_ATTR = 'data-blog-mask-nav'

export function requestBlogPostMaskNavigation(
  href: string,
  direction: BlogPostMaskDirection
) {
  window.dispatchEvent(
    new CustomEvent<BlogPostMaskNavigationDetail>(BLOG_POST_MASK_NAV_EVENT, {
      detail: { href, direction },
    })
  )
}

export function markBlogPostMaskNavigation() {
  document.documentElement.setAttribute(BLOG_POST_MASK_NAV_ATTR, '')
}

export function isBlogPostMaskNavigation() {
  return (
    typeof document !== 'undefined' &&
    document.documentElement.hasAttribute(BLOG_POST_MASK_NAV_ATTR)
  )
}

export function clearBlogPostMaskNavigation() {
  document.documentElement.removeAttribute(BLOG_POST_MASK_NAV_ATTR)
}
