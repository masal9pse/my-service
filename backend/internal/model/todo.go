package model

import (
	"time"
	"uuid"
)

// Response は汎用のAPIレスポンス構造体
type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

// Todo は todos テーブルのレコード構造体
type Todo struct {
	ID           uuid.UUID  `json:"id"`
	GoalID       *uuid.UUID `json:"goal_id,omitempty"`
	UserID       *uuid.UUID `json:"user_id,omitempty"`
	Description  string     `json:"description"`
	GoalNickname string     `json:"goal_nickname,omitempty"`
	GoalTitle    string     `json:"goal_title,omitempty"`
}

// CreateTodoRequest は Todo 作成リクエストの構造体
type CreateTodoRequest struct {
	GoalID      *uuid.UUID `json:"goal_id,omitempty"`
	Description string     `json:"description"`
}

// NotTodo は not_todos テーブルのレコード構造体
type NotTodo struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	CreatedAt   *time.Time `json:"created_at"`
}
