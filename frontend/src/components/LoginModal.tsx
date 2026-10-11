import { useState, useEffect } from 'react'
import { 
  LogIn, 
  UserPlus, 
  X, 
  AlertCircle, 
  Loader2, 
  KeyRound, 
  Mail, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { signInWithEmailPassword, signUpWithEmailPassword, AuthSession } from '../auth'

export type AuthModalMode = 'signin' | 'signup'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (session: AuthSession) => void
  initialMode?: AuthModalMode
}

export function LoginModal({ isOpen, onClose, onSuccess, initialMode = 'signin' }: LoginModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState<string | null>(null)

  // モーダルが開かれた時に初期モードへ合わせる
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setError(null)
      setConfirmationSent(null)
      setPassword('')
      setConfirmPassword('')
    }
  }, [isOpen, initialMode])

  if (!isOpen) return null

  const handleModeChange = (newMode: AuthModalMode) => {
    setMode(newMode)
    setError(null)
    setConfirmationSent(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('メールアドレスを入力してください')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('パスワードは6文字以上で設定してください')
        return
      }
      if (password !== confirmPassword) {
        setError('確認用パスワードが一致しません')
        return
      }
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        const session = await signInWithEmailPassword(trimmedEmail, password)
        onSuccess(session)
        onClose()
      } else {
        const result = await signUpWithEmailPassword(trimmedEmail, password)
        if (result.session) {
          // 即時セッション取得できた場合
          onSuccess(result.session)
          onClose()
        } else if (result.needsEmailConfirmation) {
          // メール認証が必要な場合
          setConfirmationSent(trimmedEmail)
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '処理に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-2xl p-6 text-zinc-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              {mode === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                {mode === 'signin' ? 'サインイン' : '新規会員登録'}
              </h2>
              <p className="text-xs text-zinc-400">
                {mode === 'signin' 
                  ? 'Todo を投稿するにはログインが必要です' 
                  : 'メールアドレスでアカウントを作成します'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* メール確認案内ビュー（サインアップ後） */}
        {confirmationSent ? (
          <div className="space-y-5 py-2">
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-zinc-200 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-cyan-200">確認メールを送信しました</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="text-cyan-300 font-mono font-medium">{confirmationSent}</span> 宛てに認証メールをお送りしました。
                </p>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                メール内の確認リンクをクリックして登録を完了させた後、サインインを行ってください。
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmationSent(null)
                setMode('signin')
              }}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
            >
              <span>サインイン画面へ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* タブ切り替え */}
            <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800/80 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>サインイン</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-zinc-800 text-cyan-400 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>新規登録</span>
              </button>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* メールアドレス */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span>メールアドレス</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition disabled:opacity-50"
                />
              </div>

              {/* パスワード */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>パスワード</span>
                  </label>
                  {mode === 'signup' && (
                    <span className="text-[10px] text-zinc-500">6文字以上</span>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? '•••••••• (6文字以上)' : '••••••••'}
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition disabled:opacity-50"
                />
              </div>

              {/* 確認用パスワード（新規登録時のみ） */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>パスワード（確認用）</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition disabled:opacity-50"
                  />
                </div>
              )}

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password || (mode === 'signup' && !confirmPassword)}
                className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'signin' ? 'サインイン中...' : 'アカウント作成中...'}</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>サインイン</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>アカウントを作成する</span>
                  </>
                )}
              </button>
            </form>

            {/* モード切り替えリンク */}
            <div className="text-center pt-2 border-t border-zinc-800/60 text-xs text-zinc-400">
              {mode === 'signin' ? (
                <p>
                  アカウントをお持ちでないですか？{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium ml-1 transition"
                  >
                    新規登録
                  </button>
                </p>
              ) : (
                <p>
                  既にアカウントをお持ちですか？{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium ml-1 transition"
                  >
                    サインイン
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
