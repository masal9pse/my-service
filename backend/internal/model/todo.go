package model

import "time"

// Response は汎用のAPIレスポンス構造体
type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

// Todo は todos テーブルのレコード構造体
type Todo struct {
	ID          int64  `json:"id"`
	Description string `json:"description"`
}

// NotTodo は not_todos テーブルのレコード構造体
type NotTodo struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	CreatedAt   *time.Time `json:"created_at"`
}
