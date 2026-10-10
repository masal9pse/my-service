package handler

import (
	"encoding/json"
	"net/http"

	"myapi/internal/config"
)

// PublicConfigResponse はクライアント公開用の設定レスポンスです
type PublicConfigResponse struct {
	SupabaseURL     string `json:"supabaseUrl"`
	SupabaseAnonKey string `json:"supabaseAnonKey"`
}

// HandleConfig は GET /api/config のハンドラーです。
// フロントエンドに必要な公開設定情報（Supabase URL および Anon Key）を返却します。
func HandleConfig(dbURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		SetCORSHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		res := PublicConfigResponse{
			SupabaseURL:     config.FindSupabaseURL(dbURL),
			SupabaseAnonKey: config.FindSupabaseAnonKey(),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}
}
