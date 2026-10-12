package repository

import (
	"context"
	"database/sql"
	"errors"
	"time"
	"uuid"

	"myapi/internal/model"
)

type GoalRepository interface {
	GetAllGoals(ctx context.Context, userID *uuid.UUID) ([]model.Goal, error)
	GetGoalByID(ctx context.Context, id uuid.UUID) (*model.Goal, error)
	CreateGoal(ctx context.Context, userID uuid.UUID, title string, description string, deadline *string) (*model.Goal, error)
	GetTodosByGoalID(ctx context.Context, goalID uuid.UUID) ([]model.Todo, error)
}

type sqlGoalRepository struct {
	db *sql.DB
}

func NewGoalRepository(db *sql.DB) GoalRepository {
	return &sqlGoalRepository{db: db}
}

func (r *sqlGoalRepository) GetAllGoals(ctx context.Context, userID *uuid.UUID) ([]model.Goal, error) {
	var query string
	var args []interface{}

	if userID != nil {
		query = "SELECT id, user_id, title, COALESCE(description, ''), deadline, created_at, updated_at FROM goals WHERE user_id = $1 ORDER BY created_at DESC"
		args = append(args, *userID)
	} else {
		query = "SELECT id, user_id, title, COALESCE(description, ''), deadline, created_at, updated_at FROM goals ORDER BY created_at DESC"
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	goals := make([]model.Goal, 0)
	for rows.Next() {
		var g model.Goal
		var deadlineNull sql.NullTime
		if err := rows.Scan(&g.ID, &g.UserID, &g.Title, &g.Description, &deadlineNull, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, err
		}
		if deadlineNull.Valid {
			dStr := deadlineNull.Time.Format("2006-01-02")
			g.Deadline = &dStr
		}
		goals = append(goals, g)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return goals, nil
}

func (r *sqlGoalRepository) GetGoalByID(ctx context.Context, id uuid.UUID) (*model.Goal, error) {
	var g model.Goal
	var deadlineNull sql.NullTime
	query := "SELECT id, user_id, title, COALESCE(description, ''), deadline, created_at, updated_at FROM goals WHERE id = $1"
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&g.ID, &g.UserID, &g.Title, &g.Description, &deadlineNull, &g.CreatedAt, &g.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if deadlineNull.Valid {
		dStr := deadlineNull.Time.Format("2006-01-02")
		g.Deadline = &dStr
	}

	// 紐づくTODO一覧も取得
	todos, err := r.GetTodosByGoalID(ctx, id)
	if err == nil {
		g.Todos = todos
	}

	return &g, nil
}

func (r *sqlGoalRepository) CreateGoal(ctx context.Context, userID uuid.UUID, title string, description string, deadline *string) (*model.Goal, error) {
	var g model.Goal
	var deadlineTime *time.Time
	if deadline != nil && *deadline != "" {
		t, err := time.Parse("2006-01-02", *deadline)
		if err == nil {
			deadlineTime = &t
		}
	}

	query := `
		INSERT INTO goals (user_id, title, description, deadline)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, title, COALESCE(description, ''), deadline, created_at, updated_at
	`
	var deadlineNull sql.NullTime
	err := r.db.QueryRowContext(ctx, query, userID, title, description, deadlineTime).Scan(
		&g.ID, &g.UserID, &g.Title, &g.Description, &deadlineNull, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if deadlineNull.Valid {
		dStr := deadlineNull.Time.Format("2006-01-02")
		g.Deadline = &dStr
	}
	return &g, nil
}

func (r *sqlGoalRepository) GetTodosByGoalID(ctx context.Context, goalID uuid.UUID) ([]model.Todo, error) {
	query := "SELECT id, goal_id, user_id, COALESCE(description, '') FROM todos WHERE goal_id = $1 ORDER BY created_at ASC, id ASC"
	rows, err := r.db.QueryContext(ctx, query, goalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Todo, 0)
	for rows.Next() {
		var item model.Todo
		if err := rows.Scan(&item.ID, &item.GoalID, &item.UserID, &item.Description); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
