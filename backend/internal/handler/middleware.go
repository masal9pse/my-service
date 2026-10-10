package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDContextKey contextKey = "userID"

// SetCORSHeaders はCORS対応用ヘッダーを設定します
func SetCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

// AuthMiddleware は Supabase JWT の署名・有効期限を JWKS で検証するミドルウェアです
func AuthMiddleware(jwksKeyfunc jwt.Keyfunc, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		SetCORSHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if jwksKeyfunc == nil {
			log.Println("ERROR: Supabase JWKS is not initialized. Authentication unavailable.")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Authentication service is not properly configured.",
			})
			return
		}

		authHeader := r.Header.Get("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Missing or invalid Authorization header. Expected format: 'Bearer <token>'.",
			})
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if tokenString == "" {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Bearer token is empty.",
			})
			return
		}

		token, err := jwt.Parse(tokenString, jwksKeyfunc)
		if err != nil || !token.Valid {
			log.Printf("JWT verification failed: %v\n", err)
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "Unauthorized: invalid or expired token.",
			})
			return
		}

		// 認証成功: claims から sub (User UUID) を取り出して Context に格納
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if sub, ok := claims["sub"].(string); ok {
				ctx := context.WithValue(r.Context(), UserIDContextKey, sub)
				r = r.WithContext(ctx)
			}
		}

		next(w, r)
	}
}
