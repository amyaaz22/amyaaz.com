'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const projects = [
  {
    title: 'Intellecht Solutions',
    category: 'Brand Identity & Web',
    description: 'Full branding, positioning, and premium web presence for a tech consulting firm.',
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    title: 'Digital Innovation Lab',
    category: 'Product Design & Development',
    description: 'End-to-end product strategy, design, and full-stack development for a SaaS platform.',
    gradient: 'from-accent-600 to-accent-700',
  },
  {
    title: 'Premium Brand Refresh',
    category: 'Logo Design & Strategy',
    description: 'Comprehensive brand overhaul including logo, visual identity, and brand guidelines.',
    gradient: 'from-accent-400 to-accent-500',
  },
  {
    title: 'Corporate Website',
    category: 'Web Design & Development',
    description: 'High-performance Next.js website with custom animations and premium UX.',
    gradient: 'from-accent-700 to-dark-700',
  },
]

export default function Work() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section id="work" className="py-24 relative overflow-hidden">
      <div className="container-bounded relative z-10">
        {/* Section header */}
        <motion.div
          className="max-w-2xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title mb-4">Selected Work</h2>
          <p className="text-lg text-dark-300">
            Strategic projects that showcase premium design, innovation, and measurable impact.
          </p>
        </motion.div>

        {/* Projects grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {projects.map((project, i) => (
            <motion.div
              key={i}
              className="group relative overflow-hidden rounded-2xl cursor-pointer h-96"
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-500`}
              />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm font-medium text-accent-300 mb-2 uppercase tracking-wide">
                    {project.category}
                  </p>
                  <h3 className="text-3xl font-serif font-bold mb-3">{project.title}</h3>
                  <p className="text-dark-200 leading-relaxed max-w-sm">
                    {project.description}
                  </p>
                </motion.div>

                {/* Arrow indicator */}
                <motion.div
                  className="mt-6 flex items-center gap-2 text-accent-300"
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-sm font-medium">View Project</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </div>

              {/* Hover effect border */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-accent-300/30 transition-all duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background accent */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent-500/5 blur-3xl pointer-events-none" />
    </section>
  )
}
