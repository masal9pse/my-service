package model

import (
	"time"
	"uuid"
)

// Goal は goals テーブルのレコード構造体
type Goal struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Deadline    *string    `json:"deadline,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Todos       []Todo     `json:"todos,omitempty"` // 関連するTODO一覧
}

// CreateGoalRequest は Goal 作成リクエスト構造体
type CreateGoalRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Deadline    *string `json:"deadline,omitempty"`
}
