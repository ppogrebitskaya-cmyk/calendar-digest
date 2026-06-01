import {
  startOfWeek,
  endOfWeek,
  addDays,
  isWithinInterval,
  areIntervalsOverlapping,
  format,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { CourseEvent, MarketingEvent } from '../types'

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return { start, end }
}

function inWeek(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end })
}

function rangeOverlapsWeek(from: Date, to: Date, start: Date, end: Date): boolean {
  return areIntervalsOverlapping(
    { start: from, end: to },
    { start, end },
    { inclusive: true }
  )
}

export function formatShortDate(date: Date): string {
  return format(date, 'd MMM', { locale: ru }).replace('.', '')
}

export function formatWeekLabel(start: Date, end: Date): string {
  const s = format(start, 'd MMM', { locale: ru }).replace('.', '')
  const e = format(end, 'd MMM', { locale: ru }).replace('.', '')
  return `${s} — ${e}`
}

export interface DigestSection {
  title: string
  items: string[]
}

export interface DigestOtherItem {
  label: string
  dateFrom: Date
  dateTo?: Date
  courseName?: string
}

export function getDigestData(
  courses: CourseEvent[],
  marketing: MarketingEvent[],
  weekStart: Date,
  weekEnd: Date
): DigestSection[] {
  const sections: DigestSection[] = []

  // Старт продаж
  const startSaleItems: string[] = []
  for (const c of courses) {
    if (c.startSale && inWeek(c.startSale, weekStart, weekEnd)) {
      startSaleItems.push(`${c.name} — ${formatShortDate(c.startSale)}`)
    }
  }
  if (startSaleItems.length > 0) sections.push({ title: 'Старт продаж', items: startSaleItems })

  // Старт обучения
  const startStudyItems: string[] = []
  for (const c of courses) {
    if (c.startStudy && inWeek(c.startStudy, weekStart, weekEnd)) {
      startStudyItems.push(`${c.name} — ${formatShortDate(c.startStudy)}`)
    }
  }
  if (startStudyItems.length > 0) sections.push({ title: 'Старт обучения', items: startStudyItems })

  // Ластколл
  const lastCallItems: string[] = []
  for (const c of courses) {
    if (c.lastCall && c.lastCallEnd) {
      if (rangeOverlapsWeek(c.lastCall, c.lastCallEnd, weekStart, weekEnd)) {
        lastCallItems.push(`${c.name} — ${formatShortDate(c.lastCall)} – ${formatShortDate(c.lastCallEnd)}`)
      }
    }
  }
  if (lastCallItems.length > 0) sections.push({ title: 'Ластколл', items: lastCallItems })

  // Повышение цены 1
  const priceUp1Items: string[] = []
  for (const c of courses) {
    if (c.priceUp1 && inWeek(c.priceUp1, weekStart, weekEnd)) {
      priceUp1Items.push(`${c.name} — ${formatShortDate(c.priceUp1)}`)
    }
  }
  if (priceUp1Items.length > 0) sections.push({ title: 'Повышение цены 1', items: priceUp1Items })

  // Повышение цены 2
  const priceUp2Items: string[] = []
  for (const c of courses) {
    if (c.priceUp2 && inWeek(c.priceUp2, weekStart, weekEnd)) {
      priceUp2Items.push(`${c.name} — ${formatShortDate(c.priceUp2)}`)
    }
  }
  if (priceUp2Items.length > 0) sections.push({ title: 'Повышение цены 2', items: priceUp2Items })

  // Повышение цены 3
  const priceUp3Items: string[] = []
  for (const c of courses) {
    if (c.priceUp3 && inWeek(c.priceUp3, weekStart, weekEnd)) {
      priceUp3Items.push(`${c.name} — ${formatShortDate(c.priceUp3)}`)
    }
  }
  if (priceUp3Items.length > 0) sections.push({ title: 'Повышение цены 3', items: priceUp3Items })

  // Другое: course other events + marketing events mixed
  const otherItems: DigestOtherItem[] = []

  for (const c of courses) {
    for (const ev of c.other) {
      const overlaps = ev.dateTo
        ? rangeOverlapsWeek(ev.dateFrom, ev.dateTo, weekStart, weekEnd)
        : inWeek(ev.dateFrom, weekStart, weekEnd)
      if (overlaps) {
        otherItems.push({
          label: ev.label,
          dateFrom: ev.dateFrom,
          dateTo: ev.dateTo,
          courseName: c.name,
        })
      }
    }
  }

  for (const ev of marketing) {
    const overlaps = ev.dateTo
      ? rangeOverlapsWeek(ev.dateFrom, ev.dateTo, weekStart, weekEnd)
      : inWeek(ev.dateFrom, weekStart, weekEnd)
    if (overlaps) {
      otherItems.push({
        label: ev.label,
        dateFrom: ev.dateFrom,
        dateTo: ev.dateTo,
      })
    }
  }

  otherItems.sort((a, b) => a.dateFrom.getTime() - b.dateFrom.getTime())

  if (otherItems.length > 0) {
    const items = otherItems.map((item) => {
      const dateStr = item.dateTo
        ? `${formatShortDate(item.dateFrom)} – ${formatShortDate(item.dateTo)}`
        : formatShortDate(item.dateFrom)
      if (item.courseName) {
        return `${item.courseName} — ${item.label} — ${dateStr}`
      }
      return `${item.label} — ${dateStr}`
    })
    sections.push({ title: 'Другое', items })
  }

  return sections
}

export function buildPlaintext(
  sections: DigestSection[],
  weekStart: Date,
  weekEnd: Date
): string {
  const header = `Дайджест ${formatWeekLabel(weekStart, weekEnd)}`
  if (sections.length === 0) {
    return `${header}\n\nНа этой неделе событий нет\n`
  }
  let text = `${header}\n`
  for (const section of sections) {
    text += `\n${section.title}\n`
    for (const item of section.items) {
      text += `• ${item}\n`
    }
  }
  return text
}

export { addDays }
