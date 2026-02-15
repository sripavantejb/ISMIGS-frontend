import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import IndiaMapVisualization from './IndiaMapVisualization'

const GRID_FACTOR = 0.02
const GRID_CLAMP = 20
const PARALLAX_FACTOR = 0.65
const FADEOUT_FACTOR = 1.5
const FADEOUT_TRANSLATE = 40

function clamp(value, max) {
  return Math.max(-max, Math.min(max, value))
}

export default function Hero() {
  const sectionRef = useRef(null)
  const [cursorOffset, setCursorOffset] = useState({ x: 0, y: 0 })
  const [scrollProgress, setScrollProgress] = useState(0)
  const [heroHeight, setHeroHeight] = useState(0)

  const handleMouseMove = (e) => {
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const rawX = (e.clientX - centerX) * GRID_FACTOR
    const rawY = (e.clientY - centerY) * GRID_FACTOR
    setCursorOffset({
      x: clamp(rawX, GRID_CLAMP),
      y: clamp(rawY, GRID_CLAMP),
    })
  }

  const handleMouseLeave = () => {
    setCursorOffset({ x: 0, y: 0 })
  }

  const updateScroll = useCallback(() => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const height = rect.height
    if (height <= 0) return
    setHeroHeight(height)
    const progress = Math.min(1, Math.max(0, -rect.top / height))
    setScrollProgress(progress)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [updateScroll])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMeasure = () => requestAnimationFrame(() => updateScroll())
    onMeasure()
    const ro = new ResizeObserver(onMeasure)
    ro.observe(el)
    const t = setTimeout(updateScroll, 100)
    return () => {
      ro.disconnect()
      clearTimeout(t)
    }
  }, [updateScroll])

  const parallaxY = scrollProgress * heroHeight * PARALLAX_FACTOR
  const contentOpacity = Math.max(0, 1 - scrollProgress * FADEOUT_FACTOR)
  const contentTranslateY = -scrollProgress * FADEOUT_TRANSLATE

  return (
    <section
      ref={sectionRef}
      className="relative h-full min-h-0 flex flex-col lg:flex-row items-stretch px-6 md:px-8 lg:px-10 pt-28 pb-4 md:pb-6 overflow-hidden w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background layers wrapper — parallax (moves slower than content) */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-150 ease-out"
        aria-hidden
        style={{
          transform: `translateY(${parallaxY}px)`,
          willChange: 'transform',
        }}
      >
        {/* Purple arc / glow background */}
        <div className="absolute inset-0 pointer-events-none animate-glow-pulse">
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[70%] rounded-full opacity-60"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
            }}
          />
        </div>

        {/* Subtle grid background — cursor-reactive */}
        <div
          className="absolute inset-0 pointer-events-none hero-grid transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${cursorOffset.x}px, ${cursorOffset.y}px)`,
          }}
        />

        {/* Floating orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
      </div>

      {/* Foreground content — motion entrance; fade-out and move up on scroll */}
      <motion.div
        className="relative z-10 w-full flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 justify-between transition-all duration-200 ease-out"
        initial={{ opacity: 0, y: 24 }}
        animate={
          scrollProgress > 0
            ? { opacity: contentOpacity, y: contentTranslateY }
            : { opacity: 1, y: 0 }
        }
        transition={{
          duration: scrollProgress > 0 ? 0.2 : 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      >
        {/* Left: ISMIGS, full name, description, CTAs — shifted right */}
        <div className="flex-1 flex flex-col justify-center min-w-0 w-full ml-10 md:ml-16 lg:ml-24">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white leading-tight mb-5 text-left">
            ISMIGS
          </h1>
          <p className="text-left mb-3 pb-1.5 border-b-2 border-ismigs-purple w-fit text-gray-300 text-xl md:text-2xl font-normal leading-relaxed max-w-2xl">
            India State Macro Intelligence & Governance System
          </p>
          <p className="text-left text-gray-400 text-base md:text-lg mb-10 max-w-xl">
            State-level macro, energy, and inflation intelligence — powered by official data.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold bg-ismigs-purple text-white rounded-xl hover:bg-ismigs-purple-bright hover:shadow-lg hover:shadow-ismigs-purple/30 transition-all duration-200 min-w-[200px]"
            >
              View Dashboards
            </Link>
            <Link
              to="#"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-medium border-2 border-white/40 text-white rounded-xl hover:bg-white/10 hover:border-white/60 transition-all duration-200 min-w-[200px]"
            >
              See How It Works
            </Link>
          </div>
        </div>

        {/* Right: Map — fills right side */}
        <div className="relative z-10 flex-1 lg:min-w-0 lg:min-h-[50vh] flex items-center justify-center mt-6 lg:mt-0">
          <IndiaMapVisualization />
        </div>
      </motion.div>
    </section>
  )
}
