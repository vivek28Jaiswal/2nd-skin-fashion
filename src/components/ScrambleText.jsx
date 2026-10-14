import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

const SYMBOLS = '!<>-_\\/[]{}=+*^?#'
const DIGITS = '0123456789'
const LETTERS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LETTERS_LOWER = 'abcdefghijklmnopqrstuvwxyz'

const UPPER_POOL = (SYMBOLS + DIGITS + LETTERS_UPPER).split('')
const LOWER_POOL = (SYMBOLS + LETTERS_LOWER).split('')
const ALL_POOL = (SYMBOLS + DIGITS + LETTERS_UPPER + LETTERS_LOWER).split('')

function getRandomChar(originalChar) {
  if (originalChar === ' ') return ' '
  if (originalChar >= 'a' && originalChar <= 'z') {
    return LOWER_POOL[Math.floor(Math.random() * LOWER_POOL.length)]
  }
  if (originalChar >= 'A' && originalChar <= 'Z') {
    return UPPER_POOL[Math.floor(Math.random() * UPPER_POOL.length)]
  }
  return ALL_POOL[Math.floor(Math.random() * ALL_POOL.length)]
}

export default function ScrambleText({
  text = '',
  trigger = true,
  triggerOnMount = true,
  hover = true,
  duration = 0.75,
  delay = 0.12,
  speed = 28, // glyph switches per second
  className = '',
  as: Component = 'span',
}) {
  const elRef = useRef(null)
  const tweenRef = useRef(null)

  const playScramble = useCallback(() => {
    if (!text || !elRef.current) return

    if (tweenRef.current) {
      tweenRef.current.kill()
    }

    const n = text.length
    if (n === 0) return

    const chars = text.split('')
    const startFrac = 0.5
    const resolveFrac = 0.45

    const charTimeline = chars.map((ch, i) => {
      const start = (n > 1 ? i / (n - 1) : 0) * startFrac
      const end = Math.min(1, start + resolveFrac)
      return { ch, start, end, currentGlyph: getRandomChar(ch) }
    })

    const progressObj = { value: 0 }
    let lastGlyphUpdate = 0
    const updateIntervalMs = 1000 / speed

    tweenRef.current = gsap.to(progressObj, {
      value: 1,
      duration,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        if (!elRef.current) return
        const now = performance.now()
        const p = progressObj.value
        const shouldUpdateGlyph = now - lastGlyphUpdate >= updateIntervalMs

        if (shouldUpdateGlyph) {
          lastGlyphUpdate = now
        }

        let result = ''
        for (let i = 0; i < n; i++) {
          const item = charTimeline[i]
          if (item.ch === ' ') {
            result += ' '
          } else if (p >= item.end) {
            result += item.ch
          } else {
            if (shouldUpdateGlyph) {
              item.currentGlyph = getRandomChar(item.ch)
            }
            result += item.currentGlyph
          }
        }
        elRef.current.textContent = result
      },
      onComplete: () => {
        if (elRef.current) {
          elRef.current.textContent = text
        }
        tweenRef.current = null
      },
    })
  }, [text, duration, delay, speed])

  useEffect(() => {
    if (!elRef.current) return

    if (trigger && triggerOnMount) {
      playScramble()
    } else {
      if (tweenRef.current) tweenRef.current.kill()
      elRef.current.textContent = text
    }

    return () => {
      if (tweenRef.current) tweenRef.current.kill()
    }
  }, [trigger, triggerOnMount, text, playScramble])

  const handleMouseEnter = () => {
    if (hover) {
      playScramble()
    }
  }

  return (
    <Component
      ref={elRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      aria-label={text}
    >
      {text}
    </Component>
  )
}
