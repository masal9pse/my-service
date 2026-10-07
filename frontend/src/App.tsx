import { useEffect, useState, useTransition } from 'react'
import { fetchTodos } from './api'
import { Todo } from './types'
import { TodoListView } from './components/TodoListView'
import { TodoDetailView } from './components/TodoDetailView'
import { 
  Home, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  Search, 
  TrendingUp,
  Sparkles
} from 'lucide-react'

type Route = 
  | { page: 'list' }
  | { page: 'detail'; id: number }

// 現在のパス・クエリからルートをパースするヘルパー
function parseRouteFromLocation(): Route {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  // クエリパラメータ ?todo=123 対応
  if (params.has('todo')) {
    const id = parseInt(params.get('todo')!, 10)
    if (!isNaN(id)) {
      return { page: 'detail', id }
    }
  }

  // パス /todos/123 対応
  const match = path.match(/^\/todos\/(\d+)$/)
  if (match) {
    const id = parseInt(match[1], 10)
    if (!isNaN(id)) {
      return { page: 'detail', id }
    }
  }

  return { page: 'list' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRouteFromLocation)
  const [items, setItems] = useState<Todo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 一覧データの読み込み
  const loadData = () => {
    setLoading(true)
    setError(null)
    fetchTodos()
      .then((data) => {
        startTransition(() => {
          setItems(data)
          setLoading(false)
        })
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  // ブラウザの進む/戻る (popstate) のハンドリング
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRouteFromLocation())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 詳細画面への遷移
  const navigateToDetail = (id: number) => {
    window.history.pushState({}, '', `/todos/${id}`)
    setRoute({ page: 'detail', id })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 一覧画面への遷移
  const navigateToList = () => {
    window.history.pushState({}, '', '/')
    setRoute({ page: 'list' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans">
      {/* 画面コンテナ (Twitter 3カラムレイアウト) */}
      <div className="w-full max-w-7xl flex justify-center">

        {/* 左サイドバー (ナビゲーション) */}
        <aside className="hidden md:flex flex-col justify-between w-16 xl:w-64 px-2 xl:px-4 py-3 border-r border-[#2f3336] sticky top-0 h-screen shrink-0 select-none">
          <div className="space-y-2">
            {/* X / Twitter ロゴ */}
            <div
              onClick={navigateToList}
              className="p-3 w-fit rounded-full hover:bg-white/[0.08] cursor-pointer transition"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>

            {/* ナビゲーションアイテム */}
            <nav className="space-y-1">
              <button
                onClick={navigateToList}
                className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left"
              >
                <Home className="w-6 h-6 text-white shrink-0" />
                <span className={`hidden xl:inline text-xl ${route.page === 'list' ? 'font-bold' : ''}`}>
                  ホーム
                </span>
              </button>

              <div className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left cursor-default text-[#71767b]">
                <Search className="w-6 h-6 shrink-0" />
                <span className="hidden xl:inline text-xl">話題を検索</span>
              </div>

              <div className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left cursor-default text-[#71767b]">
                <Bell className="w-6 h-6 shrink-0" />
                <span className="hidden xl:inline text-xl">通知</span>
              </div>

              <div className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left cursor-default text-[#71767b]">
                <Mail className="w-6 h-6 shrink-0" />
                <span className="hidden xl:inline text-xl">メッセージ</span>
              </div>

              <div className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left cursor-default text-[#71767b]">
                <Bookmark className="w-6 h-6 shrink-0" />
                <span className="hidden xl:inline text-xl">ブックマーク</span>
              </div>

              <div className="flex items-center gap-4 w-full p-3 rounded-full hover:bg-white/[0.08] transition text-left cursor-default text-[#71767b]">
                <User className="w-6 h-6 shrink-0" />
                <span className="hidden xl:inline text-xl">プロフィール</span>
              </div>
            </nav>

            {/* ポストボタン (デザイン) */}
            <div className="pt-2">
              <button
                onClick={navigateToList}
                className="w-full py-3 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-base transition shadow-md hidden xl:block"
              >
                ポストする
              </button>
              <button
                onClick={navigateToList}
                className="w-12 h-12 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white flex items-center justify-center font-bold text-base transition shadow-md xl:hidden mx-auto"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 下部アカウントバナー */}
          <div className="p-2 rounded-full hover:bg-white/[0.08] transition flex items-center justify-between cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-sky-400 flex items-center justify-center font-bold text-sm text-white shrink-0">
                U
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <p className="font-bold text-white">ゲストユーザー</p>
                <p className="text-[#71767b]">@guest_user</p>
              </div>
            </div>
          </div>
        </aside>

        {/* 中央カラム (メインタイムライン / ポスト詳細) */}
        <main className="w-full max-w-[600px] border-r border-[#2f3336] min-h-screen flex flex-col">
          {/* ヘッダー */}
          <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3.5 flex items-center justify-between">
            <div 
              onClick={navigateToList}
              className="cursor-pointer"
            >
              <h1 className="font-bold text-lg text-white">
                {route.page === 'list' ? 'ホーム' : 'ポスト'}
              </h1>
            </div>

            {/* モバイル用 X ロゴ */}
            <div className="md:hidden">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6 fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          </header>

          {/* ビュー切り替え */}
          <div className="flex-1">
            {route.page === 'list' ? (
              <TodoListView
                items={items}
                loading={loading || isPending}
                error={error}
                onRefresh={loadData}
                onSelectTodo={navigateToDetail}
              />
            ) : (
              <TodoDetailView
                todoId={route.id}
                onBack={navigateToList}
              />
            )}
          </div>
        </main>

        {/* 右サイドバー (トレンド情報) */}
        <aside className="hidden lg:block w-80 xl:w-96 p-4 sticky top-0 h-screen space-y-4">
          {/* 検索バー */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#71767b] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              readOnly
              placeholder="検索"
              className="w-full pl-11 pr-4 py-2.5 bg-[#202327] rounded-full text-sm text-white placeholder-[#71767b] focus:outline-none border border-transparent focus:border-[#1d9bf0]"
            />
          </div>

          {/* トレンドカード */}
          <div className="rounded-2xl bg-[#16181c] border border-[#2f3336] p-4 space-y-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1d9bf0]" />
              いまどうしてる？
            </h3>

            <div className="space-y-3 text-xs">
              <div className="hover:bg-white/[0.03] p-1.5 -mx-1.5 rounded-lg cursor-pointer transition">
                <p className="text-[#71767b]">テクノロジー · トレンド</p>
                <p className="font-bold text-sm text-white mt-0.5">#Go言語</p>
                <p className="text-[#71767b] mt-0.5">14.2K件のポスト</p>
              </div>

              <div className="hover:bg-white/[0.03] p-1.5 -mx-1.5 rounded-lg cursor-pointer transition">
                <p className="text-[#71767b]">開発 · トレンド</p>
                <p className="font-bold text-sm text-white mt-0.5">#React19</p>
                <p className="text-[#71767b] mt-0.5">8,410件のポスト</p>
              </div>

              <div className="hover:bg-white/[0.03] p-1.5 -mx-1.5 rounded-lg cursor-pointer transition">
                <p className="text-[#71767b]">デザイン · トレンド</p>
                <p className="font-bold text-sm text-white mt-0.5">#TailwindCSS</p>
                <p className="text-[#71767b] mt-0.5">5,120件のポスト</p>
              </div>
            </div>
          </div>

          {/* フッターリンク */}
          <div className="text-[11px] text-[#71767b] leading-relaxed px-2 space-x-2">
            <span>利用規約</span>
            <span>プライバシーポリシー</span>
            <span>Cookieのポリシー</span>
            <span>© 2026 X Corp.</span>
          </div>
        </aside>

      </div>
    </div>
  )
}
