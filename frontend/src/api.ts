import { NotTodo } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchNotTodos(): Promise<NotTodo[]> {
  const url = `${API_BASE}/not-todos`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to fetch items (${res.status}): ${errorBody || res.statusText}`)
  }

  const data = await res.json()
  return data
}
