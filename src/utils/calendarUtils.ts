import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  areIntervalsOverlapping,
  format,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import type { CourseEvent, MarketingEvent, EventType } from '../types'
import { EVENT_COLORS } from '../types'

export interface CalendarPill {
  id: string
  type: EventType
  color: string
  label: string
  dateFrom: Date
  dateTo: Date
  isStart: boolean
  isEnd: boolean
  colStart: number
  colSpan: number
  row: number
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  pills: CalendarPill[]
  overflowCount: number
}

export interface CalendarWeek {
  days: CalendarDay[]
  pills: CalendarPill[]
}

const MAX_VISIBLE_PILLS = 3

function pillKey(type: EventType, courseName: string, dateFrom: Date): string {
  return `${type}-${courseName}-${dateFrom.getTime()}`
}

function getDayOfWeek(date: Date): number {
  // Monday = 0, Sunday = 6
  const d = date.getDay()
  return d === 0 ? 6 : d - 1
}

interface RawEvent {
  id: string
  type: EventType
  color: string
  label: string
  dateFrom: Date
  dateTo: Date
}

export function buildCalendarGrid(
  year: number,
  month: number,
  courses: CourseEvent[],
  marketing: MarketingEvent[]
): CalendarWeek[] {
  const monthStart = startOfMonth(new Date(year, month, 1))
  const monthEnd = endOfMonth(monthStart)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Collect all events as raw events with date ranges
  const rawEvents: RawEvent[] = []

  // Pass 1: lastCall events first so they always occupy the top row
  for (const course of courses) {
    if (course.lastCall && course.lastCallEnd) {
      rawEvents.push({
        id: pillKey('lastCall', course.name, course.lastCall),
        type: 'lastCall',
        color: EVENT_COLORS.lastCall,
        label: course.name,
        dateFrom: course.lastCall,
        dateTo: course.lastCallEnd,
      })
    }
  }

  // Pass 2: all other events
  for (const course of courses) {
    if (course.startSale) {
      rawEvents.push({
        id: pillKey('startSale', course.name, course.startSale),
        type: 'startSale',
        color: EVENT_COLORS.startSale,
        label: course.name,
        dateFrom: course.startSale,
        dateTo: course.startSale,
      })
    }
    if (course.startStudy) {
      rawEvents.push({
        id: pillKey('startStudy', course.name, course.startStudy),
        type: 'startStudy',
        color: EVENT_COLORS.startStudy,
        label: course.name,
        dateFrom: course.startStudy,
        dateTo: course.startStudy,
      })
    }
    if (course.priceUp1) {
      rawEvents.push({
        id: pillKey('priceUp1', course.name, course.priceUp1),
        type: 'priceUp1',
        color: EVENT_COLORS.priceUp1,
        label: course.name,
        dateFrom: course.priceUp1,
        dateTo: course.priceUp1,
      })
    }
    if (course.priceUp2) {
      rawEvents.push({
        id: pillKey('priceUp2', course.name, course.priceUp2),
        type: 'priceUp2',
        color: EVENT_COLORS.priceUp2,
        label: course.name,
        dateFrom: course.priceUp2,
        dateTo: course.priceUp2,
      })
    }
    if (course.priceUp3) {
      rawEvents.push({
        id: pillKey('priceUp3', course.name, course.priceUp3),
        type: 'priceUp3',
        color: EVENT_COLORS.priceUp3,
        label: course.name,
        dateFrom: course.priceUp3,
        dateTo: course.priceUp3,
      })
    }
    for (const ev of course.other) {
      rawEvents.push({
        id: pillKey('other', `${course.name}-${ev.label}`, ev.dateFrom),
        type: 'other',
        color: EVENT_COLORS.other,
        label: `${course.name}: ${ev.label}`,
        dateFrom: ev.dateFrom,
        dateTo: ev.dateTo ?? ev.dateFrom,
      })
    }
  }

  for (const ev of marketing) {
    rawEvents.push({
      id: pillKey('other', ev.label, ev.dateFrom),
      type: 'other',
      color: EVENT_COLORS.other,
      label: ev.label,
      dateFrom: ev.dateFrom,
      dateTo: ev.dateTo ?? ev.dateFrom,
    })
  }

  // Build weeks array
  const weeks: CalendarWeek[] = []
  let current = gridStart
  while (current <= gridEnd) {
    const days: CalendarDay[] = []
    for (let d = 0; d < 7; d++) {
      days.push({
        date: addDays(current, d),
        isCurrentMonth: isSameMonth(addDays(current, d), monthStart),
        pills: [],
        overflowCount: 0,
      })
    }
    weeks.push({ days, pills: [] })
    current = addDays(current, 7)
  }

  // Assign pills to weeks (multi-day pills split at week boundaries)
  // Use a row-assignment strategy per week
  for (const ev of rawEvents) {
    // Find which weeks this event spans
    for (const week of weeks) {
      const weekStart = week.days[0].date
      const weekEnd = week.days[6].date

      if (!areIntervalsOverlapping(
        { start: ev.dateFrom, end: ev.dateTo },
        { start: weekStart, end: weekEnd },
        { inclusive: true }
      )) continue

      // Clamp to week bounds
      const segStart = ev.dateFrom < weekStart ? weekStart : ev.dateFrom
      const segEnd = ev.dateTo > weekEnd ? weekEnd : ev.dateTo

      const colStart = getDayOfWeek(segStart)
      const colEnd = getDayOfWeek(segEnd)
      const colSpan = colEnd - colStart + 1

      const isStart = isSameDay(segStart, ev.dateFrom)
      const isEnd = isSameDay(segEnd, ev.dateTo)

      const pill: CalendarPill = {
        id: `${ev.id}-${weekStart.getTime()}`,
        type: ev.type,
        color: ev.color,
        label: ev.label,
        dateFrom: ev.dateFrom,
        dateTo: ev.dateTo,
        isStart,
        isEnd,
        colStart,
        colSpan,
        row: 0,
      }

      // Assign row: find lowest row not conflicting with existing pills in this week
      const existingPills = week.days
        .slice(colStart, colStart + colSpan)
        .flatMap((d) => d.pills)

      const usedRows = new Set(existingPills.map((p) => p.row))
      let row = 0
      while (usedRows.has(row)) row++
      pill.row = row

      // Add pill to all days in the span
      for (let c = colStart; c <= colEnd; c++) {
        week.days[c].pills.push(pill)
      }
    }
  }

  // Collect unique pills per week for spanning render
  for (const week of weeks) {
    const seen = new Set<string>()
    for (const day of week.days) {
      for (const pill of day.pills) {
        if (!seen.has(pill.id)) {
          seen.add(pill.id)
          week.pills.push(pill)
        }
      }
    }
  }

  // Sort pills by row in each day, compute overflow
  for (const week of weeks) {
    for (const day of week.days) {
      // Deduplicate pills (same id can appear in multiple days)
      const seen = new Set<string>()
      const unique: CalendarPill[] = []
      for (const p of day.pills) {
        if (!seen.has(p.id)) {
          seen.add(p.id)
          unique.push(p)
        }
      }
      unique.sort((a, b) => a.row - b.row)
      day.pills = unique

      if (unique.length > MAX_VISIBLE_PILLS) {
        day.overflowCount = unique.length - MAX_VISIBLE_PILLS
        day.pills = unique.slice(0, MAX_VISIBLE_PILLS)
      }
    }
  }

  return weeks
}

export function assignRows(pills: CalendarPill[]): CalendarPill[] {
  const result: CalendarPill[] = []
  for (const pill of pills) {
    const conflicts = result.filter(
      p => p.colStart < pill.colStart + pill.colSpan && pill.colStart < p.colStart + p.colSpan
    )
    const usedRows = new Set(conflicts.map(p => p.row))
    let row = 0
    while (usedRows.has(row)) row++
    result.push({ ...pill, row })
  }
  return result
}

export function getMonthLabel(year: number, month: number): string {
  return format(new Date(year, month, 1), 'LLLL yyyy', { locale: ru })
}

export { isSameMonth, isSameDay, isWithinInterval, format, addDays }
