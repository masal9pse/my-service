export type UUID = string

export interface NotTodo {
  id: number
  title: string
  description: string | null
  created_at: string | null
}

export interface Goal {
  id: UUID
  user_id: UUID
  title: string
  description: string
  deadline?: string
  created_at: string
  updated_at: string
  todos?: Todo[]
}

export interface Todo {
  id: UUID
  goal_id?: UUID | null
  user_id?: UUID | null
  description: string
}
