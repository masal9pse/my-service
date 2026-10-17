package repository

import (
	"context"
	"database/sql"
	"errors"
	"uuid"

	"myapi/internal/model"
)

var (
	ErrNotFound = errors.New("record not found")
)

type TodoRepository interface {
	GetAllTodos(ctx context.Context) ([]model.Todo, error)
	GetTodoByID(ctx context.Context, id uuid.UUID) (*model.Todo, error)
	GetAllNotTodos(ctx context.Context) ([]model.NotTodo, error)
	CreateTodo(ctx context.Context, description string, goalID *uuid.UUID, userID *uuid.UUID) (*model.Todo, error)
}

type sqlTodoRepository struct {
	db *sql.DB
}

func NewTodoRepository(db *sql.DB) TodoRepository {
	return &sqlTodoRepository{db: db}
}

func (r *sqlTodoRepository) GetAllTodos(ctx context.Context) ([]model.Todo, error) {
	query := `
		SELECT 
			t.id, 
			t.goal_id, 
			t.user_id, 
			COALESCE(t.description, ''),
			COALESCE(g.nickname, ''),
			COALESCE(g.title, '')
		FROM todos t
		LEFT JOIN goals g ON t.goal_id = g.id
		ORDER BY t.created_at ASC, t.id ASC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Todo, 0)
	for rows.Next() {
		var item model.Todo
		if err := rows.Scan(&item.ID, &item.GoalID, &item.UserID, &item.Description, &item.GoalNickname, &item.GoalTitle); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *sqlTodoRepository) GetTodoByID(ctx context.Context, id uuid.UUID) (*model.Todo, error) {
	var item model.Todo
	query := `
		SELECT 
			t.id, 
			t.goal_id, 
			t.user_id, 
			COALESCE(t.description, ''),
			COALESCE(g.nickname, ''),
			COALESCE(g.title, '')
		FROM todos t
		LEFT JOIN goals g ON t.goal_id = g.id
		WHERE t.id = $1
	`
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&item.ID, &item.GoalID, &item.UserID, &item.Description, &item.GoalNickname, &item.GoalTitle,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *sqlTodoRepository) GetAllNotTodos(ctx context.Context) ([]model.NotTodo, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, title, description, created_at FROM not_todos ORDER BY id ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.NotTodo, 0)
	for rows.Next() {
		var item model.NotTodo
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *sqlTodoRepository) CreateTodo(ctx context.Context, description string, goalID *uuid.UUID, userID *uuid.UUID) (*model.Todo, error) {
	var createdID uuid.UUID
	err := r.db.QueryRowContext(
		ctx,
		"INSERT INTO todos (description, goal_id, user_id) VALUES ($1, $2, $3) RETURNING id",
		description, goalID, userID,
	).Scan(&createdID)
	if err != nil {
		return nil, err
	}
	return r.GetTodoByID(ctx, createdID)
}
