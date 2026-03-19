"use client";

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ProjectItem from '@/components/ui/project-item';
import InlineLinkPreview from '@/components/ui/inline-link-preview';

// Persists across client-side navigation (back button) but resets on full page load
let hasVisitedHome = false;

export default function Home() {
  const shouldAnimate = !hasVisitedHome;

  useEffect(() => {
    hasVisitedHome = true;
  }, []);

  return (


    <div className="font-sans grid grid-rows-[80px_1fr_20px] items-center justify-items-center min-h-screen pb-0 gap-1">
      <main className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="intro-container max-w-[512px] mx-auto px-4" style={{ paddingTop: 'clamp(40px, 10vh, 100px)' }}>
          <motion.div
            className="intro-text flex justify-between items-center w-full"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.p
              className="!text-stone-800 dark:!text-zinc-200 !mb-0 md:!mb-0 !font-medium !dark:!text-zinc-100"
              initial={false}
              animate={false}
              style={{
                fontFamily: 'var(--font-libre-caslon), serif',
                fontSize: '32px',
                lineHeight: '150%',
                letterSpacing: '-0.03em',
              }}
            >
              Sue Park
            </motion.p>
            <div className="flex gap-4 items-center">
              <a
                href="https://x.com/spark7515"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Twitter"
              >
                <svg className="w-[22px] h-[22px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/sooyeonp/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              {/* <Button
                variant="ghost"
                asChild
                className="group shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] bg-white dark:bg-[var(--background)] group-hover:bg-stone-100 dark:group-hover:bg-zinc-800 !font-[420] border border-stone-200/80 dark:border-zinc-700/80 [&>a]:bg-white [&>a]:dark:bg-[var(--background)] [&>a]:group-hover:bg-stone-100 [&>a]:dark:group-hover:bg-zinc-800 [&>a]:shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] px-3.5 py-0 [&>a]:px-3.5 [&>a]:py-0 leading-none [&>a]:leading-none h-[32px] [&>a]:h-[32px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 [&>a]:focus-visible:ring-2 [&>a]:focus-visible:ring-blue-600 [&>a]:focus-visible:ring-offset-2"
              >
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Resume"
                >
                  Resume
                </a>
              </Button> */}
            </div>
          </motion.div>
          <motion.p
            className="intro-text !text-stone-800 dark:!text-inherit !font-[420] mt-10 !mb-5"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.08 }}
          >
            Product designer with engineering mindset, obsessed with <span className="italic">why</span> behind everything — from systems to pixels.
          </motion.p>
          <motion.p
            className="!text-stone-800 dark:!text-inherit !font-[420] !mb-5"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.16 }}
          >
            <span className="intro-text">Currently a founding product designer at </span><InlineLinkPreview href="https://www.aniai.ai/" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/aniai.webp' explanation="A robotics startup specialized in kitchen automation">Aniai</InlineLinkPreview><span className="intro-text">, designing robots and tools behind them.</span>
          </motion.p>
          <motion.p
            className="!text-stone-500 dark:!text-zinc-400 !font-[420] mb-0"
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.24 }}
          >
            <span className="intro-text">Previously, reimagined public benefits at </span><InlineLinkPreview href="https://goinvo.com/" variant="intro-link-light" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/goinvo.jpg' explanation="A Boston studio crafting healthcare software for 20+ years">Goinvo</InlineLinkPreview><span className="intro-text"> and advanced healthcare accessibility at </span><InlineLinkPreview href="https://www.athenahealth.com/" variant="intro-link-light" imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/athenahealth.jpeg" explanation='A healthtech company serving 170K+ clinicians across the US'>AthenaHealth</InlineLinkPreview><span className="intro-text">.</span>
          </motion.p>
        </div>

        <div className="max-w-[800px] mx-auto w-full px-4 mt-24 lg:mt-30">
          <div className="grid gap-12 md:gap-20 lg:gap-28">
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/aniai-main.png"
              organization="Aniai"
              dates="2024-2025"
              description="Building the Tools Behind Smarter Robots"
              href="/aniai"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
            />
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/alphagrill-main.png"
              organization="Aniai"
              dates="2025-2026"
              description="Robot Interface for Collaboration in Kitchen"
              href="/alphagrill"
              imageObjectPosition="center center"
              imageSizePercent={85}
              imageObjectFit="contain"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.44 }}
            />
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/athenahealth-main.png"
              organization="AthenaHealth"
              dates="2023"
              description="Encouraging Prompt Bill Payment"
              href="/athenahealth"
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.48 }}
            />
          </div>
        </div>

        <motion.div
          className="max-w-[480px] mx-auto px-4 mt-24 mb-0 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.56 }}
        >
          <div
            className="text-[14px] text-stone-400 dark:text-zinc-500 font-normal font-sans"
          >
            © {new Date().getFullYear()} Sue Park. — Built with Cursor
          </div>
        </motion.div>

      </main>

    </div>
  );
}
