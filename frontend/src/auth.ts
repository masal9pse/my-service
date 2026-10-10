export interface AuthUser {
  id: string
  email: string
  role?: string
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  user: AuthUser
}

const STORAGE_KEY = 'strandlog_auth_session'

// Supabase URL & Anon Key の取得 (環境変数から解決)
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || ''
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  return { url: envUrl.replace(/\/$/, ''), anonKey: envKey }
}

// 保存されているセッションを取得
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const session: AuthSession = JSON.parse(raw)

    // 有効期限切れチェック (マージン10秒)
    if (session.expiresAt && Date.now() / 1000 > session.expiresAt - 10) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return session
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// セッションの保存
export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

// ログアウト
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// サインイン (Supabase Auth REST API)
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthSession> {
  const config = getSupabaseConfig()

  if (!config.url || !config.anonKey) {
    throw new Error(
      'Supabase の設定 (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) が環境変数に見つかりません。'
    )
  }

  const endpoint = `${config.url}/auth/v1/token?grant_type=password`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'apikey': config.anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const msg = data?.error_description || data?.msg || data?.message || response.statusText
    throw new Error(`ログインに失敗しました: ${msg}`)
  }

  if (!data?.access_token || !data?.user) {
    throw new Error('認証レスポンスに必要な情報 (access_token) が含まれていません。')
  }

  const session: AuthSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: {
      id: data.user.id,
      email: data.user.email || email,
      role: data.user.role,
    },
  }

  saveSession(session)
  return session
}
