"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProjectItem from '@/components/ui/project-item';
import InlineLinkPreview from '@/components/ui/inline-link-preview';

// Persists across client-side navigation (back button) but resets on full page load
let hasVisitedHome = false;

export default function Home() {
  const shouldAnimate = !hasVisitedHome;
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    hasVisitedHome = true;
    setAnimationReady(true);
  }, []);

  const animateVisible = { opacity: 1, y: 0, filter: "blur(0px)" };
  const animateHidden = { opacity: 0, y: 20, filter: "blur(1.5px)" };
  const getAnimate = () => (!shouldAnimate || animationReady ? animateVisible : animateHidden);

  return (


    <div className="font-sans grid grid-rows-[80px_1fr_20px] items-center justify-items-center min-h-screen pb-0 gap-1">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-stone-800 focus:rounded focus:shadow">Skip to content</a>
      <main id="main" className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="intro-container max-w-[592px] mx-auto px-4 pt-0 sm:pt-16 lg:pt-24">
          {/* Left column: name */}
          <div>
            <motion.h1
              className="intro-text !text-stone-800 dark:!text-zinc-200 !mb-0 md:!mb-0 !font-medium !dark:!text-zinc-100"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                fontFamily: 'var(--font-libre-caslon), serif',
                fontSize: '32px',
                lineHeight: '150%',
                letterSpacing: '-0.03em',
              }}
            >
              Sue Park
            </motion.h1>
          </div>
          {/* Right column: bio + social links */}
          <div>
            <motion.p
              className="intro-text !text-stone-800 dark:!text-inherit !font-[420] mt-8 md:mt-10 lg:mt-12 !mb-5"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.08 }}
            >
              Product designer with engineering mindset, obsessed with <span className="italic">why</span> behind everything — from systems to pixels.
            </motion.p>
            <motion.p
              className="!text-stone-800 dark:!text-inherit !font-[420] !mb-5"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.16 }}
            >
              <span className="intro-text">Currently a founding product designer at </span><InlineLinkPreview href="https://www.aniai.ai/" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/aniai.webp' explanation="A robotics startup specialized in kitchen automation">Aniai</InlineLinkPreview><span className="intro-text">, designing robots and tools behind them.</span>
            </motion.p>
            <motion.p
              className="!text-stone-500 dark:!text-zinc-400 !font-[420] mb-0"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.24 }}
            >
              <span className="intro-text">Previously, reimagined public benefits at </span><InlineLinkPreview href="https://goinvo.com/" variant="intro-link-light" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/goinvo.jpg' explanation="A Boston design studio crafting healthcare software for 20+ years">Goinvo</InlineLinkPreview><span className="intro-text"> and advanced healthcare accessibility at </span><InlineLinkPreview href="https://www.athenahealth.com/" variant="intro-link-light" imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/athenahealth.jpeg" explanation='A healthtech company serving 170K+ clinicians across the US'>AthenaHealth</InlineLinkPreview><span className="intro-text">.</span>
            </motion.p>
            <motion.div
              className="intro-text flex gap-2 mt-8"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.32 }}
            >
              <a
                href="https://x.com/sue_park__"
                target="_blank"
                rel="noopener noreferrer"
                className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-600 dark:hover:!text-lime-400 !no-underline !not-italic"
                style={{ fontSize: '14px' }}
              >
                Twitter
              </a>
              <span className="!text-stone-400 dark:!text-zinc-600" style={{ fontSize: '14px' }}>·</span>
              <a
                href="https://www.linkedin.com/in/sooyeonp/"
                target="_blank"
                rel="noopener noreferrer"
                className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-600 dark:hover:!text-lime-400 !no-underline !not-italic"
                style={{ fontSize: '14px' }}
              >
                LinkedIn
              </a>
            </motion.div>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto w-full px-4 mt-12 lg:mt-24">
          <div className="grid gap-12 md:gap-20 lg:gap-28">
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/aniai-main.png"
              alt="Aniai internal tools dashboard"
              organization="Aniai"
              dates="2024 - 2025"
              description="Building the Tools Behind Smarter Robots"
              href="/aniai"
              fetchPriority="high"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
            />
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/alphagrill-main.png"
              alt="AlphaGrill robot interface for kitchen collaboration"
              organization="Aniai"
              dates="2025 - 2026"
              description="Robot Interface for Collaboration in Kitchen"
              href="/alphagrill"
              imageObjectPosition="center center"
              imageSizePercent={85}
              imageObjectFit="contain"
              loading="lazy"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.44 }}
            />
            <ProjectItem
              imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/athenahealth-main.png"
              alt="AthenaHealth bill payment prompt interface"
              organization="AthenaHealth"
              dates="2023"
              description="Encouraging Prompt Bill Payment"
              href="/athenahealth"
              loading="lazy"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.48 }}
            />
          </div>
        </div>

        <motion.div
          className="max-w-[480px] mx-auto px-4 mt-24 mb-0 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
          animate={getAnimate()}
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
