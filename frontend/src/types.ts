export interface NotTodo {
  id: number
  title: string
  description: string | null
  created_at: string | null
}

export interface Todo {
  id: number
  description: string
}
