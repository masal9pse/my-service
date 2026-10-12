import { X, UserPlus, Sparkles, Clock } from 'lucide-react'

interface RegisterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-[#0d1117] border border-zinc-800 shadow-2xl p-6 text-zinc-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-100">新規会員登録</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 font-mono border border-cyan-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  PREVIEW
                </span>
              </div>
              <p className="text-xs text-zinc-400">先行プレビュー版のご案内</p>
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

        {/* 案内コンテンツ */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Clock className="w-4 h-4 shrink-0" />
            <span>現在は一般登録の準備中です</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            本サービス に関心をお持ちいただきありがとうございます！
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            一般ユーザー向けのアカウント登録機能は準備中となっております。完成までいましばらくお待ちください。
          </p>
        </div>

        {/* 閉じるボタン */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center justify-center"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
