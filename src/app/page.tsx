// app/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Microscope, Book, Briefcase, Music, Play } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const projects = [
    {
      title: "Reality Reloaded",
      description: "Enter the ultimate Big Brother fan zone.",
      href: "/fanzone",
      icon: <Play className="w-8 h-8" />,
      image: "/images/landing/fanzone.png",
    },
    {
      title: "Stories",
      description: "Explore original fiction and visual novels.",
      href: "/stories",
      icon: <Book className="w-8 h-8" />,
      image: "/images/landing/stories.png",
    },
    {
      title: "Lyrics & Spoken Word",
      description: "Dive into my songwriting and poetic works.",
      href: "/music",
      icon: <Music className="w-8 h-8" />,
      image: "/images/landing/lyrics.png",
    },
    {
      title: "Portfolio",
      description: "View my creative and client-based projects.",
      href: "/portfolio",
      icon: <Briefcase className="w-8 h-8" />,
      image: "/images/landing/portfolio.png",
    },
    {
      title: "The Lab",
      description: "Unreleased, unfinished, and unfiltered.",
      href: "/the-lab",
      icon: <Microscope className="w-8 h-8" />,
      image: "/images/landing/lab.png",
    },
  ]

  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % projects.length)
    }, 12000)
    return () => clearInterval(interval)
  }, [projects.length])

  return (
    <main
      className="relative min-h-screen text-contrast font-body px-4 overflow-hidden"
      style={{ backgroundImage: "url('/images/UC-BG-Overlay.png')" }}
    >
      {/* Floating Orbs */}
      <motion.div
        className="absolute top-40 left-20 w-24 h-24 bg-accent rounded-full blur-2xl opacity-60"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <motion.div
        className="absolute top-25 left-1/4 w-40 h-40 bg-contrast rounded-full blur-1xl opacity-20 z--5"
        animate={{ x: [0, 200, 0], y: [0, 500, 0] }}
        transition={{ duration: 25, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-25 left-80 w-40 h-40 bg-purple-500 rounded-full blur-1xl opacity-20 z--5"
        animate={{ x: [0, -230, 0], y: [0, 490, 0] }}
        transition={{ duration: 35, repeat: Infinity }}
      />

      <motion.div
        className="absolute top-1/3 right-20 w-32 h-32 bg-contrast rounded-full blur-2xl opacity-50"
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/4 right-1/2 w-40 h-40 bg-accent rounded-full blur-2xl opacity-50"
        animate={{ x: [0, 60, 0], y: [0, -40, 0 ]}}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-contrast rounded-full blur-2xl opacity-40"
        animate={{ y: [0, 50, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute bottom-25 right-80 w-40 h-40 bg-purple-500 rounded-full blur-1xl opacity-20 z--5"
        animate={{ x: [0, 200, 0], y: [0, 450, 0] }}
        transition={{ duration: 40, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-25 right-1/4 w-40 h-40 bg-accent rounded-full blur-1xl opacity-20 z--5"
        animate={{ x: [0, -300, 0], y: [0, 470, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
      />

      <motion.div
        className="absolute bottom-0 right-1/4 w-32 h-32 bg-accent rounded-full blur-2xl opacity-50"
        animate={{ x: [0, -50, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex-1 text-center"
        >
          <Image
            src={"/images/landing/logo-temp.png"}
            alt="Uncultured Creations Logo"
            width={300}
            height={300}
            className="mx-auto mb-10 drop-shadow-[0_0_55px_rgba(255,255,255,0.5)] animate-logoPulse"
            priority
          />
          <div className="inset-0 pr-2 pl-2 pb-7 rounded-2xl">
            <h1 className="text-4xl md:text-5xl font-heading text-contrast mb-3">
              Welcome to{" "}
              <span className="text-6xl md:text-7xl bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent font-bold animate-gradient-x">
                Uncultured Creations
              </span>
            </h1>
            <motion.p
              className="text-xl text-contrast"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              A hub of bold storytelling, unapologetic fandom, and raw creativity.
            </motion.p>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="flex-1 flex flex-col justify-center items-center h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
              className="absolute rounded-2xl shadow-2xl overflow-hidden w-[21rem] h-[28rem] md:w-[27rem] md:h-[36rem] flex flex-col"
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Image */}
              <div className="relative w-full h-full">
                <Image
                  src={projects[index].image}
                  alt={projects[index].title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Animated Gradient Overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                  animate={{ opacity: [0.7, 0.9, 0.7] }}
                  transition={{ duration: 5, repeat: Infinity }}
                />

                {/* Card Content */}
                <div className="absolute bottom-0 p-6 text-left text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      className="p-2 bg-accent rounded-full shadow-lg"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 6, repeat: Infinity }}
                    >
                      {projects[index].icon}
                    </motion.div>
                    <h2 className="text-2xl font-bold">{projects[index].title}</h2>
                  </div>
                  <p className="text-sm opacity-90 mb-3">{projects[index].description}</p>
                  <Link
                    href={projects[index].href}
                    className="inline-block px-5 py-2 bg-accent text-base font-bold rounded-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">Explore</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-accent to-pink-500 opacity-0 group-hover:opacity-100 transition duration-500"></span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Navigation */}
          <div className="flex space-x-3 mt-[33rem] md:mt-[42rem] mb-[2rem]">
            {projects.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-4 h-4 rounded-full ${
                  i === index ? "bg-accent scale-125" : "bg-contrast/50"
                }`}
                whileHover={{ scale: 1.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
