"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  showErrorDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーロギングを削除
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 space-y-4 bg-red-50 border border-red-100 rounded-lg text-center">
            <div className="flex justify-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg font-medium text-gray-900">コンポーネントの読み込みに失敗しました</h2>
            {this.props.showErrorDetails && this.state.error && (
              <div className="mt-2 p-4 bg-gray-800 text-white rounded text-left overflow-auto text-xs">
                <p className="font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                <pre>{this.state.error.stack}</pre>
              </div>
            )}
            <Button
              onClick={this.handleReset}
              className="mt-4 inline-flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              再試行
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

