'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-600/5 blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <motion.div
        className="container-bounded relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo mark */}
          <motion.div
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 240 240"
              className="w-20 h-20 text-accent-500 drop-shadow-lg"
              fill="currentColor"
            >
              <polygon points="80,200 110,40 130,40 160,200" />
              <polygon points="130,40 190,200 210,200 150,40" />
              <polygon points="120,100 155,180 85,180" fill="white" opacity="0.15" />
            </svg>
          </motion.div>

          {/* Main heading */}
          <motion.h1 className="hero-title mb-6" variants={itemVariants}>
            Strategic Design <br />
            <span className="gradient-text">That Transforms</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="text-xl sm:text-2xl text-dark-300 mb-8 leading-relaxed"
            variants={itemVariants}
          >
            Premium digital strategy, innovative branding, and high-end creative solutions
            that elevate your vision to reality.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={itemVariants}
          >
            <Link href="#work" className="button-primary">
              Explore Work
            </Link>
            <Link href="/about" className="button-secondary">
              About Me
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-20 grid grid-cols-3 gap-8"
            variants={itemVariants}
          >
            {[
              { label: 'Projects', value: '50+' },
              { label: 'Clients', value: '30+' },
              { label: 'Years', value: '8+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-accent-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2 text-dark-400">
          <span className="text-xs font-medium uppercase tracking-wide">Scroll</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </motion.div>
    </section>
  )
}
