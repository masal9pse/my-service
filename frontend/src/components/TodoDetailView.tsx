import { useEffect, useState } from 'react'
import { fetchTodoById } from '../api'
import { Todo } from '../types'
import { MarkdownViewer } from './MarkdownViewer'
import { ArrowLeft, RefreshCw, AlertCircle, FileCode, Hash, Share2, Check } from 'lucide-react'

interface TodoDetailViewProps {
  todoId: number
  onBack: () => void
}

export function TodoDetailView({ todoId, onBack }: TodoDetailViewProps) {
  const [todo, setTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const loadData = () => {
    setLoading(true)
    setError(null)
    fetchTodoById(todoId)
      .then((data) => {
        setTodo(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [todoId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-6 px-4">
      {/* ナビゲーションバー */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>一覧に戻る</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="URLをコピー"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">URLコピー完了</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>共有</span>
              </>
            )}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
            title="再読み込み"
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
            <p className="font-semibold">Todoの取得に失敗しました</p>
            <p className="text-xs text-red-300 mt-1 font-mono">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 text-xs underline hover:text-white"
            >
              再試行する
            </button>
          </div>
        </div>
      )}

      {/* ローディングスケルトン */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-zinc-800/60 rounded-lg w-1/3"></div>
          <div className="h-64 bg-zinc-900/40 rounded-xl border border-zinc-800/60"></div>
        </div>
      )}

      {/* 詳細データ表示 */}
      {!loading && !error && todo && (
        <div className="space-y-6">
          {/* メタ情報ヘッダー */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40 flex items-center gap-0.5">
                    <Hash className="w-3 h-3" />
                    {todo.id}
                  </span>
                  <h1 className="text-base font-bold text-zinc-100">
                    Todo #{todo.id}
                  </h1>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  todos table / description
                </p>
              </div>
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              閲覧モード: <span className="text-emerald-400">ログイン不要（Public）</span>
            </div>
          </div>

          {/* GitHub風 Markdown ビューアー */}
          <MarkdownViewer
            content={todo.description || '*(No description provided)*'}
            title={`todo-${todo.id}.md`}
          />
        </div>
      )}
    </div>
  )
}
