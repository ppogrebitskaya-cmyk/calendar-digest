export interface CourseOtherEvent {
  label: string
  dateFrom: Date
  dateTo?: Date
}

export interface MarketingEvent {
  label: string
  dateFrom: Date
  dateTo?: Date
}

export interface CourseEvent {
  name: string
  startSale?: Date
  startStudy?: Date
  lastCall?: Date
  lastCallEnd?: Date
  priceUp1?: Date
  priceUp2?: Date
  priceUp3?: Date
  other: CourseOtherEvent[]
}

export type EventType =
  | 'startSale'
  | 'startStudy'
  | 'lastCall'
  | 'priceUp1'
  | 'priceUp2'
  | 'priceUp3'
  | 'other'

export const EVENT_COLORS: Record<EventType, string> = {
  startSale: '#1a73e8',
  startStudy: '#0f9d58',
  lastCall: '#6abf69',
  priceUp1: '#d50000',
  priceUp2: '#c2185b',
  priceUp3: '#880e4f',
  other: '#616161',
}

export const EVENT_LABELS: Record<EventType, string> = {
  startSale: 'Старт продаж',
  startStudy: 'Старт обучения',
  lastCall: 'Ластколл',
  priceUp1: 'Повышение цены 1',
  priceUp2: 'Повышение цены 2',
  priceUp3: 'Повышение цены 3',
  other: 'Другое',
}

export const EVENT_BADGES: Record<EventType, string> = {
  startSale: 'СП',
  startStudy: 'СО',
  lastCall: 'ЛК',
  priceUp1: 'П1',
  priceUp2: 'П2',
  priceUp3: 'П3',
  other: 'Др',
}
