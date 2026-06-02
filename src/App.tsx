import { useState } from 'react'
import { useSheetData } from './hooks/useSheetData'
import { Digest } from './components/Digest/Digest'
import { Calendar } from './components/Calendar/Calendar'
import styles from './App.module.css'

export default function App() {
  const { data, loading, error } = useSheetData()
  const [weekAnchor, setWeekAnchor] = useState(() => new Date())

  if (loading) {
    return (
      <div className={styles.centerState}>
        <div className={styles.spinner} />
        <p className={styles.stateText}>Загрузка данных...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.centerState}>
        <p className={styles.errorText}>
          Не удалось загрузить данные. Проверь URL таблицы.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      <div className={styles.digestPanel}>
        <Digest
          courses={data.courses}
          marketing={[]}
          promos={data.promos}
          weekAnchor={weekAnchor}
          onWeekChange={setWeekAnchor}
        />
      </div>
      <div className={styles.divider} />
      <div className={styles.calendarPanel}>
        <Calendar
          courses={data.courses}
          marketing={[]}
          promos={data.promos}
          selectedWeekAnchor={weekAnchor}
        />
      </div>
    </div>
  )
}
