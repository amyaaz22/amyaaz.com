'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function About() {
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
    <>
      <Header />
      <main className="min-h-screen bg-dark-950 pt-32 pb-24">
        <div className="container-bounded max-w-4xl mx-auto">
          {/* Hero section */}
          <motion.section
            className="mb-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className="hero-title mb-6" variants={itemVariants}>
              Premium Digital <span className="gradient-text">Strategy & Design</span>
            </motion.h1>
            <motion.p className="text-xl text-dark-300 leading-relaxed" variants={itemVariants}>
              I'm Amyaaz, a strategist and designer crafting sophisticated digital experiences
              for forward-thinking brands. With 8+ years of experience, I blend strategic thinking
              with exceptional design to create work that truly resonates.
            </motion.p>
          </motion.section>

          {/* Two column layout */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Text content */}
            <motion.div className="space-y-6" variants={itemVariants}>
              <div>
                <h2 className="section-title mb-4">Philosophy</h2>
                <p className="text-dark-300 leading-relaxed">
                  I believe great design isn't just beautiful—it's strategic. Every project
                  starts with understanding your business, your audience, and your goals.
                  From there, I craft solutions that are both visually stunning and
                  commercially effective.
                </p>
              </div>

              <div>
                <h2 className="section-title mb-4">Expertise</h2>
                <ul className="space-y-3 text-dark-300">
                  {[
                    'Brand Strategy & Positioning',
                    'Visual Identity Design',
                    'Web Design & Development',
                    'Product Strategy & UX',
                    'Digital Transformation',
                    'Growth Consulting',
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-accent-500 mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="section-title mb-4">Approach</h2>
                <p className="text-dark-300 leading-relaxed">
                  Every project is a partnership. I invest time to truly understand your vision,
                  then deliver solutions that exceed expectations. My process combines strategic
                  thinking, design excellence, and technical expertise.
                </p>
              </div>
            </motion.div>

            {/* Image placeholder with gradient */}
            <motion.div
              className="relative h-96 lg:h-full rounded-2xl overflow-hidden glass-card p-8 flex items-center justify-center min-h-96"
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-500/20 to-accent-600/10" />
              <div className="relative z-10 text-center">
                <div className="w-32 h-32 rounded-full bg-accent-500/20 border-2 border-accent-500/50 mx-auto mb-6 flex items-center justify-center">
                  <span className="text-6xl">👋</span>
                </div>
                <p className="text-dark-300 mb-4">Your photo goes here</p>
                <p className="text-sm text-dark-400">Professional headshot or portrait</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats section */}
          <motion.section
            className="mb-20 grid grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { number: '50+', label: 'Projects Completed' },
              { number: '30+', label: 'Happy Clients' },
              { number: '8+', label: 'Years Experience' },
            ].map((stat, i) => (
              <motion.div key={i} className="text-center" variants={itemVariants}>
                <div className="text-4xl font-bold text-accent-500 mb-2">{stat.number}</div>
                <div className="text-dark-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.section>

          {/* CTA Section */}
          <motion.section
            className="glass-card p-12 rounded-2xl text-center"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <h2 className="text-3xl font-serif font-bold mb-4">
              Ready to Transform Your Brand?
            </h2>
            <p className="text-dark-300 mb-8 max-w-2xl mx-auto">
              Let's discuss how strategic design and innovative thinking can elevate your vision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:hello@amyaaz.com" className="button-primary">
                Get In Touch
              </a>
              <Link href="/" className="button-secondary">
                Back to Home
              </Link>
            </div>
          </motion.section>
        </div>
      </main>
      <Footer />
    </>
  )
}
