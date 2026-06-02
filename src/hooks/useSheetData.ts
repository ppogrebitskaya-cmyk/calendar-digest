import { useState, useEffect } from 'react'
import type { CourseEvent, PromoEvent, FocusWeek } from '../types'
import { fetchAndParseSheet, fetchAndParsePromos, fetchAndParseFocuses } from '../utils/parseSheet'

const SHEET_ID = '13fUWpXYJEr0vcMbZA1_rKrJGPyFg6_5FKunBygD-W0k'
const ITOG_GID = 88066687
const PROMO_GID = 922625512
const FOCUS_GID = 1134202112

const COURSES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${ITOG_GID}`
const PROMOS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PROMO_GID}`
const FOCUSES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${FOCUS_GID}`

interface SheetData {
  courses: CourseEvent[]
  promos: PromoEvent[]
  focuses: FocusWeek[]
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
        const [{ courses }, promos, focuses] = await Promise.all([
          fetchAndParseSheet(COURSES_URL),
          fetchAndParsePromos(PROMOS_URL),
          fetchAndParseFocuses(FOCUSES_URL),
        ])
        if (!cancelled) {
          setData({ courses, promos, focuses })
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
