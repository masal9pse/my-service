package handler

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDContextKey contextKey = "userID"

var (
	ErrNoJWKSKeyfunc = errors.New("authentication service is not properly configured")
	ErrMissingBearer = errors.New("missing or invalid Authorization header. Expected format: 'Bearer <token>'")
	ErrEmptyToken    = errors.New("bearer token is empty")
	ErrInvalidToken  = errors.New("unauthorized: invalid or expired token")
)

// SetCORSHeaders はCORS対応用ヘッダーを設定します
func SetCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")
}

// ValidateBearerToken は Authorization ヘッダーから JWT を取り出して署名・有効期限を検証します。
// 成功した場合は sub (ユーザーUUID) を返します。
func ValidateBearerToken(authHeader string, jwksKeyfunc jwt.Keyfunc) (string, error) {
	if jwksKeyfunc == nil {
		return "", ErrNoJWKSKeyfunc
	}
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", ErrMissingBearer
	}
	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if tokenString == "" {
		return "", ErrEmptyToken
	}

	token, err := jwt.Parse(tokenString, jwksKeyfunc)
	if err != nil || !token.Valid {
		log.Printf("JWT verification failed: %v\n", err)
		return "", ErrInvalidToken
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if sub, ok := claims["sub"].(string); ok {
			return sub, nil
		}
	}
	return "", nil
}

// AuthMiddleware は Supabase JWT の署名・有効期限を JWKS で検証するミドルウェアです
func AuthMiddleware(jwksKeyfunc jwt.Keyfunc, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		SetCORSHeaders(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		sub, err := ValidateBearerToken(r.Header.Get("Authorization"), jwksKeyfunc)
		if err != nil {
			if errors.Is(err, ErrNoJWKSKeyfunc) {
				w.WriteHeader(http.StatusInternalServerError)
			} else {
				w.WriteHeader(http.StatusUnauthorized)
			}
			json.NewEncoder(w).Encode(map[string]string{
				"error": err.Error(),
			})
			return
		}

		// 認証成功: context に userID を保存
		if sub != "" {
			ctx := context.WithValue(r.Context(), UserIDContextKey, sub)
			r = r.WithContext(ctx)
		}

		next(w, r)
	}
}
