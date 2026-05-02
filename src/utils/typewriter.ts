import { useEffect, useRef, useState } from 'react'

export interface TypewriterOptions {
  delay?: number;
  jitter?: number;
  startDelay?: number;
  active?: boolean;
}

export interface CountUpOptions {
  duration?: number;
  active?: boolean;
  delay?: number;
}

/**
 * Types `text` character by character.
 * Returns { displayed, done }.
 * Re-runs whenever `text` or `active` changes.
 */
export function useTypewriter(text: string, {
  delay      = 26,
  jitter     = 24,
  startDelay = 0,
  active     = true,
}: TypewriterOptions = {}) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)
  const cancelled = useRef(false)

  useEffect(() => {
    if (!active) return
    cancelled.current = false
    setDisplayed('')
    setDone(false)

    let index = 0
    const timers: number[] = []

    function scheduleNext() {
      const t = setTimeout(() => {
        if (cancelled.current) return
        if (index < text.length) {
          const ch = text[index++]
          setDisplayed(prev => prev + ch)
          scheduleNext()
        } else {
          setDone(true)
        }
      }, delay + Math.random() * jitter)
      timers.push(t)
    }

    const start = setTimeout(scheduleNext, startDelay)
    timers.push(start)

    return () => {
      cancelled.current = true
      timers.forEach(clearTimeout)
    }
  }, [text, active]) // eslint-disable-line react-hooks/exhaustive-deps

  return { displayed, done }
}

/**
 * Counts up from 0 to `target` over `duration` ms with ease-out.
 * Starts when `active` becomes true.
 */
export function useCountUp(target: number, { duration = 1200, active = false, delay = 0 }: CountUpOptions = {}): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active || target === 0) {
      setValue(0)
      return
    }
    let start: number | null = null
    function frame(ts: number) {
      if (start === null) start = ts + delay
      if (ts < start) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }
      const elapsed  = ts - start
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(frame)
      }
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, active, duration, delay])

  return value
}
