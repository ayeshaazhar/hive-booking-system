/**
 * True iff half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 * Bookings use inclusive wall-clock ranges; we treat overlap as:
 * aStart < bEnd && aEnd > bStart (consistent with existing UI logic).
 */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime()
}

export function isBlockingBookingStatus(status: string): boolean {
  return status === "confirmed" || status === "pending"
}
