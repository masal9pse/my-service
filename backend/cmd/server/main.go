package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/golang-jwt/jwt/v5"

	"myapi/internal/config"
	"myapi/internal/handler"
	"myapi/internal/repository"
)

func findStaticDir() string {
	candidates := []string{
		"frontend/dist",
		"../frontend/dist",
	}
	for _, dir := range candidates {
		if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
			return dir
		}
	}
	return "frontend/dist"
}

func main() {
	// Cloud Run は環境変数 PORT を指定してくるため、それに合わせる
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Supabase (PostgreSQL) 接続文字列の取得 & 初期化
	dbURL := config.FindDatabaseURL()
	db, err := config.ConnectDB(dbURL)
	if err != nil {
		log.Printf("WARNING: %v\n", err)
	}

	// Supabase JWKS (公開鍵) の初期化
	jwksURL := config.FindJWKSURL(dbURL)
	var keyfunc jwt.Keyfunc
	if jwksURL == "" {
		log.Println("WARNING: Supabase URL (SUPABASE_URL) is not found. Auth middleware will reject requests.")
	} else {
		kf, err := config.InitJWKS(jwksURL)
		if err != nil {
			log.Printf("ERROR: Failed to initialize JWKS: %v\n", err)
		} else {
			keyfunc = kf
		}
	}

	// リポジトリ & ハンドラー初期化
	var repo repository.TodoRepository
	if db != nil {
		repo = repository.NewTodoRepository(db)
	}
	todoHandler := handler.NewTodoHandler(repo, keyfunc)

	// 静的フロントエンド配信ディレクトリの判定
	staticDir := findStaticDir()

	// ルーティング設定
	http.HandleFunc("/hello", todoHandler.HandleHello)
	http.HandleFunc("/not-todos", todoHandler.HandleNotTodos)
	http.HandleFunc("/not_todos", todoHandler.HandleNotTodos)
	http.HandleFunc("/todos", todoHandler.HandleTodosRoute(staticDir))
	http.HandleFunc("/todos/", todoHandler.HandleTodosRoute(staticDir))
	http.HandleFunc("/api/todos", todoHandler.HandleTodos)
	http.HandleFunc("/api/todos/", todoHandler.HandleTodos)

	if _, err := os.Stat(filepath.Join(staticDir, "index.html")); err == nil {
		log.Printf("Serving frontend from %s...", staticDir)
		http.HandleFunc("/", handler.SPAHandler(staticDir))
	} else {
		log.Println("Frontend build not found, serving API only mode.")
	}

	log.Printf("Server is running on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
