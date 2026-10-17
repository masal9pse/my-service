import { useEffect, useState, useRef, useTransition } from 'react'
import { fetchTodos, createTodo, fetchGoals, createGoal } from './api'
import { Todo, Goal } from './types'
import { getStoredSession, clearSession, AuthSession } from './auth'
import { TodoListView } from './components/TodoListView'
import { GoalDetailView } from './components/GoalDetailView'
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
  UserPlus,
  Plus,
  ChevronDown,
  Check
} from 'lucide-react'

type Route = 
  | { page: 'list' }
  | { page: 'goal'; id: string }
  | { page: 'detail'; id: string }

// 現在のパス・クエリからルートをパースするヘルパー
function parseRouteFromLocation(): Route {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  // クエリパラメータ ?goal=uuid 対応
  if (params.has('goal')) {
    const id = params.get('goal')!.trim()
    if (isValidUUID(id)) {
      return { page: 'goal', id }
    }
  }

  // パス /goals/:uuid 対応
  const goalMatch = path.match(/^\/goals\/([^/]+)$/)
  if (goalMatch && isValidUUID(goalMatch[1])) {
    return { page: 'goal', id: goalMatch[1] }
  }

  // クエリパラメータ ?todo=uuid 対応
  if (params.has('todo')) {
    const id = params.get('todo')!.trim()
    if (isValidUUID(id)) {
      return { page: 'detail', id }
    }
  }

  // パス /todos/:uuid 対応
  const todoMatch = path.match(/^\/todos\/([^/]+)$/)
  if (todoMatch && isValidUUID(todoMatch[1])) {
    return { page: 'detail', id: todoMatch[1] }
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

  // ペルソナ切り替えメニューの開閉管理
  const [personaMenuOpen, setPersonaMenuOpen] = useState<boolean>(false)
  const personaMenuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target as Node)) {
        setPersonaMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 現在選択中の目標（アクティブペルソナ）
  const activeGoalId = route.page === 'goal' ? route.id : selectedGoalId
  const activeGoal = goals.find((g) => g.id === activeGoalId) || (goals.length > 0 ? goals[0] : null)

  const handleOpenRegister = () => {
    setIsRegisterOpen(true)
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setPersonaMenuOpen(false)
    navigateToList()
  }

  // 一覧データの読み込み (Todos & Goals)
  const loadData = () => {
    setLoading(true)
    setError(null)

    const token = session?.accessToken
    Promise.all([
      fetchTodos(),
      token ? fetchGoals(token).catch(() => [] as Goal[]) : Promise.resolve([] as Goal[]),
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

  // 全体一覧画面への遷移
  const navigateToList = () => {
    window.history.pushState({}, '', '/')
    setRoute({ page: 'list' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 目標ごとの一覧画面への遷移
  const navigateToGoal = (goalId: string) => {
    setSelectedGoalId(goalId)
    window.history.pushState({}, '', `/goals/${goalId}`)
    setRoute({ page: 'goal', id: goalId })
    setPersonaMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 詳細画面への遷移
  const navigateToDetail = (id: string) => {
    window.history.pushState({}, '', `/todos/${id}`)
    setRoute({ page: 'detail', id })
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
  const handleCreateGoal = async (data: { nickname: string; title: string; description?: string; deadline?: string }) => {
    if (!session?.accessToken) {
      setIsLoginOpen(true)
      throw new Error('目標の作成にはサインインが必要です。')
    }
    const newGoal = await createGoal(data, session.accessToken)
    setGoals((prev) => [newGoal, ...prev])
    navigateToGoal(newGoal.id) // 作成した目標の一覧画面へ遷移
  }

  return (
    <div className="min-h-screen bg-[#090d14] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* アンビエント背景グラデーション */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.08),rgba(255,255,255,0))]" />

      {/* ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#090d14]/85 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div 
          onClick={navigateToList}
          className="flex items-center gap-3 select-none cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:border-cyan-400 transition">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-zinc-100 group-hover:text-cyan-300 transition flex items-center gap-1.5">
              <span>StrandLog</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* 全体一覧ボタン */}
          <button
            onClick={navigateToList}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
              route.page === 'list'
                ? 'bg-zinc-800 border-cyan-500/50 text-cyan-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>すべての頑張り</span>
          </button>

          {/* ログイン時：目標ニックネーム（ペルソナ）切り替えボタン */}
          {session ? (
            <div className="relative" ref={personaMenuRef}>
              {goals.length > 0 ? (
                <button
                  onClick={() => setPersonaMenuOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 shadow-sm ${
                    activeGoal
                      ? 'border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/50 text-cyan-200 shadow-cyan-950/50'
                      : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300'
                  }`}
                  title="目標（ペルソナ）を切り替える"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-xs max-w-[120px] sm:max-w-[160px] truncate">
                    {activeGoal ? activeGoal.nickname : `目標を選択 (${goals.length})`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-cyan-400/80 transition-transform ${personaMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  onClick={() => setIsCreateGoalOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 transition flex items-center gap-1.5 text-xs font-medium shadow-sm shadow-cyan-950/50"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>目標を作成</span>
                </button>
              )}

              {/* ドロップダウンメニュー */}
              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 text-zinc-200 animate-fade-in backdrop-blur-xl">
                  <div className="px-3 py-2 border-b border-zinc-800/80">
                    <p className="text-[11px] font-semibold text-zinc-400">目標（ペルソナ）を切り替える</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">選択した目標専用の一覧画面を開きます</p>
                  </div>

                  {/* 目標リスト */}
                  <div className="py-1 max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
                    {goals.map((g) => {
                      const isSelected = activeGoal?.id === g.id
                      const count = items.filter((t) => t.goal_id === g.id).length

                      return (
                        <button
                          key={g.id}
                          onClick={() => navigateToGoal(g.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between group ${
                            isSelected
                              ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-700/50'
                              : 'hover:bg-zinc-800/70 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5 font-semibold text-zinc-100 group-hover:text-cyan-300 transition">
                              <User className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{g.nickname}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{g.title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500">{count}件</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* 新規目標追加ボタン */}
                  <div className="pt-1 border-t border-zinc-800/80">
                    <button
                      onClick={() => {
                        setPersonaMenuOpen(false)
                        setIsCreateGoalOpen(true)
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium text-cyan-300 hover:bg-cyan-950/60 transition flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>新しい目標（ペルソナ）を追加</span>
                    </button>
                  </div>

                  {/* サインアウト導線 */}
                  <div className="pt-1 mt-1 border-t border-zinc-800/80 flex items-center justify-between px-3 py-2 text-[11px] text-zinc-500">
                    <span className="truncate max-w-[130px] font-mono">{session.user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-zinc-400 hover:text-red-400 transition flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>サインアウト</span>
                    </button>
                  </div>
                </div>
              )}
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
                <span>新規登録</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl w-full mx-auto z-10 flex flex-col">
        {route.page === 'list' && (
          <TodoListView
            items={items}
            goals={goals}
            loading={loading || isPending}
            error={error}
            onRefresh={loadData}
            onSelectTodo={navigateToDetail}
            onSelectGoal={navigateToGoal}
            onOpenCreateGoal={() => setIsCreateGoalOpen(true)}
            isLoggedIn={!!session}
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenRegister={handleOpenRegister}
          />
        )}

        {route.page === 'goal' && (
          (() => {
            const currentGoal = goals.find((g) => g.id === route.id)
            if (!currentGoal) {
              return (
                <div className="py-20 text-center">
                  <p className="text-sm text-zinc-400 mb-4">目標が見つかりませんでした。</p>
                  <button
                    onClick={navigateToList}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-200 hover:bg-zinc-700 transition"
                  >
                    全体一覧に戻る
                  </button>
                </div>
              )
            }
            return (
              <GoalDetailView
                goal={currentGoal}
                items={items}
                loading={loading || isPending}
                onBack={navigateToList}
                onRefresh={loadData}
                onSelectTodo={navigateToDetail}
                onCreateTodo={handleCreateTodo}
              />
            )
          })()
        )}

        {route.page === 'detail' && (
          <TodoDetailView
            todoId={route.id}
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
        <p>目標（ペルソナ）＆ Todo 一覧・マークダウン詳細ビューアー</p>
      </footer>
    </div>
  )
}
