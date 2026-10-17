import { useState } from 'react'
import { Goal, Todo } from '../types'
import { 
  ArrowRight, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Hash, 
  Terminal, 
  Plus, 
  Lock, 
  LogIn, 
  UserPlus,
  Target,
  User,
  Sparkles
} from 'lucide-react'

interface TodoListViewProps {
  items: Todo[]
  goals: Goal[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onSelectTodo: (id: string) => void
  onSelectGoal: (goalId: string) => void
  onOpenCreateGoal: () => void
  isLoggedIn: boolean
  onOpenLogin: () => void
  onOpenRegister?: () => void
}

export function TodoListView({
  items,
  goals,
  loading,
  error,
  onRefresh,
  onSelectTodo,
  onSelectGoal,
  onOpenCreateGoal,
  isLoggedIn,
  onOpenLogin,
  onOpenRegister,
}: TodoListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // 目標IDマップ（表示用）
  const goalMap = new Map<string, Goal>()
  goals.forEach((g) => goalMap.set(g.id, g))

  // 検索フィルター
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const nickname = (item.goal_nickname || goalMap.get(item.goal_id || '')?.nickname || '').toLowerCase()
    const title = (item.goal_title || goalMap.get(item.goal_id || '')?.title || '').toLowerCase()

    return (
      item.id.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      nickname.includes(query) ||
      title.includes(query)
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

      {/* 1. 未ログイン案内バナー */}
      {!isLoggedIn && (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-200">目標ごとのペルソナで頑張りを記録しませんか？</p>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">サインインすると自分専用の目標を作成し、ペルソナごとにTodoを管理できます。</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>サインイン</span>
            </button>
            {onOpenRegister && (
              <button
                onClick={onOpenRegister}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-sm shadow-cyan-950/50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>新規登録</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. ログイン時：目標（ペルソナ）一覧ショートカット */}
      {isLoggedIn && (
        <section className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-zinc-200">あなたの目標（ペルソナ）</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 font-mono">
                {goals.length}
              </span>
            </div>
            <button
              onClick={onOpenCreateGoal}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>目標を追加</span>
            </button>
          </div>

          {goals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {goals.map((g) => {
                const count = items.filter((t) => t.goal_id === g.id).length
                return (
                  <button
                    key={g.id}
                    onClick={() => onSelectGoal(g.id)}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/90 hover:border-cyan-500/50 hover:bg-zinc-850 text-left transition group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{g.nickname}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium truncate group-hover:text-cyan-200 transition">
                        {g.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 font-mono">
                      <span>{count} 件のTodo</span>
                      <span className="text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        開く <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
              <p className="text-xs text-zinc-400">まだ目標が登録されていません。</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                上の「目標を追加」からペルソナ名を設定して目標を作成すると、専用の一覧画面で記録できます。
              </p>
            </div>
          )}
        </section>
      )}

      {/* 3. 単なる一覧ヘッダー & 検索バー */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-zinc-100">すべての頑張り一覧</h2>
            <span className="text-xs text-zinc-500 font-mono">
              ({filteredItems.length} 件)
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>更新</span>
          </button>
        </div>

        {/* 検索入力 */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="内容、目標ニックネーム、タイトルで検索..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition"
          />
        </div>
      </div>

      {/* 4. ローディングスケルトン */}
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

      {/* 5. 空状態 */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
          <Terminal className="w-8 h-8 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-300 text-sm font-medium">該当するTodoは見つかりませんでした。</p>
          <p className="text-zinc-500 text-xs mt-1">
            {searchQuery 
              ? '検索条件を変更してみてください。' 
              : 'まだ頑張りログが投稿されていません。目標を作成して最初のTodoを記録しましょう。'}
          </p>
        </div>
      )}

      {/* 6. 単なる一覧リスト */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const lines = (item.description || '').split('\n')
            const firstLine = lines[0] || '(説明なし)'
            const previewSnippet = lines.slice(0, 3).join('\n')
            const linkedGoal = item.goal_id ? goalMap.get(item.goal_id) : undefined
            const displayNickname = item.goal_nickname || linkedGoal?.nickname
            const displayTitle = item.goal_title || linkedGoal?.title

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
                      {/* 目標ニックネーム（ペルソナ名）バッジ */}
                      {displayNickname ? (
                        <span 
                          onClick={(e) => {
                            if (item.goal_id) {
                              e.stopPropagation()
                              onSelectGoal(item.goal_id)
                            }
                          }}
                          className="flex items-center gap-1 text-[11px] font-sans font-semibold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60 hover:border-cyan-400 transition"
                          title="このペルソナの目標画面を開く"
                        >
                          <User className="w-3 h-3 text-cyan-400" />
                          <span>{displayNickname}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
                          単発Todo
                        </span>
                      )}

                      {/* 目標タイトル */}
                      {displayTitle && (
                        <span 
                          className="flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-950/50 px-2 py-0.5 rounded border border-zinc-800/80"
                          title={displayTitle}
                        >
                          <Target className="w-3 h-3 text-zinc-500" />
                          <span className="max-w-[150px] truncate">{displayTitle}</span>
                        </span>
                      )}

                      <span 
                        className="flex items-center gap-0.5 text-zinc-500 bg-zinc-950/40 px-1.5 py-0.5 rounded text-[10px]"
                        title={item.id}
                      >
                        <Hash className="w-2.5 h-2.5" />
                        {item.id.length > 8 ? item.id.slice(0, 8) : item.id}
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
                    <span className="hidden sm:inline">詳細</span>
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
