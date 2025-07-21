// import { SocialLoginForm } from "@/components/google-login-form"

// export default function LoginPage() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
//         <h1 className="text-2xl font-bold mb-2">Sign in to Hive Booking</h1>
//         <p className="text-gray-500 mb-6 text-center">Choose a sign-in method to continue</p>
//         <SocialLoginForm />
//       </div>
//     </div>
//   )
// }

import { SocialLoginForm } from "@/components/google-login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-2">Sign in to Hive Booking</h1>
        <p className="text-gray-500 mb-6 text-center">Choose a sign-in method to continue</p>
        <SocialLoginForm />
      </div>
    </div>
  )
}
