import { useState } from 'react'
import { Goal, Todo } from '../types'
import { 
  FileText, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  Hash, 
  Terminal, 
  Plus, 
  Loader2, 
  Lock, 
  LogIn, 
  UserPlus,
  Target,
  Calendar
} from 'lucide-react'

interface TodoListViewProps {
  items: Todo[]
  goals: Goal[]
  selectedGoalId: string | null
  onSelectGoal: (goalId: string | null) => void
  onOpenCreateGoal: () => void
  loading: boolean
  error: string | null
  onRefresh: () => void
  onSelectTodo: (id: string) => void
  onCreateTodo?: (description: string, goalId?: string) => Promise<void>
  isLoggedIn: boolean
  onOpenLogin: () => void
  onOpenRegister?: () => void
}

export function TodoListView({
  items,
  goals,
  selectedGoalId,
  onSelectGoal,
  onOpenCreateGoal,
  loading,
  error,
  onRefresh,
  onSelectTodo,
  onCreateTodo,
  isLoggedIn,
  onOpenLogin,
  onOpenRegister,
}: TodoListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [assignGoalId, setAssignGoalId] = useState<string>(selectedGoalId || '')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // 選択中の目標
  const activeGoal = goals.find((g) => g.id === selectedGoalId)

  // 目標IDマップ（表示用）
  const goalMap = new Map<string, Goal>()
  goals.forEach((g) => goalMap.set(g.id, g))

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDescription.trim() || !onCreateTodo) return

    setSubmitting(true)
    setCreateError(null)
    try {
      const targetGoal = assignGoalId || selectedGoalId || undefined
      await onCreateTodo(newDescription.trim(), targetGoal)
      setNewDescription('')
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Todoの作成に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  // 目標フィルター ＆ 検索フィルター
  const filteredItems = items.filter((item) => {
    // 1. 目標フィルター
    if (selectedGoalId !== null) {
      if (selectedGoalId === 'unassigned') {
        if (item.goal_id) return false
      } else {
        if (item.goal_id !== selectedGoalId) return false
      }
    }

    // 2. 検索キーワード
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.id.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6 px-4">
      {/* エラー表示 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">データの取得に失敗しました</p>
            <p className="text-xs text-red-300 mt-1 font-mono">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-xs font-medium text-white transition shrink-0"
          >
            再試行
          </button>
        </div>
      )}

      {/* 1. 目標（Goals）セクション */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-200">目標（Goals）</h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono">
              {goals.length}
            </span>
          </div>
          {isLoggedIn ? (
            <button
              onClick={onOpenCreateGoal}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>目標を追加</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="text-xs text-zinc-400 hover:text-cyan-300 transition flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>ログインして目標を管理</span>
            </button>
          )}
        </div>

        {/* 目標タブフィルター */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => onSelectGoal(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedGoalId === null
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950'
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>すべてのTodo</span>
            <span className="text-[10px] opacity-75 font-mono">({items.length})</span>
          </button>

          {goals.map((g) => {
            const count = items.filter((t) => t.goal_id === g.id).length
            const isSelected = selectedGoalId === g.id
            return (
              <button
                key={g.id}
                onClick={() => onSelectGoal(isSelected ? null : g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span className="max-w-[120px] truncate">{g.title}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            )
          })}

          <button
            onClick={() => onSelectGoal(selectedGoalId === 'unassigned' ? null : 'unassigned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedGoalId === 'unassigned'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-950'
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <span>未分類</span>
            <span className="text-[10px] opacity-75 font-mono">
              ({items.filter((t) => !t.goal_id).length})
            </span>
          </button>
        </div>

        {/* 選択中の目標の詳細バナー */}
        {activeGoal && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-zinc-900/60 border border-cyan-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-cyan-950 px-2 py-0.5 rounded text-cyan-400 border border-cyan-700/50">
                  選択中の目標
                </span>
                <h3 className="text-sm font-bold text-zinc-100">{activeGoal.title}</h3>
              </div>
              {activeGoal.description && (
                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{activeGoal.description}</p>
              )}
            </div>
            {activeGoal.deadline && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>期日: {activeGoal.deadline}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. 未ログイン案内バナー */}
      {!isLoggedIn && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-200">目標やTodoを投稿するにはサインインが必要です</p>
              <p className="text-[11px] text-zinc-400">ログインすると自分だけの目標とTodoを保存・管理できます。</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>サインイン</span>
            </button>
            {onOpenRegister && (
              <button
                onClick={onOpenRegister}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm shadow-cyan-950/50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>新規登録</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. 新規Todo追加フォーム（ログイン時） */}
      {isLoggedIn && onCreateTodo && (
        <form onSubmit={handleCreateSubmit} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-zinc-200">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>新規 Todo を追加</span>
            </div>
            {/* 紐付ける目標の選択 */}
            {goals.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">目標紐付け:</span>
                <select
                  value={assignGoalId || selectedGoalId || ''}
                  onChange={(e) => setAssignGoalId(e.target.value)}
                  className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="">(なし・単発Todo)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Todo の内容を入力してください (Markdown対応)..."
              rows={2}
              disabled={submitting}
              className="flex-1 px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition resize-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting || !newDescription.trim()}
              className="px-4 py-2 self-end sm:self-auto rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>追加中...</span>
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
      )}

      {/* 4. ツールバー (検索 & リフレッシュ) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ID または 内容で検索..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400">
          <span className="font-mono text-zinc-500">
            {filteredItems.length} 件
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

      {/* 5. ローディングスケルトン */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse space-y-2.5"
            >
              <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
              <div className="h-4 bg-zinc-800/50 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* 6. 空状態 */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
          <Terminal className="w-8 h-8 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-300 text-sm font-medium">該当するTodoは見つかりませんでした。</p>
          <p className="text-zinc-500 text-xs mt-1">
            {searchQuery 
              ? '検索条件を変更してみてください。' 
              : activeGoal 
                ? `目標「${activeGoal.title}」にはまだTodoが紐づいていません。上のフォームから追加してください。`
                : 'データがまだ登録されていません。'}
          </p>
        </div>
      )}

      {/* 7. 一覧リスト */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const lines = (item.description || '').split('\n')
            const firstLine = lines[0] || '(説明なし)'
            const previewSnippet = lines.slice(0, 3).join('\n')
            const linkedGoal = item.goal_id ? goalMap.get(item.goal_id) : undefined

            return (
              <div
                key={item.id}
                onClick={() => onSelectTodo(item.id)}
                className="group relative p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 hover:bg-zinc-900 transition duration-200 cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-cyan-950/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* メタ情報 */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-2">
                      <span 
                        className="flex items-center gap-0.5 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40"
                        title={item.id}
                      >
                        <Hash className="w-3 h-3" />
                        {item.id.length > 8 ? item.id.slice(0, 8) : item.id}
                      </span>

                      {/* 紐づく目標のバッジ表示 */}
                      {linkedGoal && (
                        <span 
                          className="flex items-center gap-1 text-[11px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40"
                          title={linkedGoal.title}
                        >
                          <Target className="w-3 h-3 text-amber-400" />
                          <span className="max-w-[150px] truncate">{linkedGoal.title}</span>
                        </span>
                      )}

                      <span className="text-zinc-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        todo-{item.id.length > 8 ? item.id.slice(0, 8) : item.id}.md
                      </span>
                    </div>

                    {/* タイトル/1行目 */}
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-200 transition line-clamp-1">
                      {firstLine.replace(/^#+\s*/, '')}
                    </h3>

                    {/* 本文プレビュー */}
                    {item.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-mono leading-relaxed bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/60">
                        {previewSnippet}
                      </p>
                    )}
                  </div>

                  {/* 詳細へ進む矢印 */}
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
