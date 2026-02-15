import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STEPS = [
  {
    label: 'Step 1',
    headline: 'Admin initiates a disclosure or insight post.',
    body: 'For example, an energy commodity update or other sector insight.'
  },
  {
    label: 'Step 2',
    headline: 'Admin enters their email and submits.',
    body: 'The admin completes the form with their email address and submits to request the confirmation email.'
  },
  {
    label: 'Step 3',
    headline: 'System sends a confirmation email.',
    body: 'The email contains a draft LinkedIn-style post, an Approve (Yes) link, and a Reject (No) link.'
  },
  {
    label: 'Step 4',
    headline: 'Approval path.',
    body: "Admin clicks Yes → redirected to approval; post is approved and published; status shows 'Approved' in Sector Alerts."
  },
  {
    label: 'Step 5',
    headline: 'Rejection path.',
    body: "Admin clicks No → redirected to rejection; post is cancelled; status shows 'Rejected'."
  }
]

export default function DisclosureFlowSection() {
  const [stepIndex, setStepIndex] = useState(0)
  const sectionRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress
        const index = Math.min(4, Math.floor(p * 5))
        setStepIndex(index)
      }
    })
    return () => {
      st.kill()
    }
  }, [])

  const step = STEPS[stepIndex]
  const stepNumber = stepIndex + 1

  return (
    <section id="disclosure-flow" className="relative z-10">
      {/* Scroll driver: 5 viewport heights – scroll only changes step content, stays on this "screen" */}
      <div ref={sectionRef} className="relative" style={{ height: '500vh' }}>
        {/* Full viewport sticky block – occupies entire screen */}
        <div className="sticky top-0 w-full min-h-screen flex flex-col justify-center bg-background">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left: step label + headline + body (animated on change) */}
            <div className="flex-1 max-w-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="space-y-4"
                >
                  <p className="text-primary font-semibold text-sm uppercase tracking-wider">
                    Step {stepNumber} of admin flow
                  </p>
                  <h2 className="text-foreground font-bold text-2xl md:text-3xl lg:text-4xl leading-tight">
                    {step.headline}
                  </h2>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                    {step.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: big step number */}
            <div className="flex-shrink-0 flex items-center justify-center lg:justify-end">
              <motion.span
                key={stepNumber}
                initial={{ scale: 0.85, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-primary font-bold text-[8rem] md:text-[10rem] lg:text-[12rem] leading-none select-none"
              >
                {stepNumber}
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
