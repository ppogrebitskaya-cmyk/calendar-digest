import { useState, useCallback } from 'react'
import { addDays, areIntervalsOverlapping } from 'date-fns'
import type { CourseEvent, MarketingEvent, PromoEvent } from '../../types'
import type { DigestSection } from '../../utils/digestUtils'
import {
  getWeekBounds,
  getDigestData,
  buildPlaintext,
  formatWeekLabel,
  formatShortDate,
} from '../../utils/digestUtils'
import styles from './Digest.module.css'

interface DigestProps {
  courses: CourseEvent[]
  marketing: MarketingEvent[]
  promos: PromoEvent[]
  weekAnchor: Date
  onWeekChange: (date: Date) => void
}

export function Digest({ courses, marketing, promos, weekAnchor, onWeekChange }: DigestProps) {
  const [copied, setCopied] = useState(false)

  const { start: weekStart, end: weekEnd } = getWeekBounds(weekAnchor)

  const sections: DigestSection[] = getDigestData(courses, marketing, weekStart, weekEnd)

  const activePromos = promos.filter(p =>
    areIntervalsOverlapping(
      { start: p.dateFrom, end: p.dateTo },
      { start: weekStart, end: weekEnd },
      { inclusive: true }
    )
  )

  const handlePrev = () => onWeekChange(addDays(weekAnchor, -7))
  const handleNext = () => onWeekChange(addDays(weekAnchor, 7))

  const handleCopy = useCallback(async () => {
    const promoText = activePromos.length > 0
      ? '\nАкции\n' + activePromos.map(p =>
          `• ${p.name}: ${formatShortDate(p.dateFrom)} – ${formatShortDate(p.dateTo)}${p.bannersUrl ? ` (баннеры: ${p.bannersUrl})` : ''}`
        ).join('\n') + '\n'
      : ''
    const text = promoText + buildPlaintext(sections, weekStart, weekEnd)
    try {
      await navigator.clipboard.writeText(text)
      localStorage.setItem('mif_digest_text', text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }, [sections, activePromos, weekStart, weekEnd])

  const weekLabel = formatWeekLabel(weekStart, weekEnd)

  return (
    <div className={styles.digest}>
      <h2 className={styles.title}>Дайджест</h2>

      <div className={styles.weekNav}>
        <button className={styles.navBtn} onClick={handlePrev} aria-label="Предыдущая неделя">
          ‹
        </button>
        <span className={styles.weekLabel}>{weekLabel}</span>
        <button className={styles.navBtn} onClick={handleNext} aria-label="Следующая неделя">
          ›
        </button>
      </div>

      <button
        className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
        onClick={handleCopy}
      >
        {copied ? 'Скопировано ✓' : 'Скопировать дайджест'}
      </button>

      <div className={styles.sections}>
        {activePromos.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Акции</div>
            {activePromos.map((p, i) => (
              <div key={i} className={styles.item}>
                • {p.name}: {formatShortDate(p.dateFrom)} – {formatShortDate(p.dateTo)}
                {p.bannersUrl && (
                  <> (<a href={p.bannersUrl} target="_blank" rel="noopener noreferrer" className={styles.promoLink}>баннеры</a>)</>
                )}
              </div>
            ))}
          </div>
        )}

        {sections.length === 0 && activePromos.length === 0 ? (
          <p className={styles.empty}>На этой неделе событий нет</p>
        ) : (
          sections.map((section) => (
            <div key={section.title} className={styles.section}>
              <div className={styles.sectionTitle}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} className={styles.item}>
                  • {item}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
