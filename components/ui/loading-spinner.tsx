import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-slate-600 border-t-purple-500",
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function LoadingCard() {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
    </div>
  )
}
