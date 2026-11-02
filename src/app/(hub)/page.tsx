// app/(hub)/page.tsx — landing page
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Microscope, Book, Briefcase, Music, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, useReducedMotion, type PanInfo } from "framer-motion"

const projects = [
  {
    title: "Reality Reloaded",
    description: "Enter the ultimate reality TV fan zone.",
    href: "/fanzone",
    icon: Play,
    image: "/images/landing/fanzone.png",
  },
  {
    title: "Stories",
    description: "Explore original fiction and visual novels.",
    href: "/stories",
    icon: Book,
    image: "/images/landing/stories.png",
  },
  {
    title: "Lyrics & Spoken Word",
    description: "Dive into my songwriting and poetic works.",
    href: "/music",
    icon: Music,
    image: "/images/landing/lyrics.png",
  },
  {
    title: "Portfolio",
    description: "View my creative and client-based projects.",
    href: "/portfolio",
    icon: Briefcase,
    image: "/images/landing/portfolio.png",
  },
  {
    title: "The Lab",
    description: "Unreleased, unfinished, and unfiltered.",
    href: "/the-lab",
    icon: Microscope,
    image: "/images/landing/lab.png",
  },
]

// Decorative background orbs: position/size classes plus their drift animation.
// The four unblurred ones are the crisp circles; the rest are soft glows.
const orbs = [
  { className: "top-40 left-20 w-24 h-24 bg-accent blur-2xl opacity-60", animate: { x: [0, 40, 0], y: [0, -30, 0] }, duration: 6 },
  { className: "top-0 left-1/4 w-40 h-40 bg-contrast opacity-20", animate: { x: [0, 200, 0], y: [0, 500, 0] }, duration: 25 },
  { className: "top-0 left-80 w-40 h-40 bg-secondary opacity-20", animate: { x: [0, -230, 0], y: [0, 490, 0] }, duration: 35 },
  { className: "top-1/3 right-20 w-32 h-32 bg-contrast blur-2xl opacity-50", animate: { x: [0, 40, 0] }, duration: 8 },
  { className: "top-1/4 right-1/2 w-40 h-40 bg-accent blur-2xl opacity-15", animate: { x: [0, 60, 0], y: [0, -40, 0] }, duration: 7 },
  { className: "bottom-20 left-1/4 w-40 h-40 bg-contrast blur-2xl opacity-10", animate: { y: [0, 50, 0] }, duration: 10 },
  { className: "top-0 right-80 w-40 h-40 bg-secondary opacity-20", animate: { x: [0, 200, 0], y: [0, 450, 0] }, duration: 40 },
  { className: "top-0 right-1/4 w-40 h-40 bg-accent opacity-20", animate: { x: [0, -300, 0], y: [0, 470, 0] }, duration: 20 },
  { className: "bottom-0 right-1/4 w-32 h-32 bg-accent blur-2xl opacity-20", animate: { x: [0, -50, 0] }, duration: 7 },
]

// Tagline accent words cycle through the brand colours.
const taglineWords = [
  { word: "storytelling", colors: ["#0066FF", "#a855f7", "#F0EBE1"], delay: 0 },
  { word: "fandom", colors: ["#a855f7", "#F0EBE1", "#0066FF"], delay: 1 },
  { word: "creativity", colors: ["#F0EBE1", "#0066FF", "#a855f7"], delay: 2 },
]

const ROTATION_MS = 12000
const SWIPE_THRESHOLD = 60

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"

export default function Home() {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Respect the reduced-motion setting: no automatic rotation.
  useEffect(() => {
    if (reduceMotion) setIsPlaying(false)
  }, [reduceMotion])

  // Auto-advance. Restarts after every slide change, so manual navigation gets a full interval.
  useEffect(() => {
    if (!isPlaying || isHovered) return
    const timer = setTimeout(() => setIndex((prev) => (prev + 1) % projects.length), ROTATION_MS)
    return () => clearTimeout(timer)
  }, [index, isPlaying, isHovered])

  const goTo = (i: number) => setIndex((i + projects.length) % projects.length)

  const onSwipe = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(index + 1)
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(index - 1)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[url('/images/UC-BG-Overlay.png')] px-4 text-contrast">
      {/* Corner clouds (decorative, static): above the edge fade, below the active card and text */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[7] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-[110px] md:h-[36rem] md:w-[36rem]" />
        <div className="absolute -bottom-48 -right-40 h-[30rem] w-[30rem] rounded-full bg-secondary/30 blur-[110px] md:h-[40rem] md:w-[40rem]" />
      </div>

      {/* Floating orbs (decorative) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        {orbs.map((orb, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${orb.className}`}
            animate={reduceMotion ? undefined : orb.animate}
            transition={{ duration: orb.duration, repeat: Infinity }}
          />
        ))}
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center pb-10 pt-20 lg:flex-row lg:pb-0 lg:pt-0">
        {/* Intro */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-20 text-center lg:flex-1"
        >
          <Image
            src="/images/landing/logo-temp.png"
            alt=""
            width={300}
            height={300}
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 224px, 160px"
            className="mx-auto mb-6 w-40 animate-logoPulse motion-reduce:animate-none sm:w-56 lg:mb-10 lg:w-[300px]"
            priority
          />
          <div className="px-2 pb-7">
            <h1 className="mb-3 font-heading text-4xl text-contrast md:text-5xl">
              Welcome to{" "}
              <span className="animate-gradient-x bg-gradient-to-r from-accent via-secondary to-accent bg-[length:200%_auto] bg-clip-text text-5xl font-bold text-transparent motion-reduce:animate-none sm:text-6xl md:text-7xl">
                Uncultured Creations
              </span>
            </h1>
            {/* text-2xl keeps the brand-blue moments of the colour cycle above the large-text contrast minimum */}
            <motion.p
              className="mx-auto mt-6 max-w-xl text-2xl text-contrast lg:mt-12"
              animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              A hub of bold{" "}
              {taglineWords.map(({ word, colors, delay }, i) => (
                <span key={word}>
                  <motion.span
                    style={reduceMotion ? { color: "#a855f7" } : undefined}
                    animate={reduceMotion ? undefined : { color: colors }}
                    transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay }}
                  >
                    {word}
                  </motion.span>
                  {i === 0 ? ", unapologetic " : i === 1 ? ", and raw " : "."}
                </span>
              ))}
            </motion.p>
          </div>
        </motion.div>

        {/* Carousel */}
        <section
          aria-roledescription="carousel"
          aria-label="Creative sections"
          className="relative flex w-full flex-col items-center justify-center lg:w-[50vw]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsPlaying(false)}
        >
          <div
            aria-live={isPlaying ? "off" : "polite"}
            className="relative flex h-[27rem] w-full items-center justify-center md:h-[36rem]"
          >
            {projects.map((project, i) => {
              const isActive = i === index
              const Icon = project.icon
              return (
                <motion.div
                  key={project.href}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${projects.length}: ${project.title}`}
                  aria-hidden={!isActive}
                  inert={!isActive}
                  // Per-card perspective keeps each card in the page's layer order: the active card sits above
                  // the edge fade and clouds, the side cards below them (dimmed).
                  style={{ zIndex: isActive ? 10 : 0, transformPerspective: 2000 }}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0.25,
                    scale: isActive ? 1 : 0.7,
                    rotateY: isActive ? 0 : i < index ? 25 : -25,
                    x: (i - index) * 320,
                    filter: isActive ? "blur(0px)" : "blur(2px)",
                  }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.8, type: "spring", stiffness: 150 }}
                  drag={isActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={onSwipe}
                  whileHover={isActive && !reduceMotion ? { scale: 1.03, rotate: 1 } : undefined}
                  className="absolute flex h-[25rem] w-[18rem] flex-col overflow-hidden rounded-2xl shadow-2xl md:h-[33rem] md:w-[24rem]"
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={project.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 24rem, 18rem"
                      className="pointer-events-none object-cover"
                      priority={i === 0}
                      draggable={false}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60">
                      {!reduceMotion && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </div>

                    <div className="absolute bottom-0 w-full p-5 text-left text-contrast">
                      <div className="mb-2 flex items-center gap-2">
                        <motion.div
                          aria-hidden="true"
                          className="rounded-full bg-accent p-2 text-white shadow-lg"
                          animate={reduceMotion ? undefined : { rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 6, repeat: Infinity }}
                        >
                          <Icon className="h-8 w-8" />
                        </motion.div>
                        <h2 className="text-xl font-bold md:text-2xl">{project.title}</h2>
                      </div>
                      <p className="mb-3 text-sm opacity-90">{project.description}</p>
                      <Link
                        href={project.href}
                        aria-label={`Explore ${project.title}`}
                        className={`group relative inline-block overflow-hidden rounded-lg bg-accent px-5 py-2 font-bold text-white ${focusRing}`}
                      >
                        <span className="relative z-10">Explore</span>
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-r from-accent to-secondary opacity-0 transition duration-500 group-hover:opacity-100 motion-reduce:transition-none"
                        />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Controls */}
          <div className="relative z-[8] mb-7 mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous section"
              className={`rounded-full p-2 text-contrast/70 hover:text-contrast ${focusRing}`}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {projects.map((project, i) => (
              <button
                key={project.href}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show ${project.title}`}
                aria-current={i === index ? "true" : undefined}
                className={`grid h-6 w-6 place-items-center rounded-full ${focusRing}`}
              >
                <motion.span
                  aria-hidden="true"
                  className={`h-3 w-3 rounded-full ${i === index ? "bg-accent" : "bg-contrast/50"}`}
                  animate={i === index && !reduceMotion ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] } : undefined}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </button>
            ))}

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next section"
              className={`rounded-full p-2 text-contrast/70 hover:text-contrast ${focusRing}`}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((playing) => !playing)}
              aria-label={isPlaying ? "Pause automatic rotation" : "Start automatic rotation"}
              className={`ml-2 rounded-full p-2 text-contrast/70 hover:text-contrast ${focusRing}`}
            >
              {isPlaying ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </section>
      </div>

      {/* Edge fade */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[6] bg-gradient-to-r from-base via-transparent to-base" />
    </main>
  )
}
