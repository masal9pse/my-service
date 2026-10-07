import { useEffect, useState } from 'react'
import { fetchTodoById } from '../api'
import { Todo } from '../types'
import { MarkdownViewer } from './MarkdownViewer'
import { 
  ArrowLeft, 
  MessageCircle, 
  Repeat2, 
  Heart, 
  Bookmark, 
  Share, 
  BadgeCheck, 
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
  Check
} from 'lucide-react'

interface TodoDetailViewProps {
  todoId: number
  onBack: () => void
}

const AVATAR_COLORS = [
  'bg-sky-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
]

export function TodoDetailView({ todoId, onBack }: TodoDetailViewProps) {
  const [todo, setTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState<boolean>(false)
  const [likeCount, setLikeCount] = useState<number>((todoId * 7) % 30 + 12)
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

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const avatarColor = AVATAR_COLORS[todoId % AVATAR_COLORS.length]
  const replyCount = (todoId * 3) % 15 + 2
  const repostCount = (todoId * 2) % 8 + 1
  const viewCount = (todoId * 142) % 2500 + 450

  return (
    <div className="w-full flex flex-col">
      {/* Twitter風トップバー (← ポスト) */}
      <div className="sticky top-[53px] z-10 bg-black/85 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/[0.08] transition text-white"
            title="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-white leading-tight">ポスト</h2>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-full hover:bg-white/[0.08] transition text-[#71767b] hover:text-white disabled:opacity-50"
          title="最新のポストを取得"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1d9bf0]' : ''}`} />
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-4 border-b border-red-900/60 bg-red-950/20 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs">ポストの取得に失敗しました</p>
            <p className="text-xs text-red-300 mt-0.5 font-mono">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs text-[#1d9bf0] hover:underline"
            >
              再試行する
            </button>
          </div>
        </div>
      )}

      {/* ローディングスケルトン */}
      {loading && (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#202327]" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#202327] rounded w-1/4" />
              <div className="h-3 bg-[#202327] rounded w-1/6" />
            </div>
          </div>
          <div className="h-32 bg-[#202327]/60 rounded-xl" />
        </div>
      )}

      {/* ポスト詳細表示 */}
      {!loading && !error && todo && (
        <div className="p-4 sm:p-5">
          {/* 投稿者ヘッダー */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-md`}
              >
                {String.fromCharCode(65 + (todo.id % 26))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-base hover:underline cursor-pointer">
                    User #{todo.id}
                  </span>
                  <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20" />
                </div>
                <p className="text-[#71767b] text-sm">@user_{todo.id}</p>
              </div>
            </div>

            <button className="p-2 rounded-full hover:bg-white/[0.08] text-[#71767b] hover:text-white transition">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* マークダウン本文エリア (GitHub形式レンダリング) */}
          <div className="py-2 text-[#e7e9ea] leading-relaxed">
            <MarkdownViewer
              content={todo.description || '*(本文はありません)*'}
              showToolbar={true}
            />
          </div>

          {/* 投稿日時 & インプレッション */}
          <div className="py-3 border-b border-[#2f3336] text-sm text-[#71767b] flex items-center gap-1.5 flex-wrap">
            <span>午後11:42</span>
            <span>·</span>
            <span>2026年10月8日</span>
            <span>·</span>
            <span className="text-white font-semibold">{viewCount.toLocaleString()}</span>
            <span>件の表示</span>
          </div>

          {/* エンゲージメント統計数 (返信 / リポスト / いいね / ブックマーク) */}
          <div className="py-3 border-b border-[#2f3336] text-sm text-[#71767b] flex items-center gap-4 sm:gap-5 flex-wrap">
            <div>
              <span className="text-white font-bold">{replyCount}</span>{' '}
              <span>件の返信</span>
            </div>
            <div>
              <span className="text-white font-bold">{repostCount}</span>{' '}
              <span>件のリポスト</span>
            </div>
            <div>
              <span className="text-white font-bold">{likeCount}</span>{' '}
              <span>件のいいね</span>
            </div>
            <div>
              <span className="text-white font-bold">4</span>{' '}
              <span>件のブックマーク</span>
            </div>
          </div>

          {/* Twitter風アクションアイコンバー */}
          <div className="py-2.5 border-b border-[#2f3336] flex items-center justify-around text-[#71767b]">
            {/* 返信 */}
            <button className="p-2.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition">
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* リポスト */}
            <button className="p-2.5 rounded-full hover:text-[#00ba7c] hover:bg-[#00ba7c]/10 transition">
              <Repeat2 className="w-5 h-5" />
            </button>

            {/* いいね */}
            <button
              onClick={handleLike}
              className={`p-2.5 rounded-full transition ${
                liked
                  ? 'text-[#f91880] hover:bg-[#f91880]/10'
                  : 'hover:text-[#f91880] hover:bg-[#f91880]/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-[#f91880]' : ''}`} />
            </button>

            {/* ブックマーク */}
            <button className="p-2.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition">
              <Bookmark className="w-5 h-5" />
            </button>

            {/* 共有 */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition relative"
              title="リンクをコピー"
            >
              {copiedLink ? (
                <Check className="w-5 h-5 text-[#00ba7c]" />
              ) : (
                <Share className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* 返信スレッドプレースホルダー */}
          <div className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-sky-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
              U
            </div>
            <div className="flex-1 text-[#71767b] text-sm py-2 px-3 rounded-full bg-[#16181c] border border-[#2f3336]">
              返信をポスト...
            </div>
            <button
              disabled
              className="px-4 py-1.5 rounded-full bg-[#1d9bf0]/50 text-white text-xs font-bold cursor-not-allowed"
            >
              返信
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
