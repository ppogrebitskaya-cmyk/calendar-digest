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
  other: CourseOtherEvent[]
}

export interface PromoEvent {
  name: string
  dateFrom: Date
  dateTo: Date
  bannersUrl?: string
}

export interface FocusWeek {
  weekDate: Date
  items: string[]
}

export type EventType =
  | 'promo'
  | 'startSale'
  | 'startStudy'
  | 'lastCall'
  | 'other'

export const EVENT_COLORS: Record<EventType, string> = {
  promo: '#d8c4f0',
  startSale: '#1a73e8',
  startStudy: '#0f9d58',
  lastCall: '#a5d6a7',
  other: '#616161',
}

export const EVENT_LABELS: Record<EventType, string> = {
  promo: 'Акция',
  startSale: 'Старт продаж',
  startStudy: 'Старт обучения',
  lastCall: 'Ластколл',
  other: 'Другое',
}

export const EVENT_BADGES: Record<EventType, string> = {
  promo: 'АК',
  startSale: 'СП',
  startStudy: 'СО',
  lastCall: 'ЛК',
  other: 'Др',
}
