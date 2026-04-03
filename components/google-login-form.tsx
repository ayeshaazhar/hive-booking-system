"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Github, Loader2 } from "lucide-react"

export function SocialLoginForm() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState("")

  const handleLogin = async (provider: "google" | "github") => {
    setLoadingProvider(provider)
    setError("")
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch (err) {
      setError(`Login with ${provider} failed. Please try again.`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
      <Button
        onClick={() => handleLogin("google")}
        disabled={loadingProvider === "google"}
        className="w-full flex items-center justify-center space-x-2"
        variant="outline"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
        ) : (
          <img src="/placeholder-logo.png" alt="Google" className="h-4 w-4 mr-2" />
        )}
        <span>Sign in with Google</span>
      </Button>
      <Button
        onClick={() => handleLogin("github")}
        disabled={loadingProvider === "github"}
        className="w-full flex items-center justify-center space-x-2"
        variant="outline"
      >
        {loadingProvider === "github" ? (
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
        ) : (
          <Github className="h-4 w-4 mr-2" />
        )}
        <span>Sign in with GitHub</span>
      </Button>
      {error && <div className="text-red-600 text-sm text-center w-full">{error}</div>}
    </div>
  )
}
