import { useState } from 'react'
import { motion } from 'framer-motion'

export default function SubscribeSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitted(true)
    setEmail('')
  }

  return (
    <section className="relative z-10 py-16 md:py-20 px-6 md:px-8 border-t border-white/10 bg-ismigs-dark">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Stay updated
        </h2>
        <p className="text-gray-400 text-base mb-8">
          Get insights and updates on India&apos;s macro and energy intelligence.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 min-w-0 px-5 py-3.5 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-ismigs-purple focus:ring-1 focus:ring-ismigs-purple transition-colors"
            disabled={submitted}
            aria-label="Email address"
          />
          <motion.button
            type="submit"
            disabled={submitted}
            className="px-8 py-3.5 rounded-xl bg-ismigs-purple text-white font-semibold whitespace-nowrap disabled:opacity-80 disabled:cursor-not-allowed select-none"
            whileHover={!submitted ? { scale: 1.02 } : {}}
            whileTap={!submitted ? { scale: 0.96 } : {}}
            transition={{ duration: 0.15 }}
          >
            {submitted ? 'Subscribed' : 'Subscribe'}
          </motion.button>
        </form>
      </div>
    </section>
  )
}
