# Blog Posts Guide

## Creating a New Blog Post

To add a new blog post, follow these simple steps:

### 1. Create a new folder
Create a new folder in `src/app/blog/` with your post's slug (URL-friendly name):
```
src/app/blog/my-new-post/
```

### 2. Create the page component
Create `page.tsx` with this template:

```tsx
"use client"

import BlogPostLayout from '@/components/blog-post-layout'
import MDXContent from './content.mdx'

export default function MyNewPost() {
  return (
    <BlogPostLayout>
      <MDXContent />
    </BlogPostLayout>
  )
}
```

### 3. Create your content
Create `content.mdx` and write your blog post in Markdown:

```mdx
# My Post Title

##### Date here

Your content goes here...

## Subheading

More content...
```

### 4. Add to blog index
Update `src/app/blog/page.tsx` to add a link to your new post.

## Shared Styling

All blog posts automatically share the same styling defined in:
- **Layout**: `src/components/blog-post-layout.tsx`
- **CSS**: `src/components/blog-post.module.css`

## Features Included

- ✅ Consistent styling across all posts
- ✅ MDX support (Markdown + React components)
- ✅ Dark mode support
- ✅ Beautiful typography
- ✅ Code syntax highlighting
- ✅ Back navigation to blog home

## Example Posts

- `/blog/aniai` - Full example with comprehensive content
- `/blog/my-second-post` - Simple template to get started


