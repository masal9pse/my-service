package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// Response は汎用のAPIレスポンス構造体
type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

// NotTodo は not_todos テーブルのレコード構造体
type NotTodo struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description *string    `json:"description"`
	CreatedAt   *time.Time `json:"created_at"`
}

var db *sql.DB

// 接続文字列をGo (lib/pq) 向けに正規化する
// 1. Prisma用の `?pgbouncer=true` などの非対応パラメータを除去
// 2. SSL必須のSupabase用に `sslmode=require` を設定
func cleanDatabaseURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	q := u.Query()
	q.Del("pgbouncer")
	if q.Get("sslmode") == "" {
		q.Set("sslmode", "require")
	}
	u.RawQuery = q.Encode()
	return u.String()
}

func main() {
	// Cloud Run は環境変数 PORT を指定してくるため、それに合わせる
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Supabase (PostgreSQL) 接続文字列の取得
	// DIRECT_URL (ポート5432) または DATABASE_URL (ポート6543) のどちらでもOK
	dbURL := os.Getenv("DIRECT_URL")
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}

	if dbURL == "" {
		log.Println("WARNING: Neither DIRECT_URL nor DATABASE_URL is set. /not-todos endpoint will return an error.")
	} else {
		cleanedURL := cleanDatabaseURL(dbURL)
		var err error
		db, err = sql.Open("postgres", cleanedURL)
		if err != nil {
			log.Printf("ERROR: Failed to open database connection: %v\n", err)
		} else {
			db.SetMaxOpenConns(10)
			db.SetMaxIdleConns(5)
			db.SetConnMaxLifetime(5 * time.Minute)

			if err := db.Ping(); err != nil {
				log.Printf("WARNING: Database ping failed: %v\n", err)
			} else {
				log.Println("Successfully connected to Supabase PostgreSQL database!")
			}
		}
	}

	// ルーティング設定
	http.HandleFunc("/hello", handleHello)
	http.HandleFunc("/not-todos", handleNotTodos)
	http.HandleFunc("/not_todos", handleNotTodos)

	log.Printf("Server is running on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// CORS対応用ヘルパー
func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

// GET /hello
func handleHello(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	response := Response{
		Message: "Hello from Cloud Run with Go12345!",
		Status:  "success",
	}
	json.NewEncoder(w).Encode(response)
}

// GET /not-todos (および /not_todos)
func handleNotTodos(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
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

	if db == nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "DATABASE_URL or DIRECT_URL is not configured or database connection failed.",
		})
		return
	}

	rows, err := db.Query("SELECT id, title, description, created_at FROM not_todos ORDER BY id ASC")
	if err != nil {
		log.Printf("Error querying not_todos: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to fetch not-todos from database: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	items := make([]NotTodo, 0)
	for rows.Next() {
		var item NotTodo
		if err := rows.Scan(&item.ID, &item.Title, &item.Description, &item.CreatedAt); err != nil {
			log.Printf("Error scanning row: %v\n", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Failed to parse data: " + err.Error(),
			})
			return
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Row iteration error: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to iterate rows: " + err.Error(),
		})
		return
	}

	json.NewEncoder(w).Encode(items)
}