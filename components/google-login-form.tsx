"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, AlertCircle, RefreshCw } from "lucide-react"
import { useSearchParams } from "next/navigation"

export function GoogleLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "OAuthSignin":
        return "Error occurred during Google sign-in. Please try again."
      case "OAuthCallback":
        return "Error occurred during Google callback. Please try again."
      case "OAuthCreateAccount":
        return "Could not create account. Please try again."
      case "EmailCreateAccount":
        return "Could not create account with this email."
      case "Callback":
        return "Error occurred during callback. Please try again."
      case "OAuthAccountNotLinked":
        return "This email is already associated with another account."
      case "EmailSignin":
        return "Check your email for the sign-in link."
      case "CredentialsSignin":
        return "Invalid credentials. Please check your email and password."
      case "SessionRequired":
        return "Please sign in to access this page."
      default:
        return error ? "An error occurred during sign-in. Please try again." : null
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Building2 className="h-12 w-12 text-orange-500" />
        </div>
        <CardTitle className="text-2xl">Welcome to Hive</CardTitle>
        <CardDescription>Sign in with your Google account to access the booking system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Use your Google account to create your Hive profile and start booking resources
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2 text-green-900">✨ What happens next:</h4>
            <ul className="text-xs text-green-800 space-y-1">
              <li>• Sign in with your Google account</li>
              <li>• Your profile will be created automatically</li>
              <li>• Start booking meeting rooms and phone booths</li>
              <li>• Your company will be detected from your email domain</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
