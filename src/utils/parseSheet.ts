import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { CourseEvent, CourseOtherEvent } from '../types'

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
