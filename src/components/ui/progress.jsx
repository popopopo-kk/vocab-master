import { Root, Indicator } from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {number} [props.value]
 */
function Progress({ className, value, ...props }) {
  return (
    <Root
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </Root>
  )
}

export { Progress }
