import { format, parseISO } from "date-fns"

export function formatTimeForDisplay(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "p") // Formats to time, e.g., "9:00 AM"
  } catch (error) {
    console.error("Error formatting time:", error)
    return "Invalid Time"
  }
}

export function formatDateForDisplay(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "PPP") // Formats to date, e.g., "Jul 20th, 2024"
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

export function getDayOfWeek(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "EEEE") // Formats to day of week, e.g., "Saturday"
  } catch (error) {
    console.error("Error getting day of week:", error)
    return "Invalid Day"
  }
}

export function getMonthAndDay(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "MMM d") // Formats to month and day, e.g., "Jul 20"
  } catch (error) {
    console.error("Error getting month and day:", error)
    return "Invalid Date"
  }
}

export function getDayOfMonth(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "d") // Formats to day of month, e.g., "20"
  } catch (error) {
    console.error("Error getting day of month:", error)
    return "Invalid Day"
  }
}

export function getYear(isoString: string): string {
  if (!isoString) return ""
  try {
    const date = parseISO(isoString)
    return format(date, "yyyy") // Formats to year, e.g., "2024"
  } catch (error) {
    console.error("Error getting year:", error)
    return "Invalid Year"
  }
}

export function isSameDay(date1: string, date2: string): boolean {
  try {
    const d1 = parseISO(date1)
    const d2 = parseISO(date2)
    return format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd")
  } catch (error) {
    console.error("Error comparing dates:", error)
    return false
  }
}

export function getStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function getEndOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(date.getDate() + days)
  return result
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(date.getDate() - days)
  return result
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const date = new Date(year, month, 1)
  const days = []
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export function getWeekDays(date: Date): Date[] {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay()) // Adjust to Sunday
  const days = []
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startOfWeek, i))
  }
  return days
}

export function getMonthName(date: Date): string {
  return format(date, "MMMM")
}

export function getYearFromDate(date: Date): number {
  return date.getFullYear()
}

export function getDayName(date: Date): string {
  return format(date, "EEEE")
}

export function getShortDayName(date: Date): string {
  return format(date, "EEE")
}

export function getShortMonthName(date: Date): string {
  return format(date, "MMM")
}

export function getDayNumber(date: Date): number {
  return date.getDate()
}

export function getHour(date: Date): number {
  return date.getHours()
}

export function getMinute(date: Date): number {
  return date.getMinutes()
}

export function getSecond(date: Date): number {
  return date.getSeconds()
}

export function getMilliseconds(date: Date): number {
  return date.getMilliseconds()
}

export function getTimestamp(date: Date): number {
  return date.getTime()
}

export function createDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
): Date {
  return new Date(year, month, day, hours, minutes, seconds, milliseconds)
}

export function toISOString(date: Date): string {
  return date.toISOString()
}

export function fromISOString(isoString: string): Date {
  return parseISO(isoString)
}
