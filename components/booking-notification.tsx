"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"

interface BookingNotificationProps {
  show: boolean
  onClose: () => void
  booking?: {
    resource: string
    date: string
    time: string
  }
}

export function BookingNotification({ show, onClose, booking }: BookingNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className="w-80 bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900">Booking Confirmed!</h4>
              {booking && (
                <div className="text-sm text-green-800 mt-1">
                  <p>
                    <strong>{booking.resource}</strong>
                  </p>
                  <p>
                    {booking.date} at {booking.time}
                  </p>
                </div>
              )}
              <p className="text-xs text-green-700 mt-2">Check your dashboard to view all bookings.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
