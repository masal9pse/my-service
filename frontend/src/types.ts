export type UUID = string

export interface NotTodo {
  id: number
  title: string
  description: string | null
  created_at: string | null
}

export interface Todo {
  id: UUID
  description: string
}
