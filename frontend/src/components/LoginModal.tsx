import { useState } from 'react'
import { LogIn, X, AlertCircle, Loader2, KeyRound, Mail } from 'lucide-react'
import { signInWithEmailPassword, AuthSession } from '../auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (session: AuthSession) => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('returnymgstokh@gmail.com')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const session = await signInWithEmailPassword(email.trim(), password)
      onSuccess(session)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'サインインに失敗しました')
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
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">サインイン</h2>
              <p className="text-xs text-zinc-400">Todo を投稿するにはログインが必要です</p>
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
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span>パスワード</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 transition disabled:opacity-50"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full mt-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>サインイン中...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>サインイン</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
