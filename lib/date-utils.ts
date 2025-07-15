// Utility functions for proper date handling without timezone issues

export function formatDateForStorage(date: Date): string {
  // Get local date components to avoid timezone conversion
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseStoredDate(dateString: string): Date {
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateForDisplay(dateString: string): string {
  const date = parseStoredDate(dateString)
  return date.toLocaleDateString()
}

export function isToday(dateString: string): boolean {
  const today = new Date()
  const todayString = formatDateForStorage(today)
  return dateString === todayString
}

export function isFutureDate(dateString: string): boolean {
  const today = new Date()
  const todayString = formatDateForStorage(today)
  return dateString > todayString
}

export function isPastDate(dateString: string): boolean {
  const today = new Date()
  const todayString = formatDateForStorage(today)
  return dateString < todayString
}

// Helper function to parse time and convert to minutes since midnight
export const timeToMinutes = (timeStr: string): number => {
  const [time, period] = timeStr.split(" ")
  const [hours, minutes] = time.split(":").map(Number)
  let totalMinutes = hours * 60 + (minutes || 0)

  if (period === "PM" && hours !== 12) {
    totalMinutes += 12 * 60
  } else if (period === "AM" && hours === 12) {
    totalMinutes = minutes || 0
  }

  return totalMinutes
}
