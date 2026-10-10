package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"myapi/internal/model"
	"myapi/internal/repository"
)

type TodoHandler struct {
	repo    repository.TodoRepository
	keyfunc jwt.Keyfunc
}

func NewTodoHandler(repo repository.TodoRepository, keyfunc jwt.Keyfunc) *TodoHandler {
	return &TodoHandler{repo: repo, keyfunc: keyfunc}
}

// HandleHello は GET /hello のハンドラーです
func (h *TodoHandler) HandleHello(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	response := model.Response{
		Message: "Hello from Cloud Run with Go!",
		Status:  "success",
	}
	json.NewEncoder(w).Encode(response)
}

// HandleTodosRoute は GET/POST /todos または GET /todos/{id} のルーティングラッパーです
// ブラウザからの直接アクセス (Accept に text/html が含まれる GET リクエスト) の場合は SPA の index.html を返却します
func (h *TodoHandler) HandleTodosRoute(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && strings.Contains(r.Header.Get("Accept"), "text/html") {
			indexPath := filepath.Join(staticDir, "index.html")
			if _, err := os.Stat(indexPath); err == nil {
				http.ServeFile(w, r, indexPath)
				return
			}
		}
		h.HandleTodos(w, r)
	}
}

// HandleTodos は GET /todos (一覧) および GET /todos/{id} (詳細)、POST /todos (作成)、または GET/POST /api/todos を処理します
func (h *TodoHandler) HandleTodos(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if h.repo == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Database connection is not configured or failed to initialize.",
		})
		return
	}

	if r.Method == http.MethodPost {
		h.handleCreateTodo(w, r)
		return
	}

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Method not allowed. Use GET or POST.",
		})
		return
	}

	// パスからIDを取得 (例: /todos/123 や /api/todos/123)
	pathTrimmed := strings.Trim(r.URL.Path, "/")
	var idStr string
	parts := strings.Split(pathTrimmed, "/")
	if len(parts) >= 2 && (parts[0] == "todos" || (parts[0] == "api" && parts[1] == "todos" && len(parts) >= 3)) {
		if parts[0] == "todos" {
			idStr = parts[1]
		} else {
			idStr = parts[2]
		}
	} else if qID := r.URL.Query().Get("id"); qID != "" {
		idStr = qID
	}

	// 個別Todoの取得
	if idStr != "" {
		id, err := strconv.ParseInt(idStr, 10, 64)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid id parameter",
			})
			return
		}

		item, err := h.repo.GetTodoByID(r.Context(), id)
		if errors.Is(err, repository.ErrNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Todo not found",
			})
			return
		} else if err != nil {
			log.Printf("Error querying todo by id: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch todo: " + err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(item)
		return
	}

	// 全件取得
	items, err := h.repo.GetAllTodos(r.Context())
	if err != nil {
		log.Printf("Error querying todos: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to fetch todos from database: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(items)
}

// HandleNotTodos は GET /not-todos (および /not_todos) を処理します
func (h *TodoHandler) HandleNotTodos(w http.ResponseWriter, r *http.Request) {
	SetCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Method not allowed. Use GET.",
		})
		return
	}

	if h.repo == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Database connection is not configured or failed to initialize.",
		})
		return
	}

	items, err := h.repo.GetAllNotTodos(r.Context())
	if err != nil {
		log.Printf("Error querying not_todos: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to fetch not-todos from database: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(items)
}

// handleCreateTodo は POST /todos および POST /api/todos のリクエストを処理して新規Todoを作成します（要認証）
func (h *TodoHandler) handleCreateTodo(w http.ResponseWriter, r *http.Request) {
	// 登録処理はログイン必須（JWT検証）
	sub, err := ValidateBearerToken(r.Header.Get("Authorization"), h.keyfunc)
	if err != nil {
		if errors.Is(err, ErrNoJWKSKeyfunc) {
			w.WriteHeader(http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusUnauthorized)
		}
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Authentication required to create todo: " + err.Error(),
		})
		return
	}
	if sub != "" {
		log.Printf("Authorized user %s creating todo\n", sub)
	}

	var req model.CreateTodoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	trimmed := strings.TrimSpace(req.Description)
	if trimmed == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Description cannot be empty",
		})
		return
	}

	item, err := h.repo.CreateTodo(r.Context(), trimmed)
	if err != nil {
		log.Printf("Error creating todo: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to create todo: " + err.Error(),
		})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}
