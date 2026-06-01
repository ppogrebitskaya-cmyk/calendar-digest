import { useState, useEffect } from 'react'
import type { CourseEvent } from '../types'
import { fetchAndParseSheet } from '../utils/parseSheet'

const SHEET_ID = '13fUWpXYJEr0vcMbZA1_rKrJGPyFg6_5FKunBygD-W0k'
const GID = 88066687
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`

interface SheetData {
  courses: CourseEvent[]
}

interface UseSheetDataResult {
  data: SheetData | null
  loading: boolean
  error: string | null
}

export function useSheetData(): UseSheetDataResult {
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchAndParseSheet(CSV_URL)
        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
