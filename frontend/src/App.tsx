import { useEffect, useState, useTransition } from 'react'
import { fetchTodos, createTodo } from './api'
import { Todo } from './types'
import { getStoredSession, clearSession, AuthSession } from './auth'
import { TodoListView } from './components/TodoListView'
import { TodoDetailView } from './components/TodoDetailView'
import { LoginModal, AuthModalMode } from './components/LoginModal'
import { 
  Activity, 
  BookOpen,
  LogIn,
  LogOut,
  User,
  UserPlus
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

  // 認証状態管理
  const [session, setSession] = useState<AuthSession | null>(getStoredSession)
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false)
  const [authMode, setAuthMode] = useState<AuthModalMode>('signin')

  const openAuthModal = (mode: AuthModalMode = 'signin') => {
    setAuthMode(mode)
    setIsLoginOpen(true)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

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

  // Todo の新規作成 (要認証)
  const handleCreateTodo = async (description: string) => {
    if (!session?.accessToken) {
      setIsLoginOpen(true)
      throw new Error('Todoの投稿にはサインインが必要です。')
    }
    const newTodo = await createTodo(description, session.accessToken)
    setItems((prev) => [...prev, newTodo])
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* アンビエント背景グラデーション */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.08),rgba(255,255,255,0))]" />

      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#090d14]/85 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div 
          onClick={navigateToList}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:border-cyan-400 transition">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-base text-zinc-100 group-hover:text-cyan-300 transition">
                STRANDLOG
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-mono border border-zinc-700/50">
                TODOS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {route.page === 'list' ? 'Todo一覧 / マークダウン詳細' : `Todo #${route.id} 詳細画面`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-zinc-400">
          <button
            onClick={navigateToList}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
              route.page === 'list'
                ? 'bg-zinc-800 border-cyan-500/50 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>一覧</span>
          </button>

          {/* ログイン・ユーザー状態 */}
          {session ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="hidden sm:flex items-center gap-1.5 text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                <User className="w-3 h-3 text-cyan-400" />
                <span className="font-mono max-w-[150px] truncate">{session.user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-red-300 hover:border-red-900/60 hover:bg-red-950/20 transition flex items-center gap-1.5 text-xs"
                title="サインアウト"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>サインアウト</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('signin')}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium transition flex items-center gap-1.5 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>サインイン</span>
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition flex items-center gap-1.5 text-xs shadow-sm shadow-cyan-950/40"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>新規登録</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl w-full mx-auto z-10 flex flex-col">
        {route.page === 'list' ? (
          <TodoListView
            items={items}
            loading={loading || isPending}
            error={error}
            onRefresh={loadData}
            onSelectTodo={navigateToDetail}
            onCreateTodo={handleCreateTodo}
            isLoggedIn={!!session}
            onOpenLogin={(mode) => openAuthModal(mode || 'signin')}
          />
        ) : (
          <TodoDetailView
            todoId={route.id}
            onBack={navigateToList}
          />
        )}
      </main>

      {/* 認証モーダル (サインイン / 新規登録) */}
      <LoginModal
        isOpen={isLoginOpen}
        initialMode={authMode}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(newSession) => setSession(newSession)}
      />

      {/* フッター */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 font-mono">
        <p>STRANDLOG • Todo 一覧・マークダウン詳細ビューアー</p>
      </footer>
    </div>
  )
}
