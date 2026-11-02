// app/page.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Microscope, Book, Briefcase, Music, Play } from "lucide-react"
import { motion } from "framer-motion"

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
      <div className="absolute inset-0 pointer-events-none z-[5]">
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
          className="absolute top-1/4 right-1/2 w-40 h-40 bg-accent rounded-full blur-2xl opacity-15"
          animate={{ x: [0, 60, 0], y: [0, -40, 0 ]}}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-contrast rounded-full blur-2xl opacity-10"
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
          className="absolute bottom-0 right-1/4 w-32 h-32 bg-accent rounded-full blur-2xl opacity-20"
          animate={{ x: [0, -50, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
        />
      </div>      

      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="flex-1 text-center relative z-20"
        >
          <Image
            src={"/images/landing/logo-temp.png"}
            alt="Uncultured Creations Logo"
            width={300}
            height={300}
            className="mx-auto mb-10 drop-shadow-[0_0_55px_rgba(255,255,255,0.0)] animate-logoPulse"
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
              className="text-xl text-contrast mt-12"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              A hub of bold
              <motion.span
              animate={{ color: ["#0066FF", "#a855f7", "#F0EBE1"] }} // blue → white → purple
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 0 }}
              > storytelling
              </motion.span>, unapologetic 

              <motion.span
              animate={{ color: ["#a855f7", "#F0EBE1", "#0066FF"] }} // blue → white → purple
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              > fandom
              </motion.span>, and raw 

              <motion.span
              animate={{ color: ["#F0EBE1", "#0066FF", "#a855f7"] }} // blue → white → purple
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", delay: 2 }}
              > creativity
              </motion.span>.
            </motion.p>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative flex flex-col justify-center items-center w-[50vw] h-[32rem] md:h-[40rem]">
          <div className="relative flex justify-center items-center w-full h-full perspective-[2000px]">
            {projects.map((project, i) => (
              <motion.div
                key={i}
                style={{ zIndex: i === index ? 10 : -10 }}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  rotateY: i === index ? 0 : (i < index ? 25 : -25),
                }}
                animate={{
                  opacity: i === index ? 1 : 0.25,
                  scale: i === index ? 1 : 0.7,
                  rotateY: i === index ? 0 : (i < index ? 25 : -25),
                  zIndex: i === index ? 10 : 0,
                  x: (i - index) * 320,
                  filter: i === index ? "blur(0px)" : "blur(2px)",
                }}
                transition={{ duration: 0.8, type: "spring", stiffness: 150 }}
                className="absolute rounded-2xl shadow-2xl overflow-hidden w-[18rem] h-[25rem] md:w-[24rem] md:h-[33rem] flex flex-col cursor-pointer"
                whileHover={i === index ? { scale: 1.03, rotate: 1 } : {}}
              >
                {/* Background Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Enhanced Gradient Overlay */}
                  <motion.div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>

                  {/* Card Content with Frosted Glass */}
                  <div className="absolute bottom-0 p-5 text-left text-contrast rounded-t-xl w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        className="p-2 bg-accent rounded-full shadow-lg"
                        animate={{ rotate: [0, 15, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity }}
                      >
                        {project.icon}
                      </motion.div>
                      <h2 className="text-xl md:text-2xl font-bold">{project.title}</h2>
                    </div>
                    <p className="text-sm opacity-90 mb-3">{project.description}</p>
                    <Link
                      href={project.href}
                      className="inline-block px-5 py-2 bg-accent text-contrast font-bold rounded-lg relative overflow-hidden group"
                    >
                      <span className="relative z-10">Explore</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 opacity-0 group-hover:opacity-100 transition duration-500"></span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dots Navigation */}
          <div className="flex space-x-3 mt-2 mb-7">
            {projects.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-3 h-3 rounded-full ${
                  i === index ? "bg-accent" : "bg-contrast/50"
                }`}
                animate={
                  i === index
                    ? { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
                whileHover={{ scale: 1.3 }}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Fade overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-base via-transparent to-base z-[6]" />
    </main>
  )
}
