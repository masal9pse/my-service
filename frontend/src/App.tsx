import { useEffect, useState, useTransition } from 'react'
import { fetchTodos, createTodo, fetchGoals, createGoal } from './api'
import { Todo, Goal } from './types'
import { getStoredSession, clearSession, AuthSession } from './auth'
import { TodoListView } from './components/TodoListView'
import { TodoDetailView } from './components/TodoDetailView'
import { LoginModal } from './components/LoginModal'
import { RegisterModal } from './components/RegisterModal'
import { CreateGoalModal } from './components/CreateGoalModal'
import { validate as isValidUUID } from 'uuid'
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
  | { page: 'detail'; id: string }

// 現在のパス・クエリからルートをパースするヘルパー
function parseRouteFromLocation(): Route {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  // クエリパラメータ ?todo=uuid 対応
  if (params.has('todo')) {
    const id = params.get('todo')!.trim()
    if (isValidUUID(id)) {
      return { page: 'detail', id }
    }
  }

  // パス /todos/:uuid 対応
  const match = path.match(/^\/todos\/([^/]+)$/)
  if (match && isValidUUID(match[1])) {
    return { page: 'detail', id: match[1] }
  }

  return { page: 'list' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseRouteFromLocation)
  const [items, setItems] = useState<Todo[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // 認証状態管理
  const [session, setSession] = useState<AuthSession | null>(getStoredSession)
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false)
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState<boolean>(false)

  // 会員登録ボタンクリック（スモークテスト）
  const handleOpenRegister = () => {
    setIsRegisterOpen(true)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
  }

  // 一覧データの読み込み (Todos & Goals)
  const loadData = () => {
    setLoading(true)
    setError(null)

    const token = session?.accessToken
    Promise.all([
      fetchTodos(),
      fetchGoals(token).catch(() => [] as Goal[]),
    ])
      .then(([todosData, goalsData]) => {
        startTransition(() => {
          setItems(todosData)
          setGoals(goalsData)
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
  }, [session?.accessToken])

  // ブラウザの進む/戻る (popstate) のハンドリング
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRouteFromLocation())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 詳細画面への遷移
  const navigateToDetail = (id: string) => {
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
  const handleCreateTodo = async (description: string, goalId?: string) => {
    if (!session?.accessToken) {
      setIsLoginOpen(true)
      throw new Error('Todoの投稿にはサインインが必要です。')
    }
    const newTodo = await createTodo(description, session.accessToken, goalId)
    setItems((prev) => [...prev, newTodo])
  }

  // Goal の新規作成 (要認証)
  const handleCreateGoal = async (data: { title: string; description?: string; deadline?: string }) => {
    if (!session?.accessToken) {
      setIsLoginOpen(true)
      throw new Error('目標の作成にはサインインが必要です。')
    }
    const newGoal = await createGoal(data, session.accessToken)
    setGoals((prev) => [newGoal, ...prev])
    setSelectedGoalId(newGoal.id) // 作成した目標をアクティブにする
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
                onClick={() => setIsLoginOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>サインイン</span>
              </button>
              <button
                onClick={handleOpenRegister}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition flex items-center gap-1.5 text-xs shadow-sm shadow-cyan-950/50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>会員登録</span>
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
            goals={goals}
            selectedGoalId={selectedGoalId}
            onSelectGoal={setSelectedGoalId}
            onOpenCreateGoal={() => {
              if (!session) {
                setIsLoginOpen(true)
              } else {
                setIsCreateGoalOpen(true)
              }
            }}
            loading={loading || isPending}
            error={error}
            onRefresh={loadData}
            onSelectTodo={navigateToDetail}
            onCreateTodo={handleCreateTodo}
            isLoggedIn={!!session}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={handleOpenRegister}
          />
        ) : (
          <TodoDetailView
            todoId={route.id}
            onBack={navigateToList}
          />
        )}
      </main>

      {/* 目標作成モーダル */}
      <CreateGoalModal
        isOpen={isCreateGoalOpen}
        onClose={() => setIsCreateGoalOpen(false)}
        onCreateGoal={handleCreateGoal}
      />

      {/* サインインモーダル */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(newSession) => setSession(newSession)}
        onOpenRegister={handleOpenRegister}
      />

      {/* 新規会員登録スモークテストモーダル */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {/* フッター */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 font-mono">
        <p>目標 & Todo 一覧・マークダウン詳細ビューアー</p>
      </footer>
    </div>
  )
}
