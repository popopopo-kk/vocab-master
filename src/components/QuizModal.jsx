import { useState } from 'react'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import QuizEngine from './QuizEngine'

/**
 * 练习弹窗 — 学习/复习完成后弹出
 * @param {Object} props
 * @param {boolean} props.open — 是否打开
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {Array} props.words — 待练习单词列表
 * @param {string[]} [props.quizTypes] — 启用的题型
 * @param {() => void} [props.onClose] — 关闭回调
 */
function QuizModal({ open, onOpenChange, words, quizTypes, onClose }) {
  const [finished, setFinished] = useState(false)

  const handleComplete = (results) => {
    setFinished(true)
  }

  const handleClose = () => {
    setFinished(false)
    onOpenChange?.(false)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            巩固练习
          </DialogTitle>
          <DialogDescription>
            {finished
              ? '练习结果'
              : `对刚学/复习的 ${words.length} 个单词进行测验`}
          </DialogDescription>
        </DialogHeader>

        <QuizEngine
          words={words}
          types={quizTypes}
          onComplete={handleComplete}
        />

        {finished && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleClose}>完成</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default QuizModal
