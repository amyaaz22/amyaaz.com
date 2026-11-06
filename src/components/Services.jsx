'use client'

import { motion } from 'framer-motion'

const services = [
  {
    icon: '✨',
    title: 'Brand Strategy',
    description: 'Comprehensive brand positioning, messaging architecture, and strategic direction that resonates.',
  },
  {
    icon: '🎨',
    title: 'Visual Design',
    description: 'Premium logo design, brand identity systems, and sophisticated visual communication.',
  },
  {
    icon: '💻',
    title: 'Digital Solutions',
    description: 'High-performance websites, applications, and digital products with cutting-edge technology.',
  },
  {
    icon: '📱',
    title: 'Web Development',
    description: 'Next.js, React, and modern tech stacks for fast, scalable, beautiful web experiences.',
  },
  {
    icon: '🚀',
    title: 'Product Design',
    description: 'User-centered design, UX strategy, and interface design that drives engagement.',
  },
  {
    icon: '📊',
    title: 'Consulting',
    description: 'Strategic guidance on digital transformation, growth, and competitive positioning.',
  },
]

export default function Services() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      <div className="container-bounded relative z-10">
        {/* Section header */}
        <motion.div
          className="max-w-2xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title mb-4">Services</h2>
          <p className="text-lg text-dark-300">
            End-to-end solutions covering strategy, design, development, and growth.
          </p>
        </motion.div>

        {/* Services grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, i) => (
            <motion.div
              key={i}
              className="group glass-card p-8 hover:bg-white/10 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {service.icon}
              </div>
              <h3 className="text-xl font-serif font-bold mb-3">{service.title}</h3>
              <p className="text-dark-400 leading-relaxed">{service.description}</p>
              <div className="mt-6 h-0.5 w-0 bg-gradient-to-r from-accent-500 to-transparent group-hover:w-12 transition-all duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Background accent */}
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-accent-500/5 blur-3xl pointer-events-none" />
    </section>
  )
}
