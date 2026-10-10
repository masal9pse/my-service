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
	CreateTodo(ctx context.Context, description string) (*model.Todo, error)
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

// CreateTodo は todos テーブルに新規レコードを追加します。
//
// 【セキュリティ解説: なぜこの書き方が安全なのか？】
// 1. SQLインジェクション対策（パラメータ化クエリ / プレースホルダ）:
//    SQL文の中に文字列を直接連結（fmt.Sprintf等）せず、"$1" というプレースホルダ（穴埋め用の枠）を使用しています。
//    値（description）を QueryRowContext の別引数として渡すことで、データベース側で「SQLの命令」と「データ」が明確に分離されます。
//    そのため、悪意のある文字列（例: "'; DROP TABLE todos; --"）が入力されても、
//    単なる「1つの文章データ」として保存されるだけであり、不正なSQL命令として実行されることは絶対にありません。
//
// 2. COALESCE(description, '') の役割:
//    万が一カラム値が NULL だった場合に空文字 "" にフォールバックします。
//    Goの string 型変数に NULL を読み込もうとした時のスキャンエラーを防止するための型安全対策です。
func (r *sqlTodoRepository) CreateTodo(ctx context.Context, description string) (*model.Todo, error) {
	var item model.Todo
	err := r.db.QueryRowContext(
		ctx,
		// $1 に description の値が安全にバインドされます
		"INSERT INTO todos (description) VALUES ($1) RETURNING id, COALESCE(description, '')",
		description,
	).Scan(&item.ID, &item.Description)
	if err != nil {
		return nil, err
	}
	return &item, nil
}
