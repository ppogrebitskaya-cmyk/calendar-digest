import { useState, useRef, useEffect } from 'react'
import type { CourseEvent, MarketingEvent, PromoEvent, EventType } from '../../types'
import { EVENT_LABELS, EVENT_COLORS, EVENT_BADGES } from '../../types'
import type { CalendarPill, CalendarDay } from '../../utils/calendarUtils'
import { buildCalendarGrid, getMonthLabel, isSameDay, assignRows } from '../../utils/calendarUtils'
import { startOfWeek } from 'date-fns'
import styles from './Calendar.module.css'

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface CalendarProps {
  courses: CourseEvent[]
  marketing: MarketingEvent[]
  promos: PromoEvent[]
  selectedWeekAnchor: Date
}

interface TooltipState {
  day: CalendarDay
  x: number
  y: number
}

export function Calendar({ courses, marketing, promos, selectedWeekAnchor }: CalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [hiddenTypes, setHiddenTypes] = useState<Set<EventType>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const weeks = buildCalendarGrid(year, month, courses, marketing, promos)
  const monthLabel = getMonthLabel(year, month)
  const selectedWeekStart = startOfWeek(selectedWeekAnchor, { weekStartsOn: 1 }).getTime()

  const toggleType = (type: EventType) => {
    setHiddenTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  const handlePrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const handleNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const showTooltip = (e: React.MouseEvent, day: CalendarDay) => {
    if (!day.isCurrentMonth) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setTooltip({
      day,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height,
    })
  }

  const hideTooltip = () => setTooltip(null)

  useEffect(() => {
    const handler = () => setTooltip(null)
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [])

  return (
    <div className={styles.calendar} ref={containerRef}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="Предыдущий месяц">‹</button>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <button className={styles.navBtn} onClick={handleNext} aria-label="Следующий месяц">›</button>
      </div>

      <div className={styles.calendarBody}>
        <div className={styles.weekDayHeaders}>
          {WEEK_DAYS.map((d) => (
            <div key={d} className={styles.weekDayHeader}>{d}</div>
          ))}
        </div>

        {weeks.map((week, wi) => {
          const isSelectedWeek = week.days[0].date.getTime() === selectedWeekStart
          return (
          <div key={wi} className={`${styles.weekRow} ${isSelectedWeek ? styles.weekRowSelected : ''}`}>
            <div className={styles.dayNumberRow}>
              {week.days.map((day, di) => (
                <div
                  key={di}
                  className={`${styles.dayCell} ${!day.isCurrentMonth ? styles.dayCellOtherMonth : ''}`}
                  onMouseEnter={(e) => { if (day.pills.length > 0 || day.overflowCount > 0) showTooltip(e, day) }}
                  onMouseLeave={hideTooltip}
                >
                  <span className={`${styles.dayNumber} ${isSameDay(day.date, today) ? styles.dayNumberToday : ''}`}>
                    {day.date.getDate()}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.pillsGrid}>
              {assignRows(week.pills.filter(p => !hiddenTypes.has(p.type))).map((pill) => (
                <SpanningPill key={pill.id} pill={pill} />
              ))}
            </div>
          </div>
          )
        })}
      </div>

      <Legend
        hiddenTypes={hiddenTypes}
        onToggle={toggleType}
        onHideAll={() => setHiddenTypes(new Set(Object.keys(EVENT_LABELS) as EventType[]))}
        onShowAll={() => setHiddenTypes(new Set())}
      />

      {tooltip && (
        <Tooltip
          day={tooltip.day}
          x={tooltip.x}
          y={tooltip.y}
          onClose={hideTooltip}
        />
      )}
    </div>
  )
}

function SpanningPill({ pill }: { pill: CalendarPill }) {
  const showLabel = pill.isStart || pill.colStart === 0

  const borderRadius = pill.isStart && pill.isEnd
    ? '4px'
    : pill.isStart
    ? '4px 0 0 4px'
    : pill.isEnd
    ? '0 4px 4px 0'
    : '0'

  return (
    <div
      className={styles.pill}
      style={{
        gridColumn: `${pill.colStart + 1} / span ${pill.colSpan}`,
        gridRow: pill.row + 1,
        background: pill.color,
        borderRadius,
        marginLeft: pill.isStart ? 2 : 0,
        marginRight: pill.isEnd ? 2 : 0,
      }}
      title={pill.label}
    >
      {showLabel && <span className={styles.pillText}>{pill.label}</span>}
      <span className={styles.pillBadge} title={EVENT_LABELS[pill.type]}>{EVENT_BADGES[pill.type]}</span>
    </div>
  )
}

interface LegendProps {
  hiddenTypes: Set<EventType>
  onToggle: (type: EventType) => void
  onHideAll: () => void
  onShowAll: () => void
}

function Legend({ hiddenTypes, onToggle, onHideAll, onShowAll }: LegendProps) {
  const types = Object.entries(EVENT_LABELS) as [EventType, string][]
  return (
    <div className={styles.legendWrapper}>
      <div className={styles.legend}>
        {types.map(([type, label]) => {
          const hidden = hiddenTypes.has(type)
          return (
            <div
              key={type}
              className={`${styles.legendItem} ${hidden ? styles.legendItemHidden : ''}`}
              onClick={() => onToggle(type)}
              title={hidden ? `Показать: ${label}` : `Скрыть: ${label}`}
            >
              <span
                className={styles.legendDot}
                style={{ background: hidden ? '#ccc' : EVENT_COLORS[type] }}
              />
              <span className={styles.legendLabel}>{label}</span>
            </div>
          )
        })}
      </div>
      <div className={styles.legendActions}>
        <button className={styles.legendBtn} onClick={onHideAll}>Скрыть все</button>
        <button className={styles.legendBtn} onClick={onShowAll}>Показать все</button>
        <span className={styles.legendHint}>Нажмите на тип, чтобы скрыть или показать</span>
      </div>
    </div>
  )
}

interface TooltipProps {
  day: CalendarDay
  x: number
  y: number
  onClose: () => void
}

function Tooltip({ day, x, y }: TooltipProps) {
  return (
    <div
      className={styles.tooltip}
      style={{ left: x, top: y + 4 }}
    >
      {day.pills.map((pill) => (
        <div key={pill.id} className={styles.tooltipItem}>
          <span className={styles.tooltipDot} style={{ background: pill.color }} />
          <span className={styles.tooltipText}>{pill.label}</span>
        </div>
      ))}
    </div>
  )
}
