'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Work', href: '#work' },
    { label: 'Services', href: '#services' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-dark-950/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container-bounded flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="group relative">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg
                viewBox="0 0 240 240"
                className="w-8 h-8 text-accent-500 group-hover:text-accent-600"
                fill="currentColor"
              >
                <polygon points="80,200 110,40 130,40 160,200" />
                <polygon points="130,40 190,200 210,200 150,40" />
                <polygon points="120,100 155,180 85,180" fill="white" opacity="0.1" />
              </svg>
            </div>
            <span className="text-xl font-serif font-bold text-accent-500 group-hover:text-accent-600">
              Amyaaz
            </span>
          </motion.div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link, i) => (
            <Link
              key={i}
              href={link.href}
              className="nav-link group px-4 py-2"
            >
              <span className="relative">
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent-500 group-hover:w-full transition-all duration-300" />
              </span>
            </Link>
          ))}
        </nav>

        {/* CTA Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="#contact" className="button-primary hidden sm:block">
            Get Started
          </Link>
        </motion.div>
      </div>
    </motion.header>
  )
}
