import { useEffect, useRef, useMemo, useState } from 'react'
import '../styles/CaseOpener.css'

const ITEM_WIDTH = 200   // px width of each task card in the strip (desktop default)
const ITEM_GAP = 8       // px gap between cards
const STRIP_COUNT = 50   // total items in the strip
const WINNER_INDEX = 40  // winner stops here (near end)
const ANIM_DURATION = 7000 // ms

function buildStrip(tasks, winnerId) {
  const result = []
  for (let i = 0; i < STRIP_COUNT; i++) {
    if (i === WINNER_INDEX) {
      result.push(tasks.find(t => t.id === winnerId) || tasks[0])
    } else {
      // fill with shuffled tasks (avoid putting winner at end positions randomly)
      result.push(tasks[i % tasks.length])
    }
  }
  return result
}

export default function CaseOpener({ tasks, winnerId, onFinished }) {
  const stripRef = useRef(null)
  const hasStarted = useRef(false)
  const [animDone, setAnimDone] = useState(false)

  const strip = useMemo(() => buildStrip(tasks, winnerId), [tasks, winnerId])

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    const el = stripRef.current
    if (!el) return

    // Container center in viewport
    const container = el.parentElement
    const containerWidth = container.offsetWidth
    const viewCenter = containerWidth / 2

    // Measure actual rendered item width from DOM (respects CSS responsive breakpoints)
    const firstItem = el.querySelector('.opener__item')
    const actualItemWidth = firstItem ? firstItem.offsetWidth : ITEM_WIDTH
    const actualItemStep = actualItemWidth + ITEM_GAP

    // Position where winner item's center should stop = viewCenter
    // Winner item left edge = WINNER_INDEX * actualItemStep
    // Winner item center = WINNER_INDEX * actualItemStep + actualItemWidth / 2
    // We need translateX = -(winnerCenter - viewCenter)
    const winnerCenter = WINNER_INDEX * actualItemStep + actualItemWidth / 2
    const finalTranslate = -(winnerCenter - viewCenter)

    el.style.transition = 'none'
    el.style.transform = `translateX(0px)`

    // Force reflow then trigger animation
    void el.offsetWidth

    el.style.transition = `transform ${ANIM_DURATION}ms cubic-bezier(0.05, 0.8, 0.15, 1)`
    el.style.transform = `translateX(${finalTranslate}px)`

    const timer = setTimeout(() => {
      setAnimDone(true)
    }, ANIM_DURATION + 100)

    const finishTimer = setTimeout(() => {
      onFinished()
    }, ANIM_DURATION + 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(finishTimer)
      hasStarted.current = false
    }
  }, [onFinished])

  return (
    <div className="opener">
      <div className="opener__header">
        <span className="opener__header-text">ОТКРЫВАЕМ КЕЙС</span>
      </div>

      {/* Viewport window */}
      <div className="opener__viewport">
        {/* Gradient masks on sides */}
        <div className="opener__fade opener__fade--left" />
        <div className="opener__fade opener__fade--right" />

        {/* Center marker */}
        <div className="opener__marker">
          <span className="opener__marker-arrow opener__marker-arrow--top" />
          <span className="opener__marker-line" />
          <span className="opener__marker-arrow opener__marker-arrow--bottom" />
        </div>

        {/* Scrolling strip */}
        <div className="opener__strip" ref={stripRef}>
          {strip.map((task, i) => (
            <div
              key={i}
              className={`opener__item ${i === WINNER_INDEX && animDone ? 'opener__item--winner' : ''}`}
            >
              <img
                src={task.image}
                alt={`Задание ${task.id}`}
                className="opener__item-img"
                draggable={false}
              />
              <div className="opener__item-overlay" />
            </div>
          ))}
        </div>
      </div>

      <p className="opener__hint">Ждите результата…</p>
    </div>
  )
}
