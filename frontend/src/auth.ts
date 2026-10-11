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

let cachedConfig: { url: string; anonKey: string } | null = null

// Supabase URL & Anon Key の取得
// 1. ビルド時環境変数 (Vite)
// 2. バックエンド API (/api/config) から動的取得 (Cloud Run 同居配信など)
export async function getSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  if (cachedConfig && cachedConfig.url && cachedConfig.anonKey) {
    return cachedConfig
  }

  // 1. ビルド時環境変数
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  if (envUrl && envKey) {
    cachedConfig = { url: envUrl, anonKey: envKey }
    return cachedConfig
  }

  // 2. バックエンドの /api/config から動的取得
  try {
    const res = await fetch('/api/config')
    if (res.ok) {
      const data = await res.json()
      const apiUrl = (data.supabaseUrl || '').replace(/\/$/, '')
      const apiAnonKey = data.supabaseAnonKey || ''
      if (apiUrl && apiAnonKey) {
        cachedConfig = { url: apiUrl, anonKey: apiAnonKey }
        return cachedConfig
      }
    }
  } catch (err) {
    console.warn('Failed to fetch config from /api/config:', err)
  }

  return { url: '', anonKey: '' }
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
  const config = await getSupabaseConfig()

  if (!config.url || !config.anonKey) {
    throw new Error(
      'Supabase の設定 (URL / ANON KEY) が見つかりません。サーバー環境変数をご確認ください。'
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

export interface SignUpResult {
  session: AuthSession | null
  user: AuthUser
  needsEmailConfirmation: boolean
}

// 会員登録 (Supabase Auth REST API)
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<SignUpResult> {
  const config = await getSupabaseConfig()

  if (!config.url || !config.anonKey) {
    throw new Error(
      'Supabase の設定 (URL / ANON KEY) が見つかりません。サーバー環境変数をご確認ください。'
    )
  }

  const endpoint = `${config.url}/auth/v1/signup`

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
    throw new Error(`会員登録に失敗しました: ${msg}`)
  }

  // Supabase はレスポンスとして直下に user または { access_token, user } を含む
  const userObj = data?.user || (data?.id ? data : null)
  if (!userObj) {
    throw new Error('会員登録レスポンスに必要なユーザー情報が含まれていません。')
  }

  // Supabaseで既存ユーザー登録時、メール列挙防止で identities が空配列で返されることがある
  if (Array.isArray(userObj.identities) && userObj.identities.length === 0) {
    throw new Error('このメールアドレスは既に登録されています。サインインしてください。')
  }

  const user: AuthUser = {
    id: userObj.id,
    email: userObj.email || email,
    role: userObj.role,
  }

  // 自動サインインできた場合 (Email Confirmation が OFF の設定)
  if (data?.access_token) {
    const session: AuthSession = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      user,
    }
    saveSession(session)
    return {
      session,
      user,
      needsEmailConfirmation: false,
    }
  }

  // メール確認が必要な場合 (Supabase のデフォルト設定)
  return {
    session: null,
    user,
    needsEmailConfirmation: true,
  }
}
