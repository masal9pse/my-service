import React, { useEffect, useState, useTransition } from 'react'
import { fetchNotTodos } from './api'
import { NotTodo } from './types'
import { 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  ThumbsUp, 
  Eye, 
  X, 
  Terminal,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react'

// 5段階のフリクションモーダル定義
const FRICTION_STEPS = [
  {
    title: 'フリクション Lv.1',
    message: '本当に今、他人のログを読む必要がありますか？',
    subtext: '受動的なブラウジングは、あなたの集中力を奪います。',
    btnText: '次へ進む',
  },
  {
    title: 'フリクション Lv.2',
    message: 'あなたの時間は貴重です',
    subtext: '他人の記録を眺める前に、自分自身の目標に立ち返りましょう。',
    btnText: 'それでも確認する',
  },
  {
    title: 'フリクション Lv.3',
    message: '今日、あなたの「前進・成果」は記録しましたか？',
    subtext: '自分を満たしてから、誰かの足跡を見つめましょう。',
    btnText: 'はい、記録しました',
  },
  {
    title: 'フリクション Lv.4',
    message: '深呼吸をしてください（沈黙のインターバル）',
    subtext: '衝動を鎮め、画面から目を離して3秒待ちましょう。',
    btnText: '心を落ち着かせた',
    requiresWait: 3,
  },
  {
    title: 'フリクション Lv.5（最終確認）',
    message: 'それでも閲覧しますか？',
    subtext: 'この先にあるのは、ただの誰かの日常です。過度な期待は不要です。',
    btnText: 'モザイクを解除して全文閲覧',
  },
]

export default function App() {
  const [items, setItems] = useState<NotTodo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // いいね連打のカウント管理 (itemID -> count)
  const [likes, setLikes] = useState<Record<number, number>>({})
  const [likeBursts, setLikeBursts] = useState<Record<number, boolean>>({})

  // 閲覧モーダルのステート
  const [activeItem, setActiveItem] = useState<NotTodo | null>(null)
  const [frictionStep, setFrictionStep] = useState<number>(0)
  const [waitCountdown, setWaitCountdown] = useState<number>(0)

  const loadData = () => {
    setLoading(true)
    setError(null)
    fetchNotTodos()
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

  // 連打いいねハンドラー
  const handleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikes((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }))
    // バウンスアニメーション発火
    setLikeBursts((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setLikeBursts((prev) => ({ ...prev, [id]: false }))
    }, 250)
  }

  // 詳細閲覧開始（フリクションステップ0へ）
  const openFrictionModal = (item: NotTodo) => {
    setActiveItem(item)
    setFrictionStep(0)
    setWaitCountdown(0)
  }

  // モーダル閉じる
  const closeModal = () => {
    setActiveItem(null)
    setFrictionStep(0)
    setWaitCountdown(0)
  }

  // ステップ進める
  const handleNextStep = () => {
    const next = frictionStep + 1
    if (next < FRICTION_STEPS.length) {
      setFrictionStep(next)
      if (FRICTION_STEPS[next].requiresWait) {
        setWaitCountdown(FRICTION_STEPS[next].requiresWait!)
      }
    } else {
      // 5ステップ突破！全文閲覧モード（step = FRICTION_STEPS.length）
      setFrictionStep(FRICTION_STEPS.length)
    }
  }

  // カウントダウンタイマー
  useEffect(() => {
    if (waitCountdown > 0) {
      const timer = setTimeout(() => {
        setWaitCountdown((c) => c - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [waitCountdown])

  return (
    <div className="min-h-screen bg-[#090d14] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* 荒野のアンビエント背景グラデーション */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.08),rgba(255,255,255,0))]" />
      
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-[#090d14]/85 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-wider text-base text-zinc-100">STRANDLOG</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700/50">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">孤独な荒野で、見知らぬ誰かの頑張りとすれ違う</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading || isPending}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-750 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 transition disabled:opacity-50"
          title="最新のストランドを再取得"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>更新</span>
        </button>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 z-10 flex flex-col gap-6">
        
        {/* コンセプトバナー */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
          <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-zinc-200 font-medium">ソーシャル・ストランド式 低刺激タイムライン</p>
            <p>
              脳死スクロールを阻止するため、投稿はモザイク処理されています。
              冒頭の気配だけで「お疲れ様！」といいね連打を贈ることができます。
            </p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-semibold">データの取得に失敗しました</p>
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
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 animate-pulse space-y-3"
              >
                <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
                <div className="h-6 bg-zinc-800/60 rounded w-3/4"></div>
                <div className="h-10 bg-zinc-800/30 rounded w-full"></div>
              </div>
            ))}
          </div>
        )}

        {/* 一覧リスト */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl p-8 bg-zinc-900/20">
            <Terminal className="w-8 h-8 mx-auto text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm">荒野にはまだ誰も足跡を残していません。</p>
            <p className="text-zinc-600 text-xs mt-1">最初の記録を投稿してみましょう。</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 px-1 font-mono">
              <span>DETECTED STRANDS: {items.length}件</span>
              <span>※ 全文閲覧には5回の意思確認が必要です</span>
            </div>

            {items.map((item) => {
              const fullText = item.description || item.title
              // 冒頭7文字だけ表示
              const previewPrefix = fullText.slice(0, 7)
              const hasMore = fullText.length > 7
              const myLikes = likes[item.id] || 0
              const isBursting = likeBursts[item.id]

              return (
                <div
                  key={item.id}
                  className="group relative p-5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition duration-200 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* メタ情報 */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-1.5 font-mono">
                        <span className="text-cyan-400/80">#ID-{item.id}</span>
                        <span>•</span>
                        <span>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('ja-JP', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '記録日時不明'}
                        </span>
                      </div>

                      {/* タイトル */}
                      <h2 className="text-sm font-semibold text-zinc-200 mb-2 truncate">
                        {item.title}
                      </h2>

                      {/* 低刺激モザイク本文 */}
                      <div className="relative rounded-lg p-3 bg-zinc-950/60 border border-zinc-800/80 overflow-hidden select-none">
                        <div className="text-xs text-zinc-300 font-mono flex items-center flex-wrap gap-1">
                          <span className="text-cyan-200 font-medium bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
                            {previewPrefix}
                          </span>
                          {hasMore && (
                            <span className="blur-[5px] opacity-60 tracking-widest text-zinc-500">
                              ████████████████████████████████████████
                            </span>
                          )}
                        </div>

                        {/* モザイク解除のフリクション起動ボタン */}
                        <button
                          onClick={() => openFrictionModal(item)}
                          className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 hover:bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition duration-200 text-xs text-cyan-300 font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>フリクションを経て全文を閲覧</span>
                        </button>
                      </div>
                    </div>

                    {/* 連打いいねボタン */}
                    <div className="flex flex-col items-center shrink-0">
                      <button
                        onClick={(e) => handleLike(item.id, e)}
                        className={`relative p-3 rounded-xl border transition-all duration-150 flex flex-col items-center justify-center ${
                          myLikes > 0
                            ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                            : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-zinc-800'
                        } ${isBursting ? 'scale-125 -rotate-6' : 'scale-100'}`}
                        title="連打で応援！"
                      >
                        <ThumbsUp className="w-5 h-5" />
                        {myLikes > 0 && (
                          <span className="text-[10px] font-bold mt-1 text-cyan-400 font-mono animate-bounce">
                            +{myLikes}
                          </span>
                        )}
                      </button>
                      <span className="text-[9px] text-zinc-500 mt-1">連打OK</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* フリクションモーダル（5回確認 or 全文表示） */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-750 shadow-2xl p-6 overflow-hidden">
            
            {/* 閉じるボタン */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ステップ 0〜4: フリクション警告 */}
            {frictionStep < FRICTION_STEPS.length ? (
              <div className="space-y-6">
                {/* プログレスバー */}
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-500 mb-2">
                    <span className="text-cyan-400">{FRICTION_STEPS[frictionStep].title}</span>
                    <span>{frictionStep + 1} / {FRICTION_STEPS.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${((frictionStep + 1) / FRICTION_STEPS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 警告メッセージ */}
                <div className="space-y-2 py-4">
                  <h3 className="text-lg font-bold text-zinc-100">
                    {FRICTION_STEPS[frictionStep].message}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {FRICTION_STEPS[frictionStep].subtext}
                  </p>
                </div>

                {/* 操作ボタン */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleNextStep}
                    disabled={waitCountdown > 0}
                    className="w-full py-3 px-4 rounded-xl font-medium text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30"
                  >
                    {waitCountdown > 0 ? (
                      <span>深呼吸して待機中... ({waitCountdown}s)</span>
                    ) : (
                      <>
                        <span>{FRICTION_STEPS[frictionStep].btnText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 px-4 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    閲覧をやめて自分の作業に戻る
                  </button>
                </div>
              </div>
            ) : (
              /* ステップ5: 突破後の全文閲覧画面 */
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                  <Sparkles className="w-4 h-4" />
                  <span>フリクション解除完了</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-500 font-mono">
                    #ID-{activeItem.id} • {activeItem.created_at ? new Date(activeItem.created_at).toLocaleString() : ''}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-100">{activeItem.title}</h2>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {activeItem.description || '(詳細な説明文はありません)'}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
                  <span className="text-xs text-zinc-500">
                    連打した気持ちを届けましょう
                  </span>
                  <button
                    onClick={(e) => handleLike(activeItem.id, e)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md shadow-cyan-900/40"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>いいね連打 ({likes[activeItem.id] || 0})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
