import { useState } from 'react'
import { Goal, Todo } from '../types'
import { 
  ArrowLeft, 
  Target, 
  Calendar, 
  Plus, 
  Search, 
  RefreshCw, 
  Terminal, 
  FileText, 
  ArrowRight, 
  Hash, 
  Loader2, 
  User
} from 'lucide-react'

interface GoalDetailViewProps {
  goal: Goal
  items: Todo[]
  loading: boolean
  onBack: () => void
  onRefresh: () => void
  onSelectTodo: (id: string) => void
  onCreateTodo: (description: string, goalId: string) => Promise<void>
}

export function GoalDetailView({
  goal,
  items,
  loading,
  onBack,
  onRefresh,
  onSelectTodo,
  onCreateTodo,
}: GoalDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // この目標に紐づくTodoを抽出
  const goalTodos = items.filter((item) => item.goal_id === goal.id)

  // 検索フィルター
  const filteredTodos = goalTodos.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.id.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  })

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDescription.trim()) return

    setSubmitting(true)
    setCreateError(null)
    try {
      await onCreateTodo(newDescription.trim(), goal.id)
      setNewDescription('')
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Todoの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6 px-4">
      {/* 1. ナビゲーション & 目標ヘッダー */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-cyan-300 transition mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>全体一覧へ戻る</span>
        </button>

        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-zinc-900/80 to-zinc-950 border border-cyan-800/40 backdrop-blur-md shadow-xl shadow-cyan-950/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* ペルソナ（ニックネーム）バッジ */}
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{goal.nickname}</span>
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">（目標専用ペルソナ）</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2">
                <Target className="w-6 h-6 text-cyan-400 shrink-0" />
                <span>{goal.title}</span>
              </h1>

              {goal.description && (
                <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  {goal.description}
                </p>
              )}
            </div>

            {/* 期日 & Todo統計 */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              {goal.deadline && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>期日: {goal.deadline}</span>
                </div>
              )}
              <div className="text-xs text-zinc-400 bg-zinc-900/60 px-3 py-1.5 rounded-lg border border-zinc-800/80 font-mono">
                Todo: <span className="text-cyan-400 font-bold">{goalTodos.length}</span> 件
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. この目標専用の新規Todo追加フォーム */}
      <form onSubmit={handleCreateSubmit} className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-200">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>「{goal.nickname}」として新しい頑張りを記録</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-normal">Markdown対応</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder={`「${goal.title}」に関するTodoや頑張ったことを記録...`}
            rows={2}
            disabled={submitting}
            className="flex-1 px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={submitting || !newDescription.trim()}
            className="px-5 py-2.5 self-end sm:self-auto rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-sm shadow-cyan-950/50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>記録中...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>追加する</span>
              </>
            )}
          </button>
        </div>
        {createError && (
          <p className="text-xs text-red-400">{createError}</p>
        )}
      </form>

      {/* 3. 検索ツールバー */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="この目標内のTodoを検索..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400">
          <span className="font-mono text-zinc-500">
            {filteredTodos.length} 件
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>更新</span>
          </button>
        </div>
      </div>

      {/* 4. 空状態 */}
      {!loading && filteredTodos.length === 0 && (
        <div className="text-center py-14 border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
          <Terminal className="w-8 h-8 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-300 text-sm font-medium">Todoがまだ登録されていません。</p>
          <p className="text-zinc-500 text-xs mt-1">
            {searchQuery 
              ? '検索条件に一致するTodoはありませんでした。' 
              : '上のフォームから「' + goal.nickname + '」としての最初の頑張りを記録してみましょう。'}
          </p>
        </div>
      )}

      {/* 5. Todo一覧 */}
      {filteredTodos.length > 0 && (
        <div className="space-y-3">
          {filteredTodos.map((item) => {
            const lines = (item.description || '').split('\n')
            const firstLine = lines[0] || '(説明なし)'
            const previewSnippet = lines.slice(0, 3).join('\n')

            return (
              <div
                key={item.id}
                onClick={() => onSelectTodo(item.id)}
                className="group relative p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900 transition duration-200 cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-2">
                      <span 
                        className="flex items-center gap-0.5 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40"
                        title={item.id}
                      >
                        <Hash className="w-3 h-3" />
                        {item.id.length > 8 ? item.id.slice(0, 8) : item.id}
                      </span>

                      <span className="text-zinc-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        todo-{item.id.length > 8 ? item.id.slice(0, 8) : item.id}.md
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-200 transition line-clamp-1">
                      {firstLine.replace(/^#+\s*/, '')}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-mono leading-relaxed bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60">
                        {previewSnippet}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-zinc-500 group-hover:text-cyan-400 transition shrink-0 pt-2 font-medium">
                    <span className="hidden sm:inline">マークダウン詳細</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
