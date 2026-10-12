import { useState } from 'react'
import { Target, X, Calendar, FileText, Loader2, AlertCircle } from 'lucide-react'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateGoal: (data: { title: string; description?: string; deadline?: string }) => Promise<void>
}

export function CreateGoalModal({ isOpen, onClose, onCreateGoal }: CreateGoalModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    try {
      await onCreateGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
      })
      setTitle('')
      setDescription('')
      setDeadline('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100">新しい目標を作成</h2>
            <p className="text-xs text-zinc-400">Todoを紐づける親目標を設定します</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              目標タイトル <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: TOEIC 800点取得, 毎日筋トレ..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 text-sm placeholder:text-zinc-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              詳細・動機 (任意)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="目標の詳細や達成したい理由..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 text-sm placeholder:text-zinc-600 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              達成期限 (任意)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-950/80 border border-zinc-800 focus:border-cyan-500/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 text-sm text-zinc-200 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-cyan-950/50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>作成する</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
