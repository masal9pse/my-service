import { validate as isValidUUID } from 'uuid'
import { Goal, NotTodo, Todo } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchTodos(): Promise<Todo[]> {
  const url = `${API_BASE}/todos`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to fetch todos (${res.status}): ${errorBody || res.statusText}`)
  }

  const data = await res.json()
  return data
}

export async function fetchTodoById(id: string): Promise<Todo> {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format: "${id}"`)
  }

  const url = `${API_BASE}/todos/${id}`
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to fetch todo #${id} (${res.status}): ${errorBody || res.statusText}`)
  }

  const data = await res.json()
  return data
}

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

export async function createTodo(description: string, token?: string, goalId?: string): Promise<Todo> {
  const url = `${API_BASE}/todos`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const payload: { description: string; goal_id?: string } = { description }
  if (goalId) {
    payload.goal_id = goalId
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error) {
        throw new Error(parsed.error)
      }
    } catch (e: any) {
      if (e.message && e.message !== errorBody) throw e
    }
    throw new Error(`Failed to create todo (${res.status}): ${errorBody || res.statusText}`)
  }

  const data = await res.json()
  return data
}

export async function fetchGoals(token?: string): Promise<Goal[]> {
  const url = `${API_BASE}/goals`
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to fetch goals (${res.status}): ${errorBody || res.statusText}`)
  }
  return await res.json()
}

export async function fetchGoalById(id: string, token?: string): Promise<Goal> {
  if (!isValidUUID(id)) {
    throw new Error(`Invalid UUID format: "${id}"`)
  }

  const url = `${API_BASE}/goals/${id}`
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { headers })
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to fetch goal (${res.status}): ${errorBody || res.statusText}`)
  }
  return await res.json()
}

export async function createGoal(
  data: { title: string; description?: string; deadline?: string },
  token: string
): Promise<Goal> {
  const url = `${API_BASE}/goals`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error) {
        throw new Error(parsed.error)
      }
    } catch (e: any) {
      if (e.message && e.message !== errorBody) throw e
    }
    throw new Error(`Failed to create goal (${res.status}): ${errorBody || res.statusText}`)
  }
  return await res.json()
}

