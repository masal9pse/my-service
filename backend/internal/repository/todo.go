package repository

import (
	"context"
	"database/sql"
	"errors"

	"myapi/internal/model"
)

var (
	ErrNotFound = errors.New("record not found")
)

type TodoRepository interface {
	GetAllTodos(ctx context.Context) ([]model.Todo, error)
	GetTodoByID(ctx context.Context, id int64) (*model.Todo, error)
	GetAllNotTodos(ctx context.Context) ([]model.NotTodo, error)
}

type sqlTodoRepository struct {
	db *sql.DB
}

func NewTodoRepository(db *sql.DB) TodoRepository {
	return &sqlTodoRepository{db: db}
}

func (r *sqlTodoRepository) GetAllTodos(ctx context.Context) ([]model.Todo, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT id, COALESCE(description, '') FROM todos ORDER BY id ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Todo, 0)
	for rows.Next() {
		var item model.Todo
		if err := rows.Scan(&item.ID, &item.Description); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (r *sqlTodoRepository) GetTodoByID(ctx context.Context, id int64) (*model.Todo, error) {
	var item model.Todo
	err := r.db.QueryRowContext(ctx, "SELECT id, COALESCE(description, '') FROM todos WHERE id = $1", id).Scan(&item.ID, &item.Description)
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
