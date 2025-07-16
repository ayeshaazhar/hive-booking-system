// "use client"

// import { useBooking } from "@/contexts/booking-context"
// import { useAuth } from "@/contexts/auth-context"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"

// export function BookingDebug() {
//   const { bookings, isLoaded } = useBooking()
//   const { user } = useAuth()

//   const clearAllBookings = () => {
//     if (confirm("Are you sure you want to clear all bookings? This cannot be undone.")) {
//       localStorage.removeItem("hive-bookings")
//       window.location.reload()
//     }
//   }

//   if (!user || !isLoaded) return null

//   return (
//     <Card className="mt-8">
//       <CardHeader>
//         <CardTitle>Debug Information</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="space-y-4">
//           <div>
//             <h4 className="font-medium">User ID: {user.id}</h4>
//             <h4 className="font-medium">Total Bookings in System: {bookings.length}</h4>
// <h4 className="font-medium">Your Bookings: {bookings.filter((b) => b.memberId === user.id).length}</h4>
//           </div>

//           <div>
//             <h4 className="font-medium mb-2">All Bookings:</h4>
//             <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
//               {JSON.stringify(bookings, null, 2)}
//             </pre>
//           </div>

//           <Button onClick={clearAllBookings} variant="destructive" size="sm">
//             Clear All Bookings (Debug)
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }


"use client"
import { useBooking } from "@/contexts/booking-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export function BookingDebug() {
  const { bookings, isLoaded } = useBooking()
  const { user } = useAuth()
  const clearAllBookings = () => {
    if (confirm("Are you sure you want to clear all bookings? This cannot be undone.")) {
      localStorage.removeItem("hive-bookings")
      window.location.reload()
    }
  }
  if (!user || !isLoaded) return null
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Debug Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">User ID: {user.id}</h4>
            <h4 className="font-medium">Total Bookings in System: {bookings.length}</h4>
            <h4 className="font-medium">Your Bookings: {bookings.filter((b) => b.memberId === user.id).length}</h4>
          </div>
          <div>
            <h4 className="font-medium mb-2">All Bookings:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(bookings, null, 2)}
            </pre>
          </div>
          <Button onClick={clearAllBookings} variant="destructive" size="sm">
            Clear All Bookings (Debug)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
