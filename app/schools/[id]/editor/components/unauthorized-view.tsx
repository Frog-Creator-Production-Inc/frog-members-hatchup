import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"

type ErrorReason = "token-required" | "invalid-token" | "school-not-found" | "server-error"

interface UnauthorizedViewProps {
  reason: ErrorReason
}

// Error message mapping
const errorMessages = {
  "token-required": {
    title: "Access Token Required",
    description: "A valid token is required to access this page. Please use the link sent by the school administrator.",
  },
  "invalid-token": {
    title: "Invalid or Expired Token",
    description: "The provided token is invalid or has expired. Please request a new access link from the school administrator.",
  },
  "school-not-found": {
    title: "School Not Found",
    description: "The specified school information was not found. Please verify that the URL is correct.",
  },
  "server-error": {
    title: "Server Error Occurred",
    description: "An error occurred while loading data. Please try again later or contact the administrator.",
  }
}

export function UnauthorizedView({ reason }: UnauthorizedViewProps) {
  const errorInfo = errorMessages[reason] || {
    title: "Access Error",
    description: "You do not have permission to access this page."
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-50 p-4 border-b border-red-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <h2 className="ml-3 text-lg font-medium text-red-800">
              {errorInfo.title}
            </h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {errorInfo.description}
          </p>
          
          <div className="flex flex-col space-y-3">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Homepage
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="text-gray-500">
              <Link href="/contact">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 