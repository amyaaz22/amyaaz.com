'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-white/5 bg-dark-900/50 backdrop-blur-sm">
      <div className="container-bounded py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span className="text-xl font-serif font-bold text-accent-500">Amyaaz</span>
            </Link>
            <p className="text-dark-400 text-sm leading-relaxed">
              Premium digital strategy and design for forward-thinking brands.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-dark-100 mb-4">Navigation</h4>
            <ul className="space-y-3">
              {['Work', 'Services', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <Link
                    href={item === 'About' ? '/about' : `#${item.toLowerCase()}`}
                    className="text-dark-400 hover:text-accent-500 transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-dark-100 mb-4">Services</h4>
            <ul className="space-y-3">
              {['Brand Strategy', 'Design', 'Development', 'Consulting'].map((service) => (
                <li key={service}>
                  <a href="#services" className="text-dark-400 hover:text-accent-500 transition-colors text-sm">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-dark-100 mb-4">Connect</h4>
            <ul className="space-y-3">
              {['LinkedIn', 'Twitter', 'Instagram', 'Email'].map((social) => (
                <li key={social}>
                  <a href="#" className="text-dark-400 hover:text-accent-500 transition-colors text-sm">
                    {social}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-dark-500">
          <p>&copy; {currentYear} Amyaaz. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent-500 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-accent-500 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
