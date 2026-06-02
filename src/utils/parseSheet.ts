import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { CourseEvent, CourseOtherEvent, PromoEvent, FocusWeek } from '../types'

function parseDate(value: string): Date | undefined {
  if (!value || !value.trim()) return undefined
  try {
    const d = parse(value.trim(), 'dd.MM.yyyy', new Date())
    return isValid(d) ? d : undefined
  } catch {
    return undefined
  }
}

function hasAnyDate(row: string[]): boolean {
  for (let i = 2; i <= 20; i++) {
    if (parseDate(row[i] ?? '')) return true
  }
  return false
}

function parseOtherEvents(row: string[], startCol: number, endCol: number): CourseOtherEvent[] {
  const events: CourseOtherEvent[] = []
  let i = startCol
  while (i <= endCol) {
    const cell = (row[i] ?? '').trim()
    if (!cell || parseDate(cell)) { i++; continue }
    const dateFrom = parseDate((row[i + 1] ?? '').trim())
    if (!dateFrom) { i++; continue }
    const nextCell = (row[i + 2] ?? '').trim()
    const dateTo = nextCell ? parseDate(nextCell) : undefined
    events.push({ label: cell, dateFrom, dateTo })
    i += dateTo !== undefined ? 3 : 2
  }
  return events
}

export async function fetchAndParseSheet(url: string): Promise<{
  courses: CourseEvent[]
}> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()

  const result = Papa.parse<string[]>(text, { skipEmptyLines: false })
  const rows = result.data

  const courses: CourseEvent[] = []

  // Rows 0-2: meta info, section headers, column headers — skip
  for (let i = 3; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const col = (idx: number) => (row[idx] ?? '').trim()

    const courseName = col(1) // B: Название курса
    if (!courseName) continue
    if (!hasAnyDate(row)) continue

    const startSale  = parseDate(col(2)) // C
    const startStudy = parseDate(col(3)) // D
    const lastCall   = parseDate(col(4)) // E: Ластколл: старт
    const lastCallEnd = parseDate(col(5)) // F: Ластколл: завершение
    const priceUp1   = parseDate(col(6)) // G
    const priceUp2   = parseDate(col(7)) // H
    const priceUp3   = parseDate(col(8)) // I
    const other      = parseOtherEvents(row, 9, 20) // J+

    if (!startSale && !startStudy && !lastCall && !priceUp1 && !priceUp2 && !priceUp3 && other.length === 0) {
      continue
    }

    courses.push({ name: courseName, startSale, startStudy, lastCall, lastCallEnd, priceUp1, priceUp2, priceUp3, other })
  }

  return { courses }
}

export async function fetchAndParsePromos(url: string): Promise<PromoEvent[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()

  const result = Papa.parse<string[]>(text, { skipEmptyLines: false })
  const rows = result.data
  const promos: PromoEvent[] = []

  // Row 0 is header, data from row 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const col = (idx: number) => (row[idx] ?? '').trim()

    const dateFrom = parseDate(col(0))
    const dateTo = parseDate(col(1))
    const name = col(2)
    if (!dateFrom || !dateTo || !name) continue

    const bannersUrl = col(3) || undefined
    promos.push({ name, dateFrom, dateTo, bannersUrl })
  }

  return promos
}

// Parses "DD.MM-DD.MM" range format (e.g. "01.06-07.06"), returns the start date using current year
function parseFocusWeekDate(value: string): Date | undefined {
  if (!value || !value.trim()) return undefined
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})/)
  if (!match) return undefined
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const year = new Date().getFullYear()
  const d = new Date(year, month, day)
  return isNaN(d.getTime()) ? undefined : d
}

export async function fetchAndParseFocuses(url: string): Promise<FocusWeek[]> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()

  const result = Papa.parse<string[]>(text, { skipEmptyLines: false })
  const rows = result.data
  const focuses: FocusWeek[] = []

  // Row 0 is header, data from row 1
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    const col = (idx: number) => (row[idx] ?? '').trim()

    const weekDate = parseFocusWeekDate(col(1)) // B: "DD.MM-DD.MM" range
    if (!weekDate) continue

    const items: string[] = []
    for (let c = 2; c < row.length; c++) {
      const val = col(c)
      if (val) items.push(val)
    }

    if (items.length > 0) {
      focuses.push({ weekDate, items })
    }
  }

  return focuses
}
