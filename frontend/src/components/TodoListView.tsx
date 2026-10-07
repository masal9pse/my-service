import { useState } from 'react'
import { Todo } from '../types'
import { 
  FileText, 
  ArrowRight, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  Hash,
  Terminal
} from 'lucide-react'

interface TodoListViewProps {
  items: Todo[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onSelectTodo: (id: number) => void
}

export function TodoListView({
  items,
  loading,
  error,
  onRefresh,
  onSelectTodo,
}: TodoListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.id.toString().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6 px-4">
      {/* 概要バナー */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3 backdrop-blur-sm">
        <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-zinc-200 font-medium">Todo 一覧 (公開モード / ログイン不要)</p>
          <p>
            データベースの todos テーブルから取得した一覧です。
            カードをクリックすると GitHub スタイルのマークダウン詳細画面で閲覧できます。
          </p>
        </div>
      </div>

      {/* ツールバー (検索 & 更新) */}
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

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-zinc-400 font-mono">
          <span>{filteredItems.length} 件表示</span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition disabled:opacity-50"
            title="最新データを再取得"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>更新</span>
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">データの取得に失敗しました</p>
            <p className="text-xs text-red-300 mt-1 font-mono">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-3 text-xs underline hover:text-white"
            >
              再試行する
            </button>
          </div>
        </div>
      )}

      {/* ローディングスケルトン */}
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

      {/* 空状態 */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
          <Terminal className="w-8 h-8 mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-300 text-sm font-medium">該当するTodoは見つかりませんでした。</p>
          <p className="text-zinc-500 text-xs mt-1">
            {searchQuery ? '検索条件を変更してみてください。' : 'todos テーブルにデータがまだ登録されていません。'}
          </p>
        </div>
      )}

      {/* 一覧リスト */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => {
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
                    {/* メタ情報 */}
                    <div className="flex items-center gap-2 text-xs font-mono mb-2">
                      <span className="flex items-center gap-0.5 text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        <Hash className="w-3 h-3" />
                        {item.id}
                      </span>
                      <span className="text-zinc-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        todo-{item.id}.md
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
