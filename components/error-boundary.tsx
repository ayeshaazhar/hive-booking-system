"use client"

import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
          <Card className="w-full max-w-md border-red-400 shadow-lg">
            <CardHeader className="bg-red-500 text-white rounded-t-lg">
              <CardTitle className="text-xl">Something went wrong!</CardTitle>
              <CardDescription className="text-red-100">
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="font-semibold text-red-700 mb-2">Error Details:</h3>
              <p className="text-sm text-red-600 font-mono break-words mb-4">
                {this.state.error?.toString() || "Unknown Error"}
              </p>
              {this.state.errorInfo && (
                <details className="text-xs text-red-500">
                  <summary className="cursor-pointer text-red-600 font-medium">Component Stack</summary>
                  <pre className="mt-2 p-2 bg-red-50 rounded-md overflow-auto max-h-40">
                    <code>{this.state.errorInfo.componentStack}</code>
                  </pre>
                </details>
              )}
              <Button onClick={() => window.location.reload()} className="mt-6 w-full bg-red-600 hover:bg-red-700">
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
