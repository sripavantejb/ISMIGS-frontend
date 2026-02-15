import { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const ScrollFloat = ({
  children,
  scrollContainerRef,
  containerClassName = '',
  textClassName = '',
  animationDuration = 1,
  ease = 'back.inOut(2)',
  scrollStart = 'center bottom+=50%',
  scrollEnd = 'bottom bottom-=40%',
  stagger = 0.03,
  playOnce = false,
  triggerRef,
  delay = 0
}) => {
  const containerRef = useRef(null)

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : ''
    return text.split('').map((char, index) => (
      <span className="inline-block word" key={index}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }, [children])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const usePlayOnceWithTrigger = playOnce && triggerRef?.current
    const usePlayOnceOnMount = playOnce && !triggerRef

    const scroller = scrollContainerRef?.current ?? window
    const charElements = el.querySelectorAll('.inline-block')

    const fromVars = {
      willChange: 'opacity, transform',
      opacity: 0,
      yPercent: 120,
      scaleY: 2.3,
      scaleX: 0.7,
      transformOrigin: '50% 0%'
    }
    const toVars = {
      duration: animationDuration,
      ease: ease,
      opacity: 1,
      yPercent: 0,
      scaleY: 1,
      scaleX: 1,
      stagger: stagger,
      delay: delay
    }

    if (usePlayOnceWithTrigger) {
      toVars.scrollTrigger = {
        trigger: triggerRef.current,
        scroller,
        start: 'top 85%',
        end: 'top 85%',
        toggleActions: 'play none none none'
      }
    } else if (!usePlayOnceOnMount) {
      toVars.scrollTrigger = {
        trigger: el,
        scroller,
        start: scrollStart,
        end: scrollEnd,
        scrub: true
      }
    }

    gsap.fromTo(charElements, fromVars, toVars)
  }, [scrollContainerRef, animationDuration, ease, scrollStart, scrollEnd, stagger, playOnce, triggerRef, delay])

  return (
    <h2 ref={containerRef} className={`my-5 overflow-hidden ${containerClassName}`}>
      <span className={`inline-block text-[clamp(1.6rem,4vw,3rem)] leading-[1.5] ${textClassName}`}>{splitText}</span>
    </h2>
  )
}

export default ScrollFloat
