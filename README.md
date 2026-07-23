# Portfolio 2025

A modern, responsive portfolio website built with Next.js, showcasing product design work and case studies. Features smooth animations, dark mode support, and MDX-powered content management.

## 🚀 Features

- **Modern Stack**: Built with Next.js 15, React 19, and TypeScript
- **MDX Content**: Project case studies and blog posts written in MDX
- **Smooth Animations**: Framer Motion for elegant page transitions and interactions
- **Dark Mode**: Full dark mode support with system preference detection
- **Responsive Design**: Mobile-first design that works across all devices
- **Performance Optimized**: Optimized fonts, images, and code splitting
- **Accessible**: Built with accessibility best practices

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Content**: [MDX](https://mdxjs.com/)
- **Storage**: [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Fonts**: Inter, Geist Sans, Geist Mono

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/syn7515/portfolio2025.git
cd portfolio2025
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
portfolio2025/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── aniai/              # Aniai project case study
│   │   ├── athenahealth/       # AthenaHealth project case study
│   │   ├── blog/               # Blog section
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── project-item.tsx
│   │   │   └── ...
│   │   ├── blog-post-toc.tsx
│   │   ├── blog-post-layout.tsx
│   │   └── blog-post.module.css
│   └── lib/                    # Utility functions
├── public/                     # Static assets
└── package.json
```

## 🎨 Key Components

- **ProjectItem**: Animated project card component with hover effects
- **BlogPostLayout**: Layout component for MDX blog posts with table of contents
- **BlogPostToc**: Auto-generated table of contents for long-form content
- **LabelIndicatorCarousel**: Interactive carousel component for project showcases

## 📝 Adding New Content

### Adding a New Project

1. Create a new directory in `src/app/` (e.g., `src/app/my-project/`)
2. Add a `page.tsx` file with the project layout
3. Add a `content.mdx` file with your project content
4. Update `src/app/page.tsx` to include a new `ProjectItem`

### Writing MDX Content

MDX files support both Markdown and React components. Use standard Markdown syntax with the ability to import and use React components.

## 🚢 Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and configure the build

The site will be live at `https://your-project.vercel.app`

## 🔧 Configuration

### Environment Variables

If using Vercel Blob storage, configure your blob storage credentials in your deployment environment.

### Image Hosting

Images are currently hosted on Vercel Blob Storage. Update the `remotePatterns` in `next.config.mjs` if using a different image host.

## 📄 License

This project is private and proprietary.

## 👤 Author

**Sue Park**
- Portfolio: [Live Site](https://suepark.xyz)
- Twitter: [@spark7515](https://x.com/spark7515)
- LinkedIn: [sooyeonp](https://www.linkedin.com/in/sooyeonp/)

---

Built with ❤️ using Next.js and TypeScript
