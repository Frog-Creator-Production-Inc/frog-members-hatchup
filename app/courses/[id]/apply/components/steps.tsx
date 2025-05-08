import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

interface Step {
  id: string
  title: string
  description: string
}

interface StepsProps {
  steps: Step[]
  currentStep: number
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="relative">
      <div className="absolute left-0 top-2 h-0.5 w-full bg-muted">
        <div
          className="absolute h-full bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>

      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center",
                (isCompleted || isCurrent) && "text-primary"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-500",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "border-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground"
                )}
              >
                {isCompleted && <CheckCircle2 className="h-3 w-3" />}
              </div>
              <div className="mt-2 text-center">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 