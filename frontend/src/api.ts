import { NotTodo, Todo } from './types'

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

export async function fetchTodoById(id: number): Promise<Todo> {
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

export async function createTodo(description: string): Promise<Todo> {
  const url = `${API_BASE}/todos`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ description }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Failed to create todo (${res.status}): ${errorBody || res.statusText}`)
  }

  const data = await res.json()
  return data
}

