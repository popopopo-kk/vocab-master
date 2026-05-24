import { BookOpen, Bookmark, RotateCcw, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICONS = {
  study: BookOpen,
  review: RotateCcw,
  favorites: Bookmark,
  empty: Clock,
  search: Search,
}

/**
 * 空状态占位组件
 * @param {Object} props
 * @param {string} [props.icon] — 图标 key: 'study'|'review'|'favorites'|'empty'|'search'
 * @param {string} props.title — 主提示文字
 * @param {string} [props.description] — 副提示文字
 * @param {string} [props.actionLabel] — 操作按钮文字
 * @param {() => void} [props.onAction] — 操作按钮回调
 * @param {string} [props.className]
 */
function EmptyState({
  icon = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  const Icon = ICONS[icon] || ICONS.empty

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
