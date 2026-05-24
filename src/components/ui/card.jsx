import { cn } from "@/lib/utils"

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
}

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  )
}

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function CardContent({ className, ...props }) {
  return <div className={cn("p-6 pt-0", className)} {...props} />
}

/**
 * @param {object} props
 * @param {string} [props.className]
 */
function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
