export const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const parseStoredDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number)
  // Use UTC to avoid timezone issues when creating the date object
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDateForDisplay = (dateString: string): string => {
  const date = parseStoredDate(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export const isToday = (dateString: string): boolean => {
  const today = new Date()
  const date = parseStoredDate(dateString)
  return (
    date.getUTCFullYear() === today.getFullYear() &&
    date.getUTCMonth() === today.getMonth() &&
    date.getUTCDate() === today.getDate()
  )
}

export const isFutureDate = (dateString: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to start of day
  const date = parseStoredDate(dateString)
  return date.getTime() > today.getTime()
}

export const isPastDate = (dateString: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to start of day
  const date = parseStoredDate(dateString)
  return date.getTime() < today.getTime()
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
