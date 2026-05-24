import { cn } from '@/lib/utils'

/**
 * 骨架屏占位组件
 * @param {Object} props
 * @param {string} [props.className]
 * @param {"card"|"text"|"circle"|"button"|"wordCard"|"stats"} [props.variant="text"]
 */
function Skeleton({ className, variant = 'text' }) {
  const base = 'animate-pulse rounded-md bg-muted'

  const variants = {
    text: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-10 w-24',
    card: 'h-32 w-full rounded-lg',
    wordCard: 'h-[clamp(260px,50vh,340px)] w-full max-w-sm rounded-xl',
    stats: 'h-20 w-full rounded-lg',
  }

  return (
    <div className={cn(base, variants[variant] || variants.text, className)} />
  )
}

/**
 * 复合骨架屏 — 首页加载
 */
function HomeSkeleton() {
  return (
    <div className="p-4 space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="stats" />
        <Skeleton variant="stats" />
        <Skeleton variant="stats" />
        <Skeleton variant="stats" />
      </div>
      <Skeleton variant="text" className="h-3 w-2/3" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton variant="button" className="h-20 w-full" />
        <Skeleton variant="button" className="h-20 w-full" />
      </div>
      <Skeleton variant="card" className="h-24" />
    </div>
  )
}

/**
 * 复合骨架屏 — 学习页
 */
function StudySkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <Skeleton variant="text" className="h-4 w-48" />
      <Skeleton variant="wordCard" />
      <div className="flex gap-4">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  )
}

export { Skeleton, HomeSkeleton, StudySkeleton }
export default Skeleton
