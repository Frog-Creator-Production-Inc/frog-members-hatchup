"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon
  title?: string
  description?: ReactNode
  iconClassName?: string
  containerClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  iconContainerClassName?: string
  direction?: "row" | "column"
}

export function IconBox({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  containerClassName,
  titleClassName,
  descriptionClassName,
  iconContainerClassName,
  direction = "row",
  children,
  ...props
}: IconBoxProps) {
  return (
    <div 
      className={cn(
        "flex", 
        direction === "row" ? "items-start" : "flex-col items-center text-center",
        containerClassName
      )}
      {...props}
    >
      <div 
        className={cn(
          "flex-shrink-0",
          direction === "row" 
            ? "mr-3" 
            : "mb-3",
          iconContainerClassName
        )}
      >
        <div className={cn(
          "flex items-center justify-center h-10 w-10 rounded-full bg-primary/10",
          iconClassName
        )}>
          <Icon className={cn("h-5 w-5 text-primary")} />
        </div>
      </div>
      <div className={cn(className)}>
        {title && (
          <h4 className={cn("text-sm font-semibold", titleClassName)}>
            {title}
          </h4>
        )}
        {description && (
          <p className={cn("text-sm text-muted-foreground", descriptionClassName)}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  )
} 