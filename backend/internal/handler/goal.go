package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"uuid"

	"github.com/golang-jwt/jwt/v5"

	"myapi/internal/model"
	"myapi/internal/repository"
)

type GoalHandler struct {
	repo    repository.GoalRepository
	keyfunc jwt.Keyfunc
}

func NewGoalHandler(repo repository.GoalRepository, keyfunc jwt.Keyfunc) *GoalHandler {
	return &GoalHandler{repo: repo, keyfunc: keyfunc}
}

// HandleGoalsRoute は SPA用のルートラッパーです
func (h *GoalHandler) HandleGoalsRoute(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && strings.Contains(r.Header.Get("Accept"), "text/html") {
			indexPath := filepath.Join(staticDir, "index.html")
			if _, err := os.Stat(indexPath); err == nil {
				http.ServeFile(w, r, indexPath)
				return
			}
		}
		h.HandleGoals(w, r)
	}
}

// HandleGoals は GET /goals (一覧), GET /goals/{id} (詳細), POST /goals (作成) を処理します
func (h *GoalHandler) HandleGoals(w http.ResponseWriter, r *http.Request) {
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
		h.handleCreateGoal(w, r)
		return
	}

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Method not allowed. Use GET or POST.",
		})
		return
	}

	// パスからIDを取得 (/goals/{id} または /api/goals/{id})
	pathTrimmed := strings.Trim(r.URL.Path, "/")
	var idStr string
	parts := strings.Split(pathTrimmed, "/")
	if len(parts) >= 2 && (parts[0] == "goals" || (parts[0] == "api" && parts[1] == "goals" && len(parts) >= 3)) {
		if parts[0] == "goals" {
			idStr = parts[1]
		} else {
			idStr = parts[2]
		}
	} else if qID := r.URL.Query().Get("id"); qID != "" {
		idStr = qID
	}

	// 個別Goalの取得
	if idStr != "" {
		id, err := uuid.Parse(idStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Invalid UUID parameter",
			})
			return
		}

		item, err := h.repo.GetGoalByID(r.Context(), id)
		if errors.Is(err, repository.ErrNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Goal not found",
			})
			return
		} else if err != nil {
			log.Printf("Error querying goal by id: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to fetch goal: " + err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(item)
		return
	}

	// 認証ヘッダーがあればそのユーザーのIDを抽出して絞り込み
	var userUUID *uuid.UUID
	if authHeader := r.Header.Get("Authorization"); authHeader != "" {
		if sub, err := ValidateBearerToken(authHeader, h.keyfunc); err == nil && sub != "" {
			if parsed, err := uuid.Parse(sub); err == nil {
				userUUID = &parsed
			}
		}
	}

	// 全件取得
	items, err := h.repo.GetAllGoals(r.Context(), userUUID)
	if err != nil {
		log.Printf("Error querying goals: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to fetch goals from database: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(items)
}

func (h *GoalHandler) handleCreateGoal(w http.ResponseWriter, r *http.Request) {
	// 登録処理はログイン必須（JWT検証）
	sub, err := ValidateBearerToken(r.Header.Get("Authorization"), h.keyfunc)
	if err != nil {
		if errors.Is(err, ErrNoJWKSKeyfunc) {
			w.WriteHeader(http.StatusInternalServerError)
		} else {
			w.WriteHeader(http.StatusUnauthorized)
		}
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Authentication required to create goal: " + err.Error(),
		})
		return
	}

	userID, err := uuid.Parse(sub)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid user subject in token",
		})
		return
	}

	var req model.CreateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	trimmedTitle := strings.TrimSpace(req.Title)
	if trimmedTitle == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Goal title cannot be empty",
		})
		return
	}

	item, err := h.repo.CreateGoal(r.Context(), userID, trimmedTitle, req.Description, req.Deadline)
	if err != nil {
		log.Printf("Error creating goal: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to create goal: " + err.Error(),
		})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}
