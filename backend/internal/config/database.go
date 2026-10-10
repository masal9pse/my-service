package config

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/lib/pq"
)

// ConnectDB は Supabase PostgreSQL への接続を初期化します
func ConnectDB(rawURL string) (*sql.DB, error) {
	if rawURL == "" {
		return nil, fmt.Errorf("database URL is empty")
	}

	cleanedURL := CleanDatabaseURL(rawURL)
	db, err := sql.Open("postgres", cleanedURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("WARNING: Database ping failed: %v\n", err)
	} else {
		log.Println("Successfully connected to Supabase PostgreSQL database!")
	}

	return db, nil
}

// InitJWKS は Supabase JWKS (公開鍵) の keyfunc を初期化します
func InitJWKS(jwksURL string) (jwt.Keyfunc, error) {
	if jwksURL == "" {
		return nil, fmt.Errorf("jwks URL is empty")
	}

	log.Printf("Initializing Supabase JWKS from: %s\n", jwksURL)
	k, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize JWKS: %w", err)
	}

	log.Println("Successfully initialized Supabase JWKS keyfunc!")
	return k.Keyfunc, nil
}
