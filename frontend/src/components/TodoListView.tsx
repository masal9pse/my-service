import { useState } from 'react'
import { Todo } from '../types'
import { 
  MessageCircle, 
  Repeat2, 
  Heart, 
  BarChart2, 
  Bookmark, 
  Share, 
  Search, 
  RefreshCw, 
  AlertCircle,
  BadgeCheck,
  Sparkles,
  Image,
  Smile,
  Calendar
} from 'lucide-react'

interface TodoListViewProps {
  items: Todo[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onSelectTodo: (id: number) => void
}

// アバターの背景色パレット (Twitter風)
const AVATAR_COLORS = [
  'bg-sky-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
]

export function TodoListView({
  items,
  loading,
  error,
  onRefresh,
  onSelectTodo,
}: TodoListViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou')
  const [likes, setLikes] = useState<Record<number, { liked: boolean; count: number }>>({})

  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikes((prev) => {
      const current = prev[id] || { liked: false, count: 12 }
      return {
        ...prev,
        [id]: {
          liked: !current.liked,
          count: current.liked ? current.count - 1 : current.count + 1,
        },
      }
    })
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      item.id.toString().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  })

  return (
    <div className="w-full flex flex-col">
      {/* Twitter風上部タブ (おすすめ / フォロー中) */}
      <div className="sticky top-[53px] z-10 bg-black/85 backdrop-blur-md border-b border-[#2f3336] flex">
        <button
          onClick={() => setActiveTab('forYou')}
          className="flex-1 py-3.5 text-center font-bold text-sm relative hover:bg-white/[0.04] transition"
        >
          <span className={activeTab === 'forYou' ? 'text-white' : 'text-[#71767b]'}>
            おすすめ
          </span>
          {activeTab === 'forYou' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('following')}
          className="flex-1 py-3.5 text-center font-bold text-sm relative hover:bg-white/[0.04] transition"
        >
          <span className={activeTab === 'following' ? 'text-white' : 'text-[#71767b]'}>
            フォロー中
          </span>
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1d9bf0] rounded-full" />
          )}
        </button>
      </div>

      {/* ポスト作成フォーム風エリア (Twitter TL感) */}
      <div className="p-4 border-b border-[#2f3336] hidden sm:flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-sky-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
          U
        </div>
        <div className="flex-1">
          <input
            type="text"
            readOnly
            placeholder="いまどうしてる？"
            className="w-full bg-transparent text-sm placeholder-[#71767b] text-white focus:outline-none cursor-default py-2"
          />
          <div className="flex items-center justify-between pt-2 border-t border-[#2f3336]/40 mt-2">
            <div className="flex items-center gap-3 text-[#1d9bf0]">
              <Image className="w-4 h-4 cursor-pointer hover:opacity-80" />
              <Smile className="w-4 h-4 cursor-pointer hover:opacity-80" />
              <Calendar className="w-4 h-4 cursor-pointer hover:opacity-80" />
            </div>
            <button
              disabled
              className="px-4 py-1.5 rounded-full bg-[#1d9bf0]/50 text-white text-xs font-bold cursor-not-allowed"
            >
              ポストする
            </button>
          </div>
        </div>
      </div>

      {/* 検索 & 更新バー */}
      <div className="p-3 border-b border-[#2f3336] flex items-center gap-2 bg-black">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71767b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="キーワード検索..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#202327] rounded-full text-xs text-white placeholder-[#71767b] focus:outline-none focus:ring-1 focus:ring-[#1d9bf0] border border-transparent transition"
          />
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2f3336] bg-[#16181c] text-[#71767b] hover:text-white hover:bg-[#202327] transition text-xs shrink-0 disabled:opacity-50"
          title="最新ポストを取得"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#1d9bf0]' : ''}`} />
          <span className="hidden sm:inline">更新</span>
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
              onClick={onRefresh}
              className="mt-2 text-xs text-[#1d9bf0] hover:underline"
            >
              再試行する
            </button>
          </div>
        </div>
      )}

      {/* ローディングスケルトン */}
      {loading && (
        <div className="divide-y divide-[#2f3336]">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-4 flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[#202327] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#202327] rounded w-1/4" />
                <div className="h-4 bg-[#202327] rounded w-3/4" />
                <div className="h-4 bg-[#202327] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空状態 */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-20 px-4">
          <Sparkles className="w-8 h-8 mx-auto text-[#71767b] mb-3" />
          <p className="text-white text-base font-bold">まだポストはありません</p>
          <p className="text-[#71767b] text-xs mt-1">
            {searchQuery ? '検索条件を変更してみてください。' : '新しいポストをお待ちください。'}
          </p>
        </div>
      )}

      {/* タイムラインリスト (ポスト一覧) */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="divide-y divide-[#2f3336]">
          {filteredItems.map((item) => {
            const avatarColor = AVATAR_COLORS[item.id % AVATAR_COLORS.length]
            const lines = (item.description || '').split('\n')
            const firstLine = lines[0] || '(本文なし)'
            const previewText = lines.slice(0, 3).join('\n')
            const likeState = likes[item.id] || { liked: false, count: (item.id * 7) % 30 + 3 }
            const replyCount = (item.id * 3) % 15 + 1
            const repostCount = (item.id * 2) % 8
            const viewCount = (item.id * 142) % 2500 + 120

            return (
              <article
                key={item.id}
                onClick={() => onSelectTodo(item.id)}
                className="p-4 hover:bg-white/[0.03] transition duration-150 cursor-pointer flex gap-3"
              >
                {/* アバター */}
                <div
                  className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-sm`}
                >
                  {String.fromCharCode(65 + (item.id % 26))}
                </div>

                {/* ポスト本文エリア */}
                <div className="flex-1 min-w-0">
                  {/* ヘッダー: ユーザー名、ハンドル、日時 */}
                  <div className="flex items-center gap-1.5 text-sm leading-tight flex-wrap mb-1">
                    <span className="font-bold text-white hover:underline flex items-center gap-1">
                      User #{item.id}
                      <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20" />
                    </span>
                    <span className="text-[#71767b] text-xs">
                      @user_{item.id}
                    </span>
                    <span className="text-[#71767b] text-xs">·</span>
                    <span className="text-[#71767b] text-xs hover:underline">
                      10月8日
                    </span>
                  </div>

                  {/* タイトル/1行目 */}
                  <div className="text-sm font-semibold text-white mb-1.5">
                    {firstLine.replace(/^#+\s*/, '')}
                  </div>

                  {/* 本文プレビュー */}
                  {lines.length > 1 && (
                    <p className="text-xs text-[#71767b] line-clamp-3 leading-relaxed mb-3 whitespace-pre-line font-sans">
                      {previewText}
                    </p>
                  )}

                  {/* Twitter風アクションバー */}
                  <div className="flex items-center justify-between max-w-md text-[#71767b] text-xs mt-2 pt-1">
                    {/* 返信 */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="group/action flex items-center gap-1.5 hover:text-[#1d9bf0] transition"
                    >
                      <div className="p-1.5 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span>{replyCount}</span>
                    </button>

                    {/* リポスト */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="group/action flex items-center gap-1.5 hover:text-[#00ba7c] transition"
                    >
                      <div className="p-1.5 rounded-full group-hover/action:bg-[#00ba7c]/10 transition">
                        <Repeat2 className="w-4 h-4" />
                      </div>
                      <span>{repostCount > 0 ? repostCount : ''}</span>
                    </button>

                    {/* いいね */}
                    <button
                      onClick={(e) => handleLike(item.id, e)}
                      className={`group/action flex items-center gap-1.5 transition ${
                        likeState.liked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
                      }`}
                    >
                      <div className="p-1.5 rounded-full group-hover/action:bg-[#f91880]/10 transition">
                        <Heart
                          className={`w-4 h-4 ${
                            likeState.liked ? 'fill-[#f91880]' : ''
                          }`}
                        />
                      </div>
                      <span>{likeState.count}</span>
                    </button>

                    {/* インプレッション */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="group/action flex items-center gap-1.5 hover:text-[#1d9bf0] transition"
                    >
                      <div className="p-1.5 rounded-full group-hover/action:bg-[#1d9bf0]/10 transition">
                        <BarChart2 className="w-4 h-4" />
                      </div>
                      <span>{viewCount}</span>
                    </button>

                    {/* ブックマーク & 共有 */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-full hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 transition"
                      >
                        <Share className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
